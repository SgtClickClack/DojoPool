import { WebGLContextManager } from "../webgl-context-manager";
import { DeviceProfileManager } from "../device-profile-manager";
import { PerformanceProfiler } from "../performance-profiler";

// Mock WebGL context
const mockWebGLContext = {
  getExtension: jest.fn(),
  getSupportedExtensions: jest.fn().mockReturnValue([]),
  hint: jest.fn(),
  pixelStorei: jest.fn(),
  enable: jest.fn(),
  blendFunc: jest.fn(),
  disable: jest.fn(),
  createTexture: jest.fn().mockReturnValue({}),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  deleteTexture: jest.fn(),
  isContextLost: jest.fn().mockReturnValue(false),
  getParameter: jest.fn().mockReturnValue(8),
  compressedTexImage2D: jest.fn(),
  texStorage2D: jest.fn(),
  texSubImage2D: jest.fn(),
  generateMipmap: jest.fn(),
  FRAGMENT_SHADER_DERIVATIVE_HINT: 0,
  GENERATE_MIPMAP_HINT: 1,
  UNPACK_FLIP_Y_WEBGL: 2,
  BLEND: 3,
  SRC_ALPHA: 4,
  ONE_MINUS_SRC_ALPHA: 5,
  DITHER: 6,
  TEXTURE_2D: 7,
  LINEAR: 8,
  NEAREST: 9,
  RGBA: 10,
  RGBA8: 11,
  UNSIGNED_BYTE: 12,
  TEXTURE_MIN_FILTER: 13,
  TEXTURE_MAG_FILTER: 14,
  FASTEST: 15,
  NICEST: 16,
  TEXTURE_WIDTH: 17,
  TEXTURE_HEIGHT: 18,
} as unknown as WebGLRenderingContext;

// Mock canvas
const mockCanvas = {
  getContext: jest.fn().mockReturnValue(mockWebGLContext),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  width: 800,
  height: 600,
} as unknown as HTMLCanvasElement;

// Mock device profile
const mockDeviceProfile = {
  getProfile: jest.fn().mockReturnValue({
    useWebGL2: false,
    isMobileDevice: false,
    maxTextureSize: 4096,
    maxTextureUnits: 8,
    maxDrawCalls: 1000,
  }),
  isMobileDevice: jest.fn().mockReturnValue(false),
} as unknown as DeviceProfileManager;

// Mock performance profiler
const mockProfiler = {
  getMetrics: jest.fn().mockReturnValue({
    drawCalls: 0,
    triangleCount: 0,
    gpuTime: 0,
  }),
} as unknown as PerformanceProfiler;

jest.mock("../device-profile-manager", () => ({
  DeviceProfileManager: {
    getInstance: jest.fn().mockReturnValue(mockDeviceProfile),
  },
}));

jest.mock("../performance-profiler", () => ({
  PerformanceProfiler: {
    getInstance: jest.fn().mockReturnValue(mockProfiler),
  },
}));

