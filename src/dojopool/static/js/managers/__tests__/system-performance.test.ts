/// <reference types="jest" />

import {
  jest,
  describe,
  it,
  beforeEach,
  afterEach,
  expect,
} from "@jest/globals";
import { PerformanceMonitor } from "../performance-monitor";
import {
  PerformanceBudgetManager,
  type PerformanceBudget,
  type BudgetViolation,
  type BudgetStatus,
} from "../performance-budget";
import { WebGLContextManager } from "../webgl-context-manager";
import { TransitionManager } from "../transition-manager";
import { DeviceProfileManager } from "../device-profile-manager";
import { PerformanceSnapshot } from "../../types";

// Mock WebGL types
interface MockWebGLTexture extends WebGLTexture {
  id: string;
  width: number;
  height: number;
}

// Define the interface only for the methods we specifically mock or interact with
interface MockWebGLContext extends WebGLRenderingContext {
  isContextLost: () => boolean;
  getExtension: (name: string) => any; // Keep it simple
  getParameter: (pname: number) => any;
  createTexture: () => WebGLTexture;
  deleteTexture: (texture: WebGLTexture) => void;
  drawArrays: (mode: number, first: number, count: number) => void;
  drawElements: (
    mode: number,
    count: number,
    type: number,
    offset: number
  ) => void;
  createQuery: () => WebGLQuery;
  beginQuery: (target: number, query: WebGLQuery) => void;
  endQuery: (target: number) => void;
  getQueryParameter: (query: WebGLQuery, pname: number) => any;
  deleteQuery: (query: WebGLQuery) => void;
  // Ensure canvas property exists if needed, maybe add others if tests fail
  canvas: HTMLCanvasElement;
}

// Worker metrics type matching implementation
interface WorkerMetrics {
  totalUtilization: number;
  averageProcessingTime: number;
  totalErrors: number;
  queueLength: number;
  activeWorkers: number;
}

// Memory stats type - needs jsHeapSize
interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  jsHeapSize?: number; // Added optional jsHeapSize based on usage
}

// WebGL timing info - moved to shared types
interface WebGLTimingInfo {
  gpuTime: number;
  drawCalls: number;
  triangleCount: number;
  contextLost: boolean;
}

declare global {
  interface Performance {
    memory?: MemoryInfo;
  }
}

// Mock manager implementations
class MockWebGLContextManager {
  private textures: Map<string, MockWebGLTexture> = new Map();
  private static instance: MockWebGLContextManager;

  static getInstance(): MockWebGLContextManager {
    if (!MockWebGLContextManager.instance) {
      MockWebGLContextManager.instance = new MockWebGLContextManager();
    }
    return MockWebGLContextManager.instance;
  }

  createTexture(width: number, height: number): MockWebGLTexture {
    const texture = {
      id: `texture_${Date.now()}`,
      width,
      height,
    } as MockWebGLTexture;
    this.textures.set(texture.id, texture);
    return texture;
  }

  deleteTexture(texture: MockWebGLTexture): void {
    this.textures.delete(texture.id);
  }

  getTexture(id: string): MockWebGLTexture | undefined {
    return this.textures.get(id);
  }

  isContextValid(): boolean {
    return true;
  }

  cleanup(): void {
    this.textures.clear();
  }
}

class MockTransitionManager {
  private transitioning = false;
  private static instance: MockTransitionManager;

  static getInstance(): MockTransitionManager {
    if (!MockTransitionManager.instance) {
      MockTransitionManager.instance = new MockTransitionManager();
    }
    return MockTransitionManager.instance;
  }

  startTransition(level: number): void {
    this.transitioning = true;
  }

  isTransitioning(): boolean {
    return this.transitioning;
  }

  cleanup(): void {
    this.transitioning = false;
  }
}

class MockPerformanceBudgetManager {
  private violations: BudgetViolation[] = [];
  private listeners: Set<(violation: BudgetViolation) => void> = new Set();
  private static instance: MockPerformanceBudgetManager;
  private budget: PerformanceBudget = {
    maxFrameTime: 16.67,
    minFps: 55,
    maxGpuTime: 12,
    maxMemoryUsage: 512 * 1024 * 1024,
    maxWorkerUtilization: 0.8,
    maxDrawCalls: 1000,
  };
  private warningThreshold: number = 0.8;
  private readonly maxViolationHistory: number = 100;

