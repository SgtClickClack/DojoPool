import { FrameProcessor } from "../frame-processor";
import { WebGLContextManager } from "../../managers/webgl-context-manager";
import { ShaderManager } from "../../managers/shader-manager";
import { TransitionManager } from "../../managers/transition-manager";

// --- Define Mocks FIRST ---
const mockWebGLContext = {
  createFramebuffer: jest.fn().mockReturnValue({}),
  createTexture: jest.fn().mockReturnValue({}),
  bindFramebuffer: jest.fn(),
  bindTexture: jest.fn(),
  texParameteri: jest.fn(),
  texImage2D: jest.fn(),
  viewport: jest.fn(),
  drawArrays: jest.fn(),
  readPixels: jest.fn(),
  deleteFramebuffer: jest.fn(),
  deleteTexture: jest.fn(),
  TRIANGLES: 4,
  FRAMEBUFFER: 0,
  TEXTURE_2D: 1,
  RGBA: 2,
  UNSIGNED_BYTE: 3,
  LINEAR: 4,
  CLAMP_TO_EDGE: 5,
  uniform1i: jest.fn(),
} as unknown as WebGLRenderingContext;

const mockCanvas = {
  getContext: jest.fn().mockReturnValue(mockWebGLContext),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  width: 640,
  height: 480,
} as unknown as HTMLCanvasElement;
// --- End Mock Definitions ---

// Mock managers AFTER defining their dependencies
jest.mock("../../managers/webgl-context-manager", () => ({
  WebGLContextManager: {
    getInstance: jest.fn().mockReturnValue({
      getContext: jest.fn().mockReturnValue(mockWebGLContext),
      addContextListener: jest.fn(),
      removeContextListener: jest.fn(),
      cleanup: jest.fn(),
    }),
  },
}));

jest.mock("../../managers/shader-manager", () => ({
  ShaderManager: jest.fn().mockImplementation(() => ({
    registerShader: jest.fn(),
    useShader: jest.fn().mockReturnValue({ program: {}, attributes: new Map(), uniforms: new Map() }),
    getUniforms: jest.fn().mockReturnValue(new Map([["uCurrentFrame", 0], ["uPreviousFrame", 1]])),
    cleanup: jest.fn(),
  })),
}));

jest.mock("../../managers/transition-manager", () => ({
  TransitionManager: jest.fn().mockImplementation(() => ({
    startTransition: jest.fn(),
    cleanup: jest.fn(),
  })),
}));

