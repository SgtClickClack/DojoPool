// Frame capture and processing
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

// Reusable canvas elements
let captureCanvas: HTMLCanvasElement | null = null;
let captureContext: CanvasRenderingContext2D | null = null;

export async function captureFrame(): Promise<ImageData | null> {
  const videoElement = document.getElementById(
    'game-video'
  ) as HTMLVideoElement;
  if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
    throw new Error('Invalid video element or dimensions');
  }

  // Initialize canvas once
  if (!captureCanvas || !captureContext) {
    captureCanvas = document.createElement('canvas');
    captureContext = captureCanvas.getContext('2d', { alpha: false });
    if (!captureContext) {
      throw new Error('Failed to get canvas context');
    }
    captureCanvas.width = videoElement.videoWidth;
    captureCanvas.height = videoElement.videoHeight;
  }

  // Only update dimensions if video size changed
  if (
    captureCanvas.width !== videoElement.videoWidth ||
    captureCanvas.height !== videoElement.videoHeight
  ) {
    captureCanvas.width = videoElement.videoWidth;
    captureCanvas.height = videoElement.videoHeight;
  }

  captureContext.drawImage(videoElement, 0, 0);
  return captureContext.getImageData(
    0,
    0,
    captureCanvas.width,
    captureCanvas.height
  );
}

export async function validateFrame(
  imageData: ImageData | null
): Promise<ImageData | null> {
  if (!imageData) {
    throw new Error('No frame data available');
  }
  return imageData;
}

export function cleanup(): void {
  if (captureCanvas) {
    captureCanvas.width = 0;
    captureCanvas.height = 0;
    captureCanvas = null;
    captureContext = null;
  }
}

export { FRAME_INTERVAL, TARGET_FPS };