  static getInstance(): MockPerformanceBudgetManager {
    if (!MockPerformanceBudgetManager.instance) {
      MockPerformanceBudgetManager.instance =
        new MockPerformanceBudgetManager();
    }
    return MockPerformanceBudgetManager.instance;
  }

  onViolation(callback: (violation: BudgetViolation) => void): void {
    this.listeners.add(callback);
  }

  removeViolationListener(
    callback: (violation: BudgetViolation) => void,
  ): void {
    this.listeners.delete(callback);
  }

  private createViolation(
    metric: string,
    value: number,
    threshold: number,
    timestamp: number,
    severity: "warning" | "critical" = "critical",
  ): BudgetViolation {
    return {
      metric,
      value,
      threshold,
      timestamp,
      severity,
    };
  }

  private notifyListeners(violation: BudgetViolation): void {
    this.listeners.forEach((listener) => listener(violation));
  }

  checkPerformance(
    snapshot: PerformanceSnapshot & { drawCalls?: number },
  ): BudgetStatus {
    const violations: BudgetViolation[] = [];
    const utilizationPercentages: { [key: string]: number } = {};

    // Check frame time
    if (this.budget.maxFrameTime) {
      const frameTimeUtil = snapshot.frameTime / this.budget.maxFrameTime;
      utilizationPercentages.frameTime = frameTimeUtil;
      if (frameTimeUtil > 1) {
        violations.push(
          this.createViolation(
            "frameTime",
            snapshot.frameTime,
            this.budget.maxFrameTime,
            snapshot.timestamp,
          ),
        );
      } else if (frameTimeUtil > this.warningThreshold) {
        violations.push(
          this.createViolation(
            "frameTime",
            snapshot.frameTime,
            this.budget.maxFrameTime,
            snapshot.timestamp,
            "warning",
          ),
        );
      }
    }

    // Check FPS
    if (this.budget.minFps) {
      const fpsUtil = this.budget.minFps / snapshot.fps;
      utilizationPercentages.fps = fpsUtil;
      if (snapshot.fps < this.budget.minFps) {
        violations.push(
          this.createViolation(
            "fps",
            snapshot.fps,
            this.budget.minFps,
            snapshot.timestamp,
          ),
        );
      } else if (snapshot.fps < this.budget.minFps / this.warningThreshold) {
        violations.push(
          this.createViolation(
            "fps",
            snapshot.fps,
            this.budget.minFps,
            snapshot.timestamp,
            "warning",
          ),
        );
      }
    }

    // Check GPU time
    if (this.budget.maxGpuTime) {
      const gpuTimeUtil = snapshot.gpuTime / this.budget.maxGpuTime;
      utilizationPercentages.gpuTime = gpuTimeUtil;
      if (gpuTimeUtil > 1) {
        violations.push(
          this.createViolation(
            "gpuTime",
            snapshot.gpuTime,
            this.budget.maxGpuTime,
            snapshot.timestamp,
          ),
        );
      } else if (gpuTimeUtil > this.warningThreshold) {
        violations.push(
          this.createViolation(
            "gpuTime",
            snapshot.gpuTime,
            this.budget.maxGpuTime,
            snapshot.timestamp,
            "warning",
          ),
        );
      }
    }

    // Check memory usage
    if (this.budget.maxMemoryUsage) {
      const memoryUtil =
        snapshot.memoryStats.usedJSHeapSize / this.budget.maxMemoryUsage;
      utilizationPercentages.memoryUsage = memoryUtil;
      if (memoryUtil > 1) {
        violations.push(
          this.createViolation(
            "memoryUsage",
            snapshot.memoryStats.usedJSHeapSize,
            this.budget.maxMemoryUsage,
            snapshot.timestamp,
          ),
        );
      } else if (memoryUtil > this.warningThreshold) {
        violations.push(
          this.createViolation(
            "memoryUsage",
            snapshot.memoryStats.usedJSHeapSize,
            this.budget.maxMemoryUsage,
            snapshot.timestamp,
            "warning",
          ),
        );
      }
    }

    // Check worker utilization
    if (this.budget.maxWorkerUtilization) {
      const workerUtil =
        snapshot.workerUtilization / this.budget.maxWorkerUtilization;
      utilizationPercentages.workerUtilization = workerUtil;
      if (workerUtil > 1) {
        violations.push(
          this.createViolation(
            "workerUtilization",
            snapshot.workerUtilization,
            this.budget.maxWorkerUtilization,
            snapshot.timestamp,
          ),
        );
      } else if (workerUtil > this.warningThreshold) {
        violations.push(
          this.createViolation(
            "workerUtilization",
            snapshot.workerUtilization,
            this.budget.maxWorkerUtilization,
            snapshot.timestamp,
            "warning",
          ),
        );
      }
    }

    // Check draw calls if available
    if (this.budget.maxDrawCalls && snapshot.drawCalls !== undefined) {
      const drawCallsUtil = snapshot.drawCalls / this.budget.maxDrawCalls;
      utilizationPercentages.drawCalls = drawCallsUtil;
      if (drawCallsUtil > 1) {
        violations.push(
          this.createViolation(
            "drawCalls",
            snapshot.drawCalls,
            this.budget.maxDrawCalls,
            snapshot.timestamp,
          ),
        );
      } else if (drawCallsUtil > this.warningThreshold) {
        violations.push(
          this.createViolation(
            "drawCalls",
            snapshot.drawCalls,
            this.budget.maxDrawCalls,
            snapshot.timestamp,
            "warning",
          ),
        );
      }
    }

    // Store and notify about violations
    violations.forEach((violation) => {
      this.violations.push(violation);
      if (this.violations.length > this.maxViolationHistory) {
        this.violations.shift();
      }
      this.notifyListeners(violation);
    });

    return {
      violations,
      isWithinBudget: violations.every((v) => v.severity === "warning"),
      utilizationPercentages,
    };
  }

