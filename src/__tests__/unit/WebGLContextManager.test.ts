import { WebGLContextManager } from "../../services/WebGLContextManager";
import {
  createMockCanvas,
  createMockWebGLContext,
} from "../test-utils/webgl-mocks";

describe("WebGLContextManager", () => {
  let manager: WebGLContextManager;
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext;

  beforeEach(() => {
    canvas = createMockCanvas();
    gl = createMockWebGLContext();
    manager = new WebGLContextManager(canvas);
  });

  describe("Context Initialization", () => {
    test("should initialize WebGL context successfully", () => {
      expect(manager.getContext()).toBeTruthy();
      expect(manager.isContextLost()).toBeFalsy();
    });

    test("should handle context creation failure gracefully", () => {
      jest.spyOn(canvas, "getContext").mockReturnValue(null);
      expect(() => new WebGLContextManager(canvas)).toThrow(
        "WebGL not supported",
      );
    });

    test("should set default viewport dimensions", () => {
      const viewport = manager.getViewport();
      expect(viewport).toEqual({ width: 800, height: 600 });
    });
  });

  describe("Context Management", () => {
    test("should handle context loss events", () => {
      const onLost = jest.fn();
      manager.onContextLost(onLost);
      canvas.dispatchEvent(new Event("webglcontextlost"));
      expect(onLost).toHaveBeenCalled();
      expect(manager.isContextLost()).toBeTruthy();
    });

    test("should handle context restore events", () => {
      const onRestore = jest.fn();
      manager.onContextRestore(onRestore);
      canvas.dispatchEvent(new Event("webglcontextrestored"));
      expect(onRestore).toHaveBeenCalled();
      expect(manager.isContextLost()).toBeFalsy();
    });

    test("should clear resources on context loss", () => {
      const clearResources = jest.fn();
      manager.onResourceClear(clearResources);
      canvas.dispatchEvent(new Event("webglcontextlost"));
      expect(clearResources).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("should handle WebGL errors", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation();
      gl.getError = jest.fn().mockReturnValue(gl.INVALID_OPERATION);
      manager.checkError();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("WebGL error"),
      );
    });

    test("should track error state", () => {
      gl.getError = jest.fn().mockReturnValue(gl.INVALID_VALUE);
      manager.checkError();
      expect(manager.hasErrors()).toBeTruthy();
      expect(manager.getLastError()).toBe("INVALID_VALUE");
    });
  });

  describe("Performance Monitoring", () => {
    test("should track frame times", () => {
      manager.beginFrame();
      jest.advanceTimersByTime(16);
      manager.endFrame();
      expect(manager.getAverageFrameTime()).toBeCloseTo(16);
    });

    test("should detect performance issues", () => {
      const onPerformanceIssue = jest.fn();
      manager.onPerformanceIssue(onPerformanceIssue);

      // Simulate slow frames
      for (let i = 0; i < 10; i++) {
        manager.beginFrame();
        jest.advanceTimersByTime(32); // 32ms = below 30fps
        manager.endFrame();
      }

      expect(onPerformanceIssue).toHaveBeenCalled();
    });
  });

  describe("Integration Tests", () => {
    test("should work with shader manager", () => {
      const shader = {
        compile: jest.fn(),
        bind: jest.fn(),
      };
      manager.registerShader("test", shader);
      manager.useShader("test");
      expect(shader.bind).toHaveBeenCalled();
    });

    test("should handle resource cleanup", () => {
      const texture = { delete: jest.fn() };
      manager.registerResource(texture);
      manager.cleanup();
      expect(texture.delete).toHaveBeenCalled();
    });
  });
});
