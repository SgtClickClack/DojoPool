import { WebGLContextManager } from "../webgl-context-manager";
import { DeviceProfileManager } from "../device-profile-manager";
import { PerformanceProfiler } from "../performance-profiler";

// Mock WebGL context
const mockWebGLContext = {
  createBuffer: jest.fn().mockReturnValue({}),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  deleteBuffer: jest.fn(),
  getParameter: jest.fn().mockReturnValue(0),
  ARRAY_BUFFER: 0,
  ELEMENT_ARRAY_BUFFER: 1,
  STATIC_DRAW: 2,
  DYNAMIC_DRAW: 3,
  STREAM_DRAW: 4,
} as unknown as WebGLRenderingContext;

// Mock DeviceProfileManager
const mockDeviceProfileManager = {
  isMobileDevice: jest.fn().mockReturnValue(false),
} as unknown as DeviceProfileManager;

// Mock PerformanceProfiler
const mockPerformanceProfiler = {
  getInstance: jest.fn().mockReturnValue({
    start: jest.fn(),
    end: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({}),
  }),
} as unknown as PerformanceProfiler;

describe("BufferManager", () => {
  let webglManager: WebGLContextManager;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create canvas
    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    // Use singleton getInstance instead of new
    webglManager = WebGLContextManager.getInstance({
      canvas,
      contextAttributes: {
        alpha: true,
        depth: true,
        stencil: true,
        antialias: true,
      },
    });

    // Mock WebGL context
    (webglManager as any).contextState = {
      gl: mockWebGLContext,
      bufferPool: new Map(),
      activeBuffers: new Set(),
      bufferUsage: new Map(),
      maxBufferPoolSize: 32,
      bufferPoolCleanupThreshold: 0.8,
    };
  });

  afterEach(() => {
    webglManager.cleanup();
    // Ensure singleton is reset for next test
    // @ts-ignore
    const BaseManager = require('../base-manager').BaseManager;
    BaseManager.instances.delete('WebGLContextManager');
  });

  describe("Buffer Creation", () => {
    it("should create a new buffer", () => {
      const data = new Float32Array([1, 2, 3, 4]);
      const buffer = (webglManager as any).createBuffer(
        data,
        mockWebGLContext.ARRAY_BUFFER,
      );
      expect(buffer).toBeDefined();
      expect(mockWebGLContext.createBuffer).toHaveBeenCalled();
      expect(mockWebGLContext.bindBuffer).toHaveBeenCalledWith(
        mockWebGLContext.ARRAY_BUFFER,
        buffer,
      );
      expect(mockWebGLContext.bufferData).toHaveBeenCalledWith(
        mockWebGLContext.ARRAY_BUFFER,
        data,
        mockWebGLContext.STATIC_DRAW,
      );
    });

    it("should create buffer with specified usage", () => {
      const data = new Float32Array([1, 2, 3, 4]);
      const buffer = (webglManager as any).createBuffer(
        data,
        mockWebGLContext.ARRAY_BUFFER,
        mockWebGLContext.DYNAMIC_DRAW,
      );
      expect(buffer).toBeDefined();
      expect(mockWebGLContext.bufferData).toHaveBeenCalledWith(
        mockWebGLContext.ARRAY_BUFFER,
        data,
        mockWebGLContext.DYNAMIC_DRAW,
      );
    });

    it("should reuse buffer from pool when available", () => {
      const poolBuffer = {};
      (webglManager as any).contextState.bufferPool.set(
        mockWebGLContext.ARRAY_BUFFER,
        [poolBuffer],
      );

      const data = new Float32Array([1, 2, 3, 4]);
      const buffer = (webglManager as any).createBuffer(
        data,
        mockWebGLContext.ARRAY_BUFFER,
      );
      expect(buffer).toBe(poolBuffer);
      expect(mockWebGLContext.createBuffer).not.toHaveBeenCalled();
    });
  });

  describe("Buffer Deletion", () => {
    it("should delete buffer when pool is full", () => {
      const buffer = {};
      (webglManager as any).contextState.bufferPool.set(
        mockWebGLContext.ARRAY_BUFFER,
        Array(32).fill({}),
      );

      (webglManager as any).deleteBuffer(buffer as WebGLBuffer);
      expect(mockWebGLContext.deleteBuffer).toHaveBeenCalledWith(buffer);
    });

    it("should add buffer to pool when space available", () => {
      const buffer = {};
      (webglManager as any).deleteBuffer(buffer as WebGLBuffer);
      expect(mockWebGLContext.deleteBuffer).not.toHaveBeenCalled();
      expect(
        (webglManager as any).contextState.bufferPool.get(
          mockWebGLContext.ARRAY_BUFFER,
        ),
      ).toContain(buffer);
    });
  });

  describe("Buffer Updates", () => {
    it("should update buffer data", () => {
      const buffer = {};
      const newData = new Float32Array([5, 6, 7, 8]);

      (webglManager as any).updateBuffer(
        buffer as WebGLBuffer,
        newData,
        mockWebGLContext.ARRAY_BUFFER,
      );
      expect(mockWebGLContext.bindBuffer).toHaveBeenCalledWith(
        mockWebGLContext.ARRAY_BUFFER,
        buffer,
      );
      expect(mockWebGLContext.bufferData).toHaveBeenCalledWith(
        mockWebGLContext.ARRAY_BUFFER,
        newData,
        mockWebGLContext.STATIC_DRAW,
      );
    });

    it("should update buffer data with specified usage", () => {
      const buffer = {};
      const newData = new Float32Array([5, 6, 7, 8]);

      (webglManager as any).updateBuffer(
        buffer as WebGLBuffer,
        newData,
        mockWebGLContext.ARRAY_BUFFER,
        mockWebGLContext.DYNAMIC_DRAW,
      );
      expect(mockWebGLContext.bufferData).toHaveBeenCalledWith(
        mockWebGLContext.ARRAY_BUFFER,
        newData,
        mockWebGLContext.DYNAMIC_DRAW,
      );
    });
  });

  describe("Buffer Pool Management", () => {
    it("should clean up buffer pool when threshold exceeded", () => {
      const buffers = Array(32).fill({});
      (webglManager as any).contextState.bufferPool.set(
        mockWebGLContext.ARRAY_BUFFER,
        buffers,
      );

      (webglManager as any).cleanupBufferPool();
      expect(mockWebGLContext.deleteBuffer).toHaveBeenCalledTimes(16); // Half of the pool size
    });

    it("should not clean up buffer pool when below threshold", () => {
      const buffers = Array(16).fill({});
      (webglManager as any).contextState.bufferPool.set(
        mockWebGLContext.ARRAY_BUFFER,
        buffers,
      );

      (webglManager as any).cleanupBufferPool();
      expect(mockWebGLContext.deleteBuffer).not.toHaveBeenCalled();
    });
  });

  describe("Buffer Usage Tracking", () => {
    it("should track buffer usage", () => {
      const buffer = {};
      const data = new Float32Array([1, 2, 3, 4]);

      (webglManager as any).createBuffer(data, mockWebGLContext.ARRAY_BUFFER);
      expect((webglManager as any).contextState.activeBuffers.has(buffer)).toBe(
        true,
      );
      expect((webglManager as any).contextState.bufferUsage.get(buffer)).toBe(
        mockWebGLContext.ARRAY_BUFFER,
      );
    });

    it("should remove buffer from tracking when deleted", () => {
      const buffer = {};
      const data = new Float32Array([1, 2, 3, 4]);

      (webglManager as any).createBuffer(data, mockWebGLContext.ARRAY_BUFFER);
      (webglManager as any).deleteBuffer(buffer as WebGLBuffer);
      expect((webglManager as any).contextState.activeBuffers.has(buffer)).toBe(
        false,
      );
      expect((webglManager as any).contextState.bufferUsage.has(buffer)).toBe(
        false,
      );
    });
  });
});
