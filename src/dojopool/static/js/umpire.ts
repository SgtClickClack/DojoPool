import { Socket } from "socket.io-client";
import { FrameProcessor } from "./processors/frame-processor";

// Constants
const FRAME_PROCESSING_INTERVAL = 33; // ~30fps

// Types and interfaces
interface UmpireState {
  isMonitoring: boolean;
  connectionStatus:
    | "connected"
    | "disconnected"
    | "error"
    | "reconnecting"
    | "failed";
  lastError?: string;
  metrics: {
    processedFrames: number;
    detectedShots: number;
    droppedFrames: number;
  };
}

interface FrameProcessingResponse {
  success: boolean;
  error?: string;
  metrics?: {
    processedFrames: number;
    detectedShots: number;
  };
}

// State variables
let socket: Socket | null = null;
let frameProcessor: FrameProcessor | null = null;
let frameProcessingId: number | null = null;
let lastFrameTime = 0;
let isProcessingFrame = false;

const umpireState: UmpireState = {
  isMonitoring: false,
  connectionStatus: "disconnected",
  metrics: {
    processedFrames: 0,
    detectedShots: 0,
    droppedFrames: 0,
  },
};

// Update UI indicators
function updateStatusIndicators(): void {
  const statusElement = document.getElementById("status-indicator");
  if (statusElement) {
    statusElement.className = `status-${umpireState.connectionStatus}`;
    statusElement.textContent = umpireState.connectionStatus;
  }

  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.textContent = umpireState.lastError || "";
  }

  const metricsElement = document.getElementById("metrics");
  if (metricsElement) {
    metricsElement.textContent = JSON.stringify(umpireState.metrics, null, 2);
  }
}

// Show error message
function showError(message: string): void {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.textContent = message;
  }
}

// Handle frame processing result
function handleFrameProcessingResult(data: FrameProcessingResponse): void {
  if (data.metrics) {
    umpireState.metrics = {
      ...umpireState.metrics,
      ...data.metrics,
    };
    updateStatusIndicators();
  }
}

// Start frame processing and monitoring
function startMonitoring(): void {
  if (
    umpireState.isMonitoring ||
    umpireState.connectionStatus !== "connected" ||
    !socket
  )
    return;

  umpireState.isMonitoring = true;
  updateStatusIndicators();

  // Initialize frame processor
  if (!frameProcessor) {
    try {
      frameProcessor = new FrameProcessor();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to initialize frame processor:", errorMessage);
      umpireState.isMonitoring = false;
      umpireState.lastError = errorMessage;
      updateStatusIndicators();
      return;
    }
  }

  // Emit start monitoring event to server
  socket.emit("start_monitoring", null, (response: FrameProcessingResponse) => {
    if (!response.success) {
      umpireState.isMonitoring = false;
      umpireState.lastError = response.error || "Failed to start monitoring";
      updateStatusIndicators();
      return;
    }
    processFrames();
  });
}

// Process frames with throttling and validation
async function processFrames(): Promise<void> {
  if (!umpireState.isMonitoring) return;

  const currentTime = performance.now();
  if (currentTime - lastFrameTime >= FRAME_PROCESSING_INTERVAL) {
    try {
      if (isProcessingFrame) return;
      isProcessingFrame = true;

      // Capture frame from video element
      const videoElement = document.getElementById(
        "game-video",
      ) as HTMLVideoElement;
      if (!videoElement) throw new Error("Video element not found");
      if (!videoElement.videoWidth || !videoElement.videoHeight) {
        throw new Error("Invalid video dimensions");
      }

      // Process frame using WebGL
      const processedFrame = frameProcessor?.processFrame(videoElement);
      if (!processedFrame) {
        throw new Error("Failed to process frame");
      }

      // Convert processed frame to blob
      const canvas = document.createElement("canvas");
      canvas.width = processedFrame.width;
      canvas.height = processedFrame.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      ctx.putImageData(processedFrame, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8),
      );

      if (!blob || blob.size === 0) {
        throw new Error("Failed to create frame blob");
      }

      // Create FormData and append the frame
      const formData = new FormData();
      formData.append("frame", blob);

      // Send frame to server
      const response = await fetch("/umpire/api/process-frame", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Server error: ${response.status}`,
        );
      }

      const data = (await response.json()) as FrameProcessingResponse;
      handleFrameProcessingResult(data);

      lastFrameTime = currentTime;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Frame processing error:", errorMessage);
      umpireState.lastError = errorMessage;
      updateStatusIndicators();

      if (
        errorMessage.includes("authentication") ||
        errorMessage.includes("unauthorized")
      ) {
        stopMonitoring();
        showError("Authentication expired. Please refresh the page.");
        return;
      }
    } finally {
      isProcessingFrame = false;
    }
  }

  // Schedule next frame
  frameProcessingId = requestAnimationFrame(processFrames);
}

// Stop monitoring and cleanup
function stopMonitoring(): void {
  if (!umpireState.isMonitoring) return;

  umpireState.isMonitoring = false;
  updateStatusIndicators();

  if (frameProcessingId) {
    cancelAnimationFrame(frameProcessingId);
    frameProcessingId = null;
  }

  // Clean up frame processor
  if (frameProcessor) {
    frameProcessor.cleanup();
    frameProcessor = null;
  }

  if (socket) {
    socket.emit("stop_monitoring");
  }
}

// Export for testing
export { startMonitoring, stopMonitoring, umpireState };