  cleanup(): void {
    this.violations = [];
    this.listeners.clear();
  }
}

class MockDeviceProfileManager {
  private static instance: MockDeviceProfileManager;

  static getInstance(): MockDeviceProfileManager {
    if (!MockDeviceProfileManager.instance) {
      MockDeviceProfileManager.instance = new MockDeviceProfileManager();
    }
    return MockDeviceProfileManager.instance;
  }

  cleanup(): void {}
}

describe("System Performance Tests", () => {
  let monitor: PerformanceMonitor;
  let budgetManager: MockPerformanceBudgetManager;
  let contextManager: MockWebGLContextManager;
  let transitionManager: MockTransitionManager;
  let deviceProfileManager: MockDeviceProfileManager;
  let mockWebGLContext: MockWebGLContext;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create mock canvas first
    mockCanvas = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getContext: jest.fn(), // We won't call getContext on the mock canvas itself
      // Add other HTMLCanvasElement properties if needed by tests
      width: 300,
      height: 150,
    } as unknown as HTMLCanvasElement;

    // Create mock WebGL context object
    // We implement the required methods and add stubs for others
    const mockContextImplementation = {
      // Mock EXT_disjoint_timer_query extension properties
      getExtension: jest.fn().mockImplementation((name) => {
        if (
          name === "EXT_disjoint_timer_query_webgl2" ||
          name === "EXT_disjoint_timer_query"
        ) {
          return {
            TIME_ELAPSED_EXT: 0x88bf,
            QUERY_RESULT_AVAILABLE_EXT: 0x8867,
            QUERY_RESULT_EXT: 0x8866,
          };
        }
        return null;
      }),
      getParameter: jest.fn().mockReturnValue(0),
      createTexture: jest.fn().mockReturnValue({ id: "mockTexture" } as WebGLTexture),
      deleteTexture: jest.fn(),
      isContextLost: jest.fn().mockReturnValue(false),
      createQuery: jest.fn().mockImplementation(() => ({
        __isWebGLQuery: true,
      } as WebGLQuery)),
      beginQuery: jest.fn(),
      endQuery: jest.fn(),
      getQueryParameter: jest.fn().mockImplementation((query, pname) => {
        const GL = WebGL2RenderingContext;
        if (pname === GL.QUERY_RESULT_AVAILABLE) {
          return true;
        }
        if (pname === GL.QUERY_RESULT) {
          return 5 * 1000000;
        }
        return 0;
      }),
      deleteQuery: jest.fn(),
      drawArrays: jest.fn(),
      drawElements: jest.fn(),

      // --- Add stubs for other WebGLRenderingContext methods --- 
      canvas: mockCanvas, // Link mock canvas
      activeTexture: jest.fn(),
      attachShader: jest.fn(),
      bindAttribLocation: jest.fn(),
      bindBuffer: jest.fn(),
      bindFramebuffer: jest.fn(),
      bindRenderbuffer: jest.fn(),
      bindTexture: jest.fn(),
      blendColor: jest.fn(),
      blendEquation: jest.fn(),
      blendEquationSeparate: jest.fn(),
      blendFunc: jest.fn(),
      blendFuncSeparate: jest.fn(),
      bufferData: jest.fn(),
      bufferSubData: jest.fn(),
      checkFramebufferStatus: jest.fn(),
      clear: jest.fn(),
      clearColor: jest.fn(),
      clearDepth: jest.fn(),
      clearStencil: jest.fn(),
      colorMask: jest.fn(),
      compileShader: jest.fn(),
      compressedTexImage2D: jest.fn(),
      compressedTexSubImage2D: jest.fn(),
      copyTexImage2D: jest.fn(),
      copyTexSubImage2D: jest.fn(),
      createBuffer: jest.fn(),
      createFramebuffer: jest.fn(),
      createProgram: jest.fn(),
      createRenderbuffer: jest.fn(),
      createShader: jest.fn(),
      cullFace: jest.fn(),
      deleteBuffer: jest.fn(),
      deleteFramebuffer: jest.fn(),
      deleteProgram: jest.fn(),
      deleteRenderbuffer: jest.fn(),
      deleteShader: jest.fn(),
      depthFunc: jest.fn(),
      depthMask: jest.fn(),
      depthRange: jest.fn(),
      detachShader: jest.fn(),
      disable: jest.fn(),
      disableVertexAttribArray: jest.fn(),
      enable: jest.fn(),
      enableVertexAttribArray: jest.fn(),
      finish: jest.fn(),
      flush: jest.fn(),
      framebufferRenderbuffer: jest.fn(),
      framebufferTexture2D: jest.fn(),
      frontFace: jest.fn(),
      generateMipmap: jest.fn(),
      getActiveAttrib: jest.fn(),
      getActiveUniform: jest.fn(),
      getAttachedShaders: jest.fn(),
      getAttribLocation: jest.fn(),
      getBufferParameter: jest.fn(),
      getContextAttributes: jest.fn(),
      getError: jest.fn(),
      getFramebufferAttachmentParameter: jest.fn(),
      getProgramParameter: jest.fn(),
      getProgramInfoLog: jest.fn(),
      getRenderbufferParameter: jest.fn(),
      getShaderParameter: jest.fn(),
      getShaderInfoLog: jest.fn(),
      getShaderPrecisionFormat: jest.fn(),
      getShaderSource: jest.fn(),
      getSupportedExtensions: jest.fn(),
      getTexParameter: jest.fn(),
      getUniform: jest.fn(),
      getUniformLocation: jest.fn(),
      getVertexAttrib: jest.fn(),
      getVertexAttribOffset: jest.fn(),
      hint: jest.fn(),
      isBuffer: jest.fn(),
      isEnabled: jest.fn(),
      isFramebuffer: jest.fn(),
      isProgram: jest.fn(),
      isRenderbuffer: jest.fn(),
      isShader: jest.fn(),
      isTexture: jest.fn(),
      lineWidth: jest.fn(),
      linkProgram: jest.fn(),
      pixelStorei: jest.fn(),
      polygonOffset: jest.fn(),
      readPixels: jest.fn(),
      renderbufferStorage: jest.fn(),
      sampleCoverage: jest.fn(),
      scissor: jest.fn(),
      shaderSource: jest.fn(),
      stencilFunc: jest.fn(),
      stencilFuncSeparate: jest.fn(),
      stencilMask: jest.fn(),
      stencilMaskSeparate: jest.fn(),
      stencilOp: jest.fn(),
      stencilOpSeparate: jest.fn(),
      texImage2D: jest.fn(),
      texParameterf: jest.fn(),
      texParameteri: jest.fn(),
      texSubImage2D: jest.fn(),
      uniform1f: jest.fn(),
      uniform1fv: jest.fn(),
      uniform1i: jest.fn(),
      uniform1iv: jest.fn(),
      uniform2f: jest.fn(),
      uniform2fv: jest.fn(),
      uniform2i: jest.fn(),
      uniform2iv: jest.fn(),
      uniform3f: jest.fn(),
      uniform3fv: jest.fn(),
      uniform3i: jest.fn(),
      uniform3iv: jest.fn(),
      uniform4f: jest.fn(),
      uniform4fv: jest.fn(),
      uniform4i: jest.fn(),
      uniform4iv: jest.fn(),
      uniformMatrix2fv: jest.fn(),
      uniformMatrix3fv: jest.fn(),
      uniformMatrix4fv: jest.fn(),
      useProgram: jest.fn(),
      validateProgram: jest.fn(),
      vertexAttrib1f: jest.fn(),
      vertexAttrib1fv: jest.fn(),
      vertexAttrib2f: jest.fn(),
      vertexAttrib2fv: jest.fn(),
      vertexAttrib3f: jest.fn(),
      vertexAttrib3fv: jest.fn(),
      vertexAttrib4f: jest.fn(),
      vertexAttrib4fv: jest.fn(),
      vertexAttribPointer: jest.fn(),
      viewport: jest.fn(),
      drawingBufferWidth: 300,
      drawingBufferHeight: 150,
    };

    // Cast the implementation to the interface type
    mockWebGLContext = mockContextImplementation as unknown as MockWebGLContext;

    // Mock canvas getContext to return our mock context
    // Need to cast mockCanvas back to itself to satisfy TS temporarily
    (mockCanvas as any).getContext = jest.fn().mockImplementation((contextId) => {
        if (contextId === 'webgl' || contextId === 'webgl2') {
            return mockWebGLContext;
        }
        return null;
    });

    // Initialize managers
    monitor = PerformanceMonitor.getInstance({
      autoStart: false,
      sampleInterval: 100,
    });
    budgetManager = new MockPerformanceBudgetManager();
    contextManager = new MockWebGLContextManager();
    transitionManager = new MockTransitionManager();
    deviceProfileManager = new MockDeviceProfileManager();

    // Initialize WebGL
    monitor.initializeWebGL(mockWebGLContext);
  });

  afterEach(() => {
    monitor.cleanup();
    budgetManager.cleanup();
    contextManager.cleanup();
    transitionManager.cleanup();
    deviceProfileManager.cleanup();
  });

  describe("Frame Rate Stability", () => {
    it("should maintain stable frame rate under load", async () => {
      const targetFPS = 60;
      const frameTimings: number[] = [];
      const duration = 5000; // 5 seconds
      const startTime = performance.now();

      monitor.start();

      while (performance.now() - startTime < duration) {
        const frameStart = performance.now();

        // Simulate frame work
        await new Promise((resolve) => setTimeout(resolve, 1000 / targetFPS));

        const frameEnd = performance.now();
        frameTimings.push(frameEnd - frameStart);
      }

      monitor.stop();

      // Calculate average FPS
      const averageFrameTime =
        frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
      const averageFPS = 1000 / averageFrameTime;

      // Check if FPS is within 10% of target
      expect(averageFPS).toBeGreaterThanOrEqual(targetFPS * 0.9);
      expect(averageFPS).toBeLessThanOrEqual(targetFPS * 1.1);
    });
  });

  describe("Memory Usage", () => {
    it("should manage memory efficiently", async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      const textureCount = 100;
      const textures: MockWebGLTexture[] = [];

      // Create textures
      for (let i = 0; i < textureCount; i++) {
        textures.push(contextManager.createTexture(256, 256));
      }

      // Delete textures
      for (const texture of textures) {
        contextManager.deleteTexture(texture);
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      expect(finalMemory - initialMemory).toBeLessThan(initialMemory * 0.1); // Less than 10% increase
    });

    it("should handle memory spikes", async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      const spikeCount = 10;
      const textures: MockWebGLTexture[] = [];

      for (let i = 0; i < spikeCount; i++) {
        // Create large textures
        for (let j = 0; j < 50; j++) {
          textures.push(contextManager.createTexture(1024, 1024));
        }

        // Delete textures
        for (const texture of textures) {
          contextManager.deleteTexture(texture);
        }
        textures.length = 0;

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      expect(finalMemory - initialMemory).toBeLessThan(initialMemory * 0.2); // Less than 20% increase
    });
  });

  describe("Resource Cleanup", () => {
    it("should clean up resources properly", async () => {
      const textureCount = 50;
      const textures: MockWebGLTexture[] = [];

      // Create textures
      for (let i = 0; i < textureCount; i++) {
        textures.push(contextManager.createTexture(256, 256));
      }

      // Clean up
      contextManager.cleanup();

      // Verify cleanup
      for (const texture of textures) {
        expect(contextManager.getTexture(texture.id)).toBeUndefined();
      }
    });

    it("should handle cleanup during active operations", async () => {
      const texture = contextManager.createTexture(256, 256);
      expect(texture).toBeDefined();

      // Start a transition
      transitionManager.startTransition(2);

      // Clean up during transition
      contextManager.cleanup();
      transitionManager.cleanup();

      // Verify cleanup
      expect(contextManager.getTexture(texture.id)).toBeUndefined();
      expect(transitionManager.isTransitioning()).toBe(false);
    });
  });

  describe("Error Recovery", () => {
    it("should recover from WebGL context loss", async () => {
      const texture = contextManager.createTexture(256, 256);
      expect(texture).toBeDefined();

      // Simulate context loss - Cast to mock and call mockReturnValue
      (mockWebGLContext.isContextLost as jest.Mock).mockReturnValue(true);
      mockCanvas.dispatchEvent(new Event("webglcontextlost"));

      // Simulate context restoration - Cast to mock and call mockReturnValue
      await new Promise((resolve) => setTimeout(resolve, 100));
      (mockWebGLContext.isContextLost as jest.Mock).mockReturnValue(false);
      mockCanvas.dispatchEvent(new Event("webglcontextrestored"));

      // Verify recovery
      expect(contextManager.isContextValid()).toBe(true);
      const restoredTexture = contextManager.getTexture(texture.id);
      expect(restoredTexture).toBeDefined();
    });

    it("should handle worker errors gracefully", async () => {
      const worker = new Worker("worker.js");
      monitor.registerWorker(worker);

      worker.onerror = (e) => {
        expect(e).toBeDefined();
      };

      worker.postMessage({ type: "errorTask" });
      await new Promise((resolve) => setTimeout(resolve, 100));

      const reports = monitor.getReports();
      const workerMetrics = reports[reports.length - 1].workerMetrics;
      expect(workerMetrics.totalErrors).toBeGreaterThan(0);

      worker.terminate();
    });
  });

  describe("Quality Transitions", () => {
    it("should maintain smooth transitions", async () => {
      const transitionCount = 10;
      const frameTimings: number[] = [];

      for (let i = 0; i < transitionCount; i++) {
        const startTime = performance.now();
        transitionManager.startTransition(i % 3); // Cycle through quality levels
        frameTimings.push(performance.now() - startTime);
      }

      const averageTransitionTime =
        frameTimings.reduce((a, b) => a + b) / frameTimings.length;
      expect(averageTransitionTime).toBeLessThan(50); // Less than 50ms per transition
    });

    it("should handle rapid quality changes", async () => {
      const rapidChanges = 20;

      for (let i = 0; i < rapidChanges; i++) {
        transitionManager.startTransition(i % 3);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const reports = monitor.getReports();
      const violations = reports.filter(
        (report) => report.budgetStatus && !report.budgetStatus.isWithinBudget,
      );

      expect(violations.length).toBeLessThan(reports.length * 0.2); // Less than 20% violations
    });
  });

  describe("WebGL Context Management", () => {
    it("should handle context loss and restoration", async () => {
      const contextLossCount = 3;
      let actualLossCount = 0;

      // Add context loss listener
      mockCanvas.addEventListener("webglcontextlost", () => {
        actualLossCount++;
        // Simulate context restoration
        setTimeout(() => {
          // Cast to mock and call mockReturnValue
          (mockWebGLContext.isContextLost as jest.Mock).mockReturnValue(false);
          mockCanvas.dispatchEvent(new Event("webglcontextrestored"));
        }, 100);
      });

      // Simulate context losses
      for (let i = 0; i < contextLossCount; i++) {
        // Cast to mock and call mockReturnValue
        (mockWebGLContext.isContextLost as jest.Mock).mockReturnValue(true);
        mockCanvas.dispatchEvent(new Event("webglcontextlost"));
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      expect(actualLossCount).toBe(contextLossCount);
      expect(contextManager.isContextValid()).toBe(true);
    });

    it("should maintain texture state after context loss", async () => {
      const texture = contextManager.createTexture(256, 256);
      expect(texture).toBeDefined();

      // Simulate context loss and restoration - Cast to mock and call mockReturnValue
      (mockWebGLContext.isContextLost as jest.Mock).mockReturnValue(true);
      mockCanvas.dispatchEvent(new Event("webglcontextlost"));
      await new Promise((resolve) => setTimeout(resolve, 100));
      (mockWebGLContext.isContextLost as jest.Mock).mockReturnValue(false);
      mockCanvas.dispatchEvent(new Event("webglcontextrestored"));
      await new Promise((resolve) => setTimeout(resolve, 100));

      const restoredTexture = contextManager.getTexture(texture.id);
      if (!restoredTexture) {
        throw new Error("Texture was not restored after context restoration");
      }
      expect(restoredTexture.width).toBe(256);
      expect(restoredTexture.height).toBe(256);
    });
  });

  describe("Performance Budget Violations", () => {
    it("should handle multiple concurrent violations", async () => {
      const duration = 5000;
      const startTime = performance.now();
      let violationCount = 0;

      budgetManager.onViolation(() => violationCount++);

      while (performance.now() - startTime < duration) {
        // Simulate heavy load
        for (let i = 0; i < 10; i++) {
          contextManager.createTexture(1024, 1024);
        }
        transitionManager.startTransition(2);
        await new Promise((resolve) => setTimeout(resolve, 16));
      }

      expect(violationCount).toBeGreaterThan(0);
      const reports = monitor.getReports();
      const violations = reports.filter(
        (report) => !report.budgetStatus.isWithinBudget,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("should recover from budget violations", async () => {
      const duration = 5000;
      const startTime = performance.now();
      let recoveryCount = 0;

      budgetManager.onViolation(() => recoveryCount++);

      // Simulate heavy load
      for (let i = 0; i < 10; i++) {
        contextManager.createTexture(1024, 1024);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reduce load
      for (let i = 0; i < 5; i++) {
        contextManager.createTexture(256, 256);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(recoveryCount).toBeGreaterThan(0);
    });
  });

  describe("Worker Performance", () => {
    it("should maintain worker performance under load", async () => {
      const workerCount = 4;
      const workers: Worker[] = [];
      const workerResults: number[] = [];

      // Create workers
      for (let i = 0; i < workerCount; i++) {
        const worker = new Worker("worker.js");
        workers.push(worker);
        monitor.registerWorker(worker);

        worker.onmessage = (e) => {
          workerResults.push(e.data);
        };
      }

      // Simulate work
      for (const worker of workers) {
        worker.postMessage({ type: "heavyTask" });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const reports = monitor.getReports();
      const workerMetrics = reports[reports.length - 1].workerMetrics;
      expect(workerMetrics.totalUtilization).toBeLessThan(0.9);
      expect(workerMetrics.totalErrors).toBe(0);

      // Cleanup
      for (const worker of workers) {
        worker.terminate();
      }
    });

    it("should handle worker errors gracefully", async () => {
      const worker = new Worker("worker.js");
      monitor.registerWorker(worker);

      worker.onerror = (e) => {
        expect(e).toBeDefined();
      };

      worker.postMessage({ type: "errorTask" });
      await new Promise((resolve) => setTimeout(resolve, 100));

      const reports = monitor.getReports();
      const workerMetrics = reports[reports.length - 1].workerMetrics;
      expect(workerMetrics.totalErrors).toBeGreaterThan(0);

      worker.terminate();
    });
  });

  describe("Cross-Component Integration", () => {
    it("should maintain performance with all components active", async () => {
      const duration = 10000;
      const startTime = performance.now();
      let frameCount = 0;

      monitor.start();

      while (performance.now() - startTime < duration) {
        // Simulate rendering work
        contextManager.createTexture(256, 256);
        transitionManager.startTransition(frameCount % 3);

        // Check performance
        const snapshot: PerformanceSnapshot = {
          timestamp: performance.now(),
          fps: 60,
          frameTime: 16.67,
          gpuTime: 10,
          memoryStats: {
            jsHeapSize: performance.memory?.jsHeapSizeLimit || 0,
            totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
            usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
          },
          workerUtilization: 0.5,
        };

        const status = budgetManager.checkPerformance(snapshot);
        expect(status.isWithinBudget).toBe(true);

        frameCount++;
        await new Promise((resolve) => setTimeout(resolve, 16));
      }

      const reports = monitor.getReports();
      expect(reports.length).toBeGreaterThan(0);
      expect(reports[reports.length - 1].fps).toBeGreaterThan(55);
    });

    it("should handle component failures gracefully", async () => {
      // Simulate WebGL context loss - Cast to mock and call mockReturnValue
      (mockWebGLContext.isContextLost as jest.Mock).mockReturnValue(true);
      mockCanvas.dispatchEvent(new Event("webglcontextlost"));

      // Simulate worker error
      const worker = new Worker("worker.js");
      monitor.registerWorker(worker);
      worker.postMessage({ type: "errorTask" });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const reports = monitor.getReports();
      expect(reports[reports.length - 1].gpuMetrics.contextLost).toBe(true);
      expect(
        reports[reports.length - 1].workerMetrics.totalErrors,
      ).toBeGreaterThan(0);

      worker.terminate();
    });
  });

  describe("Stress Testing", () => {
    it("should handle maximum texture load", async () => {
      const textureCount = 1000;
      const textures: MockWebGLTexture[] = [];
      const startTime = performance.now();

      for (let i = 0; i < textureCount; i++) {
        textures.push(contextManager.createTexture(256, 256));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should create 1000 textures in under 5 seconds

      // Cleanup
      for (const texture of textures) {
        contextManager.deleteTexture(texture);
      }
    });

    it("should handle rapid quality transitions", async () => {
      const transitionCount = 100;
      const startTime = performance.now();

      for (let i = 0; i < transitionCount; i++) {
        transitionManager.startTransition(i % 3);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(transitionCount * 20); // Each transition should take less than 20ms

      const reports = monitor.getReports();
      const violations = reports.filter(
        (report) => !report.budgetStatus.isWithinBudget,
      );
      expect(violations.length).toBeLessThan(transitionCount * 0.1); // Less than 10% violations
    });
  });

  describe("Worker Metrics", () => {
    it("should handle worker metrics correctly", () => {
      const metrics: WorkerMetrics = {
        totalUtilization: 0.8,
        averageProcessingTime: 10,
        totalErrors: 2,
        queueLength: 5,
        activeWorkers: 4,
      };

      const report = monitor.getLatestReport();
      expect(report?.workerMetrics).toEqual(metrics);
    });

    it("should track memory usage correctly", () => {
      const memoryStats: MemoryInfo = {
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        totalJSHeapSize: 1 * 1024 * 1024 * 1024,
        usedJSHeapSize: 500 * 1024 * 1024,
        jsHeapSize: 2 * 1024 * 1024 * 1024, // Assigning the added property
      };

      // Need to mock performance.memory correctly for this test
      const mockPerformanceMemory: MemoryInfo = {
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        totalJSHeapSize: 1 * 1024 * 1024 * 1024,
        usedJSHeapSize: 500 * 1024 * 1024,
        jsHeapSize: 2 * 1024 * 1024 * 1024,
      };
      Object.defineProperty(performance, 'memory', {
        value: mockPerformanceMemory,
        writable: true, // Make it writable if tests need to change it
        configurable: true,
      });

      monitor.start(); // Ensure monitor is running to generate reports
      // Allow time for a report to generate if needed, or trigger manually
      // For simplicity, let's assume getLatestReport reads the current state directly or is mocked
      // If generateReport relies on timing, more setup needed.

      const report = monitor.getLatestReport(); // Call this *after* mocking performance.memory
      // This assertion might fail if getLatestReport returns undefined because no reports were generated
      // or if the mocked memory stats aren't reflected immediately.
      // Consider explicitly calling a method that uses getMemoryStats if possible.
      expect(report?.memoryUsage).toEqual(mockPerformanceMemory); 

      // Cleanup the mock
      Object.defineProperty(performance, 'memory', {
        value: undefined, // Or original value if stored
        writable: true,
        configurable: true,
      });
      monitor.stop(); // Stop the monitor
    });
  });
});
