interface WasmFrameProcessor {
  new (width: number, height: number): WasmFrameProcessor;
  process_frame(data: Uint8Array): any;
  set_thresholds(brightness: number, motion: number): void;
}

interface ProcessingResult {
  detected: boolean;
  position: {
    x: number;
    y: number;
  };
  confidence: number;
}

class FrameProcessorWasm {
  private static instance: FrameProcessorWasm | null = null;
  private processor: WasmFrameProcessor | null = null;
  private width: number;
  private height: number;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private initialized: boolean = false;
  private initPromise: Promise<void>;

  private constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    this.context = ctx;

    this.initPromise = this.initialize();
  }

  public static async getInstance(
    width: number,
    height: number,
  ): Promise<FrameProcessorWasm> {
    if (!FrameProcessorWasm.instance) {
      FrameProcessorWasm.instance = new FrameProcessorWasm(width, height);
      await FrameProcessorWasm.instance.initPromise;
    }
    return FrameProcessorWasm.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // Import WebAssembly module
      const wasm = await import("../../../frame-processor/pkg");
      this.processor = new wasm.FrameProcessor(this.width, this.height);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize WebAssembly module:", error);
      throw error;
    }
  }

  public async processFrame(
    videoElement: HTMLVideoElement,
  ): Promise<ProcessingResult | null> {
    if (!this.initialized || !this.processor) {
      await this.initPromise;
    }

    // Draw video frame to canvas
    this.context.drawImage(videoElement, 0, 0, this.width, this.height);

    // Get frame data
    const imageData = this.context.getImageData(0, 0, this.width, this.height);

    // Process frame using WebAssembly
    const result = this.processor!.process_frame(imageData.data);

    return result || null;
  }

  public setThresholds(brightness: number, motion: number): void {
    if (this.processor) {
      this.processor.set_thresholds(brightness, motion);
    }
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.context;
  }
}

export default FrameProcessorWasm;
