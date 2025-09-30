import { Injectable, Logger } from '@nestjs/common';

// Lazy imports to avoid heavy WASM init during module load
let cv: any | null = null;

@Injectable()
export class ArAnalysisService {
  private readonly logger = new Logger(ArAnalysisService.name);
  private cvReady: Promise<void> | null = null;

  private async ensureCvReady() {
    if (cv) return;
    if (!this.cvReady) {
      this.cvReady = (async () => {
        try {
          // Dynamic import for ESM compatibility
          const mod = await import('@techstark/opencv-js');
          // opencv-js may export default or named; normalize
          cv = (mod as any).default ?? (mod as any);
          if (!cv || typeof cv !== 'object')
            throw new Error('OpenCV module not found');
          if (cv['onRuntimeInitialized']) {
            await new Promise<void>((resolve) => {
              cv['onRuntimeInitialized'] = () => resolve();
            });
          }
        } catch (err) {
          this.logger.error(
            `Failed to initialize OpenCV.js: ${err instanceof Error ? err.message : String(err)}`
          );
          throw err;
        }
      })();
    }
    return this.cvReady;
  }

  private async decodeImageToImageData(buffer: Buffer, mimeType?: string) {
    // Decode using jpeg-js or pngjs (no native deps)
    if (mimeType?.includes('jpeg') || mimeType?.includes('jpg')) {
      const jpeg = await import('jpeg-js');
      const decoded = (jpeg as any).default?.decode
        ? (jpeg as any).default.decode(buffer, { useTArray: true })
        : (jpeg as any).decode(buffer, { useTArray: true });
      // jpeg-js returns RGBA Uint8Array
      return {
        data: decoded.data,
        width: decoded.width,
        height: decoded.height,
      } as any;
    }
    if (mimeType?.includes('png')) {
      const { PNG } = await import('pngjs');
      const img = (PNG as any).sync.read(buffer);
      return { data: img.data, width: img.width, height: img.height } as any;
    }
    // Fallback: try jpeg, then png
    try {
      const jpeg = await import('jpeg-js');
      const decoded = (jpeg as any).default?.decode
        ? (jpeg as any).default.decode(buffer, { useTArray: true })
        : (jpeg as any).decode(buffer, { useTArray: true });
      return {
        data: decoded.data,
        width: decoded.width,
        height: decoded.height,
      } as any;
    } catch (_) {
      const { PNG } = await import('pngjs');
      const img = (
        PNG as {
          sync: {
            read: (buffer: Buffer) => {
              data: Uint8Array;
              width: number;
              height: number;
            };
          };
        }
      ).sync.read(buffer);
      return { data: img.data, width: img.width, height: img.height };
    }
  }

  async analyzeTableImage(buffer: Buffer, mimeType?: string) {
    try {
      await this.ensureCvReady();
    } catch {
      // If OpenCV fails, return graceful empty response
      return {
        tableBounds: [],
        balls: [],
        meta: { warning: 'OpenCV initialization failed' },
      };
    }

    let src: Record<string, unknown> | null = null;
    let gray: Record<string, unknown> | null = null;
    let blurred: Record<string, unknown> | null = null;
    let edges: Record<string, unknown> | null = null;
    let contours: Record<string, unknown> | null = null;
    let hierarchy: Record<string, unknown> | null = null;
    let circles: Record<string, unknown> | null = null;

    try {
      const imageData: { data: Uint8Array; width: number; height: number } =
        await this.decodeImageToImageData(buffer, mimeType);
      // Create Mat from ImageData (RGBA)
      src = cv.matFromImageData(imageData);

      // Convert to grayscale
      gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Blur to reduce noise
      blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Edge detection
      edges = new cv.Mat();
      cv.Canny(blurred, edges, 50, 150);

      // Find contours and approximate largest quadrilateral for table bounds
      contours = new cv.MatVector();
      hierarchy = new cv.Mat();
      cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      let bestQuad: {
        points: { x: number; y: number }[];
        area: number;
      } | null = null;
      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
        if (approx.rows === 4) {
          const area = Math.abs(cv.contourArea(approx));
          const data = approx.data32S;
          const pts = [
            { x: data[0], y: data[1] },
            { x: data[2], y: data[3] },
            { x: data[4], y: data[5] },
            { x: data[6], y: data[7] },
          ];
          if (!bestQuad || area > bestQuad.area) {
            bestQuad = { points: pts, area };
          }
        }
        approx.delete();
        cnt.delete();
      }

      // Circle detection for balls
      circles = new cv.Mat();
      cv.HoughCircles(
        blurred,
        circles,
        cv.HOUGH_GRADIENT,
        1,
        Math.floor((gray.rows as number) / 16),
        100,
        30,
        5,
        Math.floor(Math.min(gray.rows, gray.cols) / 8)
      );

      const balls: { position: { x: number; y: number }; radius: number }[] =
        [];
      if (circles.rows > 0 || circles.cols > 0) {
        // opencv.js stores circle data in a flat Float32Array
        const data = circles.data32F as Float32Array;
        for (let i = 0; i < data.length; i += 3) {
          const x = data[i];
          const y = data[i + 1];
          const r = data[i + 2];
          if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(r)) {
            balls.push({ position: { x, y }, radius: r });
          }
        }
      }

      const tableBounds = bestQuad ? bestQuad.points : [];
      return { tableBounds, balls };
    } catch (err) {
      this.logger.error(
        `Analysis failed: ${err instanceof Error ? err.message : String(err)}`
      );
      return { tableBounds: [], balls: [], meta: { error: 'Analysis failed' } };
    } finally {
      try {
        if (circles) circles.delete();
      } catch {}
      try {
        if (contours) contours.delete();
      } catch {}
      try {
        if (hierarchy) hierarchy.delete();
      } catch {}
      try {
        if (edges) edges.delete();
      } catch {}
      try {
        if (blurred) blurred.delete();
      } catch {}
      try {
        if (gray) gray.delete();
      } catch {}
      try {
        if (src) src.delete();
      } catch {}
    }
  }
}