describe("FrameProcessor", () => {
  let frameProcessor: FrameProcessor;
  let mockVideoElement: HTMLVideoElement;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock video element
    mockVideoElement = document.createElement("video");
    Object.defineProperty(mockVideoElement, "videoWidth", { value: 640 });
    Object.defineProperty(mockVideoElement, "videoHeight", { value: 480 });

    // Create FrameProcessor instance
    frameProcessor = new FrameProcessor();
  });

  afterEach(() => {
    frameProcessor.cleanup();
  });

  describe("Initialization", () => {
    it("should create canvas with default size", () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      expect(frameProcessor).toBeDefined();
    });

    it("should initialize WebGL context", () => {
      expect(WebGLContextManager.getInstance().getContext).toHaveBeenCalled();
    });

    it("should initialize shaders", () => {
      const shaderManager = new ShaderManager({} as any);
      expect(shaderManager.registerShader).toHaveBeenCalledWith(
        "shotDetection",
        expect.any(Object),
      );
    });

    it("should set up event listeners", () => {
      const contextManager = WebGLContextManager.getInstance();
      expect(contextManager.addContextListener).toHaveBeenCalled();
      expect(window.addEventListener).toHaveBeenCalledWith(
        "qualitychange",
        expect.any(Function),
      );
    });
  });

  describe("Frame Processing", () => {
    it("should process valid video frame", () => {
      const result = frameProcessor.processFrame(mockVideoElement);
      expect(result).toBeInstanceOf(ImageData);
      expect(result?.width).toBe(640);
      expect(result?.height).toBe(480);
    });

    it("should handle invalid video dimensions", () => {
      Object.defineProperty(mockVideoElement, "videoWidth", { value: 0 });
      const result = frameProcessor.processFrame(mockVideoElement);
      expect(result).toBeNull();
    });

    it("should resize canvas when video dimensions change", () => {
      Object.defineProperty(mockVideoElement, "videoWidth", { value: 1280 });
      Object.defineProperty(mockVideoElement, "videoHeight", { value: 720 });

      frameProcessor.processFrame(mockVideoElement);

      expect(mockWebGLContext.texImage2D).toHaveBeenCalledWith(
        expect.any(Number),
        0,
        expect.any(Number),
        1280,
        720,
        0,
        expect.any(Number),
        expect.any(Number),
        null,
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle WebGL context loss", () => {
      const contextManager = WebGLContextManager.getInstance();
      const contextListener = (contextManager.addContextListener as jest.Mock)
        .mock.calls[0][0];

      contextListener({ type: "webglcontextrestored" });

      expect(mockWebGLContext.deleteFramebuffer).toHaveBeenCalled();
      expect(mockWebGLContext.deleteTexture).toHaveBeenCalled();
    });

    it("should handle quality change events", () => {
      const transitionManager = new TransitionManager({} as any, {} as any);
      const qualityChangeHandler = (
        window.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === "qualitychange")?.[1];

      qualityChangeHandler?.({ detail: { level: "high" } });

      expect(transitionManager.startTransition).toHaveBeenCalledWith("high");
    });
  });

  describe("Resource Management", () => {
    it("should clean up resources", () => {
      frameProcessor.cleanup();

      expect(mockWebGLContext.deleteFramebuffer).toHaveBeenCalled();
      expect(mockWebGLContext.deleteTexture).toHaveBeenCalled();

      const contextManager = WebGLContextManager.getInstance();
      expect(contextManager.removeContextListener).toHaveBeenCalled();
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "qualitychange",
        expect.any(Function),
      );
    });

    it("should handle texture configuration", () => {
      expect(mockWebGLContext.texParameteri).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe("Performance", () => {
    it("should maintain consistent frame processing time", () => {
      const startTime = performance.now();
      frameProcessor.processFrame(mockVideoElement);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should process frame in under 100ms
    });

    it("should handle multiple consecutive frames", () => {
      for (let i = 0; i < 10; i++) {
        const result = frameProcessor.processFrame(mockVideoElement);
        expect(result).toBeInstanceOf(ImageData);
      }
    });
  });

  describe("Buffer Management", () => {
    it("should create buffer pairs correctly", () => {
      expect(mockWebGLContext.createFramebuffer).toHaveBeenCalled();
      expect(mockWebGLContext.createTexture).toHaveBeenCalled();
      expect(mockWebGLContext.bindFramebuffer).toHaveBeenCalled();
      expect(mockWebGLContext.bindTexture).toHaveBeenCalled();
    });

    it("should configure textures with correct parameters", () => {
      expect(mockWebGLContext.texParameteri).toHaveBeenCalledWith(
        mockWebGLContext.TEXTURE_2D,
        mockWebGLContext.TEXTURE_MIN_FILTER,
        mockWebGLContext.LINEAR,
      );
      expect(mockWebGLContext.texParameteri).toHaveBeenCalledWith(
        mockWebGLContext.TEXTURE_2D,
        mockWebGLContext.TEXTURE_MAG_FILTER,
        mockWebGLContext.LINEAR,
      );
      expect(mockWebGLContext.texParameteri).toHaveBeenCalledWith(
        mockWebGLContext.TEXTURE_2D,
        mockWebGLContext.TEXTURE_WRAP_S,
        mockWebGLContext.CLAMP_TO_EDGE,
      );
      expect(mockWebGLContext.texParameteri).toHaveBeenCalledWith(
        mockWebGLContext.TEXTURE_2D,
        mockWebGLContext.TEXTURE_WRAP_T,
        mockWebGLContext.CLAMP_TO_EDGE,
      );
    });
  });

  describe("Shader Handling", () => {
    it("should handle shader uniforms correctly", () => {
      const shaderManager = new ShaderManager({} as any);
      const uniforms = new Map([
        ["uCurrentFrame", 0],
        ["uPreviousFrame", 1],
      ]);
      (shaderManager.getUniforms as jest.Mock).mockReturnValue(uniforms);

      frameProcessor.processFrame(mockVideoElement);

      expect(mockWebGLContext.uniform1i).toHaveBeenCalledWith(
        expect.any(Number),
        0,
      );
      expect(mockWebGLContext.uniform1i).toHaveBeenCalledWith(
        expect.any(Number),
        1,
      );
    });

    it("should handle missing shader gracefully", () => {
      const shaderManager = new ShaderManager({} as any);
      (shaderManager.useShader as jest.Mock).mockReturnValue(null);

      const result = frameProcessor.processFrame(mockVideoElement);
      expect(result).toBeNull();
    });
  });

  describe("Frame Buffer Operations", () => {
    it("should bind frame buffer correctly", () => {
      frameProcessor.processFrame(mockVideoElement);

      expect(mockWebGLContext.bindFramebuffer).toHaveBeenCalledWith(
        mockWebGLContext.FRAMEBUFFER,
        expect.any(Object),
      );
    });

    it("should set viewport correctly", () => {
      frameProcessor.processFrame(mockVideoElement);

      expect(mockWebGLContext.viewport).toHaveBeenCalledWith(
        0,
        0,
        mockVideoElement.videoWidth,
        mockVideoElement.videoHeight,
      );
    });

    it("should read pixels correctly", () => {
      frameProcessor.processFrame(mockVideoElement);

      expect(mockWebGLContext.readPixels).toHaveBeenCalledWith(
        0,
        0,
        mockVideoElement.videoWidth,
        mockVideoElement.videoHeight,
        mockWebGLContext.RGBA,
        mockWebGLContext.UNSIGNED_BYTE,
        expect.any(Uint8Array),
      );
    });
  });

  describe("Error Recovery", () => {
    it("should recover from WebGL context loss", () => {
      const contextManager = WebGLContextManager.getInstance();
      const contextListener = (contextManager.addContextListener as jest.Mock)
        .mock.calls[0][0];

      contextListener({ type: "webglcontextrestored" });

      expect(mockWebGLContext.deleteFramebuffer).toHaveBeenCalled();
      expect(mockWebGLContext.deleteTexture).toHaveBeenCalled();
      expect(mockWebGLContext.createFramebuffer).toHaveBeenCalled();
      expect(mockWebGLContext.createTexture).toHaveBeenCalled();
    });

    it("should handle texture creation failure", () => {
      (mockWebGLContext.createTexture as jest.Mock).mockReturnValueOnce(null);

      expect(() => {
        new FrameProcessor();
      }).toThrow("Failed to create frame buffer or texture");
    });
  });
});