describe("WebGLContextManager", () => {
  let manager: WebGLContextManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = WebGLContextManager.getInstance({ canvas: mockCanvas });
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe("Initialization", () => {
    it("should initialize with default options", () => {
      expect(manager).toBeDefined();
      expect(mockCanvas.getContext).toHaveBeenCalledWith(
        "webgl",
        expect.any(Object),
      );
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith(
        "webglcontextlost",
        expect.any(Function),
      );
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith(
        "webglcontextrestored",
        expect.any(Function),
      );
    });

    it("should initialize with custom context attributes", () => {
      const customAttributes = {
        alpha: false,
        antialias: true,
        depth: true,
      };
      manager = WebGLContextManager.getInstance({
        canvas: mockCanvas,
        contextAttributes: customAttributes,
      });
      expect(mockCanvas.getContext).toHaveBeenCalledWith(
        "webgl",
        expect.objectContaining(customAttributes),
      );
    });

    it("should throw error if WebGL context cannot be created", () => {
      mockCanvas.getContext.mockReturnValueOnce(null);
      expect(() => {
        WebGLContextManager.getInstance({ canvas: mockCanvas });
      }).toThrow("Failed to initialize WebGL context");
    });
  });

  describe("Context Management", () => {
    it("should handle context loss and recovery", () => {
      const contextLostListener = jest.fn();
      const contextRestoredListener = jest.fn();

      manager.addContextListener(contextLostListener);
      manager.addContextListener(contextRestoredListener);

      // Simulate context loss
      mockWebGLContext.isContextLost.mockReturnValueOnce(true);
      const contextLostEvent = new Event("webglcontextlost");
      mockCanvas.dispatchEvent(contextLostEvent);

      expect(contextLostListener).toHaveBeenCalled();
      expect(mockWebGLContext.isContextLost()).toBe(true);

      // Simulate context restoration
      mockWebGLContext.isContextLost.mockReturnValueOnce(false);
      const contextRestoredEvent = new Event("webglcontextrestored");
      mockCanvas.dispatchEvent(contextRestoredEvent);

      expect(contextRestoredListener).toHaveBeenCalled();
      expect(mockWebGLContext.isContextLost()).toBe(false);
    });

    it("should maintain context state during quality transitions", () => {
      const initialQuality = manager.getQualityLevel();
      manager.setQualityLevel(2);
      expect(manager.getQualityLevel()).toBe(2);
      expect(mockWebGLContext.hint).toHaveBeenCalledWith(
        mockWebGLContext.GENERATE_MIPMAP_HINT,
        mockWebGLContext.FASTEST,
      );
    });
  });

  describe("Texture Management", () => {
    it("should create and manage textures", () => {
      const texture = manager.createTexture(256, 256);
      expect(texture).toBeDefined();
      expect(mockWebGLContext.createTexture).toHaveBeenCalled();
      expect(mockWebGLContext.bindTexture).toHaveBeenCalledWith(
        mockWebGLContext.TEXTURE_2D,
        texture,
      );
      expect(mockWebGLContext.texImage2D).toHaveBeenCalled();
    });

    it("should handle texture deletion and pooling", () => {
      const texture = manager.createTexture(256, 256);
      manager.deleteTexture(texture);
      expect(mockWebGLContext.deleteTexture).toHaveBeenCalledWith(texture);
    });

    it("should optimize texture creation for mobile devices", () => {
      mockDeviceProfile.isMobileDevice.mockReturnValueOnce(true);
      const texture = manager.createTexture(256, 256);
      expect(mockWebGLContext.texParameteri).toHaveBeenCalledWith(
        mockWebGLContext.TEXTURE_2D,
        mockWebGLContext.TEXTURE_MIN_FILTER,
        mockWebGLContext.NEAREST,
      );
    });
  });

  describe("Performance Monitoring", () => {
    it("should track performance metrics", () => {
      manager.createTexture(256, 256);
      const metrics = manager.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.fps).toBeGreaterThan(0);
      expect(metrics.drawCalls).toBeDefined();
      expect(metrics.textureMemory).toBeDefined();
    });

    it("should handle performance budget violations", () => {
      mockProfiler.getMetrics.mockReturnValueOnce({
        drawCalls: 2000,
        triangleCount: 10000,
        gpuTime: 50,
      });
      manager.createTexture(256, 256);
      const metrics = manager.getMetrics();
      expect(metrics.drawCalls).toBe(2000);
    });
  });

  describe("Cleanup", () => {
    it("should clean up resources properly", () => {
      const texture = manager.createTexture(256, 256);
      manager.cleanup();
      expect(mockWebGLContext.deleteTexture).toHaveBeenCalledWith(texture);
      expect(mockCanvas.removeEventListener).toHaveBeenCalled();
    });

    it("should handle cleanup during context loss", () => {
      mockWebGLContext.isContextLost.mockReturnValueOnce(true);
      manager.cleanup();
      expect(mockWebGLContext.deleteTexture).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle texture creation failures", () => {
      mockWebGLContext.createTexture.mockReturnValueOnce(null);
      const texture = manager.createTexture(256, 256);
      expect(texture).toBeNull();
    });

    it("should handle context loss during operations", () => {
      mockWebGLContext.isContextLost.mockReturnValueOnce(true);
      const texture = manager.createTexture(256, 256);
      expect(texture).toBeNull();
    });
  });
});
