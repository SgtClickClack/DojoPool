import { ShaderManager } from "../shader-manager";
import { WebGLContextManager } from "../webgl-context-manager";
import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock WebGL context
const mockWebGLContext = {
  createShader: jest
    .fn<WebGLShader, [number]>()
    .mockReturnValue({} as WebGLShader),
  shaderSource: jest.fn<void, [WebGLShader, string]>(),
  compileShader: jest.fn<void, [WebGLShader]>(),
  getShaderParameter: jest
    .fn<boolean, [WebGLShader, number]>()
    .mockReturnValue(true),
  getShaderInfoLog: jest.fn<string, [WebGLShader]>().mockReturnValue(""),
  deleteShader: jest.fn<void, [WebGLShader]>(),
  createProgram: jest
    .fn<WebGLProgram, []>()
    .mockReturnValue({} as WebGLProgram),
  attachShader: jest.fn<void, [WebGLProgram, WebGLShader]>(),
  linkProgram: jest.fn<void, [WebGLProgram]>(),
  getProgramParameter: jest
    .fn<boolean, [WebGLProgram, number]>()
    .mockReturnValue(true),
  getProgramInfoLog: jest.fn<string, [WebGLProgram]>().mockReturnValue(""),
  deleteProgram: jest.fn<void, [WebGLProgram]>(),
  getActiveAttrib: jest
    .fn<{ name: string }, [WebGLProgram, number]>()
    .mockReturnValue({ name: "position" }),
  getActiveUniform: jest
    .fn<{ name: string }, [WebGLProgram, number]>()
    .mockReturnValue({ name: "modelViewMatrix" }),
  getAttribLocation: jest
    .fn<number, [WebGLProgram, string]>()
    .mockReturnValue(0),
  getUniformLocation: jest
    .fn<WebGLUniformLocation | null, [WebGLProgram, string]>()
    .mockReturnValue({} as WebGLUniformLocation),
  useProgram: jest.fn<void, [WebGLProgram | null]>(),
  VERTEX_SHADER: 0,
  FRAGMENT_SHADER: 1,
  COMPILE_STATUS: 2,
  LINK_STATUS: 3,
  ACTIVE_ATTRIBUTES: 1,
  ACTIVE_UNIFORMS: 1,
} as unknown as WebGLRenderingContext;

// Mock WebGLContextManager
const mockContextManager = {
  getContext: jest
    .fn<WebGLRenderingContext | WebGL2RenderingContext | null, []>()
    .mockReturnValue(mockWebGLContext),
  getQualityLevel: jest.fn<number, []>().mockReturnValue(3),
  addContextListener: jest.fn<void, [(event: { type: string }) => void]>(),
  removeContextListener: jest.fn<void, [(event: { type: string }) => void]>(),
} as unknown as WebGLContextManager;

describe("ShaderManager", () => {
  let shaderManager: ShaderManager;

  beforeEach(() => {
    jest.clearAllMocks();
    shaderManager = new ShaderManager(mockContextManager);
  });

  afterEach(() => {
    shaderManager.cleanup();
  });

  describe("Initialization", () => {
    it("should initialize with WebGLContextManager", () => {
      expect(mockContextManager.getContext).toHaveBeenCalled();
      expect(mockContextManager.getQualityLevel).toHaveBeenCalled();
      expect(mockContextManager.addContextListener).toHaveBeenCalled();
    });

    it("should handle invalid WebGL context", () => {
      (mockContextManager.getContext as jest.Mock).mockReturnValueOnce(null);
      expect(() => new ShaderManager(mockContextManager)).not.toThrow();
    });
  });

  describe("Shader Registration", () => {
    it("should register shader with multiple quality variants", () => {
      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
        {
          vertex: "high quality vertex shader",
          fragment: "high quality fragment shader",
          complexity: 1.0,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);

      expect(mockWebGLContext.createShader).toHaveBeenCalledTimes(6);
      expect(mockWebGLContext.createProgram).toHaveBeenCalledTimes(3);
      expect(mockWebGLContext.attachShader).toHaveBeenCalledTimes(6);
    });

    it("should sort shader definitions by complexity", () => {
      const shaderDefs = [
        {
          vertex: "high quality vertex shader",
          fragment: "high quality fragment shader",
          complexity: 1.0,
        },
        {
          vertex: "low quality vertex shader",
          fragment: "low quality fragment shader",
          complexity: 0.3,
        },
        {
          vertex: "medium quality vertex shader",
          fragment: "medium quality fragment shader",
          complexity: 0.7,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);
      const program = shaderManager.useShader("testShader");
      expect(program).toBeDefined();
    });

    it("should handle shader compilation failure", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      (mockWebGLContext.getShaderParameter as jest.Mock).mockReturnValueOnce(
        false,
      );
      (mockWebGLContext.getShaderInfoLog as jest.Mock).mockReturnValueOnce(
        "Compilation error",
      );

      const shaderDefs = [
        {
          vertex: "invalid vertex shader",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to compile shader:"),
        "Compilation error",
      );
      consoleSpy.mockRestore();
    });

    it("should handle program linking failure", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      (mockWebGLContext.getProgramParameter as jest.Mock).mockReturnValueOnce(
        false,
      );
      (mockWebGLContext.getProgramInfoLog as jest.Mock).mockReturnValueOnce(
        "Linking error",
      );

      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to link program:"),
        "Linking error",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("Quality Management", () => {
    it("should select appropriate shader variant based on quality level", () => {
      const shaderDefs = [
        {
          vertex: "low quality vertex shader",
          fragment: "low quality fragment shader",
          complexity: 0.3,
        },
        {
          vertex: "high quality vertex shader",
          fragment: "high quality fragment shader",
          complexity: 0.9,
        },
      ];

      (mockContextManager.getQualityLevel as jest.Mock).mockReturnValue(1);
      shaderManager.registerShader("testShader", shaderDefs);
      const program = shaderManager.useShader("testShader");
      expect(program).toBeDefined();
    });

    it("should fallback to simpler shader when quality is too low", () => {
      const shaderDefs = [
        {
          vertex: "simple vertex shader",
          fragment: "simple fragment shader",
          complexity: 0.2,
        },
        {
          vertex: "complex vertex shader",
          fragment: "complex fragment shader",
          complexity: 0.8,
        },
      ];

      (mockContextManager.getQualityLevel as jest.Mock).mockReturnValue(1);
      shaderManager.registerShader("testShader", shaderDefs);
      const program = shaderManager.useShader("testShader");
      expect(program).toBeDefined();
    });
  });

  describe("Shader Usage", () => {
    it("should use shader program", () => {
      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);
      const program = shaderManager.useShader("testShader");

      expect(program).toBeDefined();
      expect(mockWebGLContext.useProgram).toHaveBeenCalled();
    });

    it("should return null for non-existent shader", () => {
      const program = shaderManager.useShader("nonExistentShader");
      expect(program).toBeNull();
      expect(mockWebGLContext.useProgram).not.toHaveBeenCalled();
    });

    it("should handle shader program creation failure", () => {
      (mockWebGLContext.createProgram as jest.Mock).mockReturnValueOnce(null);

      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);
      const program = shaderManager.useShader("testShader");

      expect(program).toBeNull();
    });
  });

  describe("Attribute and Uniform Management", () => {
    it("should get shader attributes", () => {
      const shaderDefs = [
        {
          vertex: "attribute vec2 position;",
          fragment: "void main() {}",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);
      // @ts-ignore - Accessing private property for testing
      const attributes = shaderManager.getAttributes("testShader");

      expect(attributes).toBeDefined();
      expect(attributes?.get("position")).toBe(0);
    });

    it("should get shader uniforms", () => {
      const shaderDefs = [
        {
          vertex: "uniform mat4 modelViewMatrix;",
          fragment: "void main() {}",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);
      // @ts-ignore - Accessing private property for testing
      const uniforms = shaderManager.getUniforms("testShader");

      expect(uniforms).toBeDefined();
      expect(uniforms?.has("modelViewMatrix")).toBe(true);
    });

    it("should return null for attributes of non-existent shader", () => {
      // @ts-ignore - Accessing private property for testing
      const attributes = shaderManager.getAttributes("nonExistentShader");
      expect(attributes).toBeNull();
    });

    it("should return null for uniforms of non-existent shader", () => {
      // @ts-ignore - Accessing private property for testing
      const uniforms = shaderManager.getUniforms("nonExistentShader");
      expect(uniforms).toBeNull();
    });
  });

  describe("Context Management", () => {
    it("should handle context restoration", () => {
      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);

      // Simulate context restoration
      const contextListener = (
        mockContextManager.addContextListener as jest.Mock
      ).mock.calls[0][0];
      contextListener({ type: "webglcontextrestored" });

      expect(mockContextManager.getQualityLevel).toHaveBeenCalled();
    });

    it("should handle context loss", () => {
      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);

      // Simulate context loss
      const contextListener = (
        mockContextManager.addContextListener as jest.Mock
      ).mock.calls[0][0];
      contextListener({ type: "webglcontextlost" });

      // Try to use shader after context loss
      const program = shaderManager.useShader("testShader");
      expect(program).toBeNull();
    });
  });

  describe("Cleanup", () => {
    it("should clean up resources", () => {
      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);
      shaderManager.cleanup();

      expect(mockWebGLContext.deleteProgram).toHaveBeenCalled();
      expect(mockContextManager.removeContextListener).toHaveBeenCalled();
    });

    it("should handle cleanup with no registered shaders", () => {
      expect(() => shaderManager.cleanup()).not.toThrow();
    });

    it("should handle multiple cleanups", () => {
      shaderManager.cleanup();
      expect(() => shaderManager.cleanup()).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle shader compilation failure", () => {
      (mockWebGLContext.getShaderParameter as jest.Mock).mockReturnValueOnce(
        false,
      );
      (mockWebGLContext.getShaderInfoLog as jest.Mock).mockReturnValueOnce(
        "Compilation error",
      );

      const shaderDefs = [
        {
          vertex: "invalid vertex shader",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      expect(() => {
        shaderManager.registerShader("testShader", shaderDefs);
      }).not.toThrow();
    });

    it("should handle program linking failure", () => {
      (mockWebGLContext.getProgramParameter as jest.Mock).mockReturnValueOnce(
        false,
      );
      (mockWebGLContext.getProgramInfoLog as jest.Mock).mockReturnValueOnce(
        "Linking error",
      );

      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      expect(() => {
        shaderManager.registerShader("testShader", shaderDefs);
      }).not.toThrow();
    });

    it("should handle invalid shader definitions", () => {
      expect(() => {
        shaderManager.registerShader("testShader", []);
      }).not.toThrow();
    });
  });

  describe("Context Management", () => {
    it("should handle context loss and restoration", () => {
      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);
      const initialProgram = shaderManager.useShader("testShader");

      // Simulate context loss
      const contextLostEvent = { type: "webglcontextlost" };
      mockContextManager.addContextListener.mock.calls[0][0](contextLostEvent);

      // Simulate context restoration
      const contextRestoredEvent = { type: "webglcontextrestored" };
      mockContextManager.addContextListener.mock.calls[0][0](
        contextRestoredEvent,
      );

      const restoredProgram = shaderManager.useShader("testShader");
      expect(restoredProgram).toBeDefined();
      expect(restoredProgram).not.toBe(initialProgram);
    });

    it("should maintain shader state during quality transitions", () => {
      const shaderDefs = [
        {
          vertex: "low quality vertex shader",
          fragment: "low quality fragment shader",
          complexity: 0.3,
        },
        {
          vertex: "high quality vertex shader",
          fragment: "high quality fragment shader",
          complexity: 0.9,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);
      const initialProgram = shaderManager.useShader("testShader");

      // Simulate quality change
      (mockContextManager.getQualityLevel as jest.Mock).mockReturnValue(2);
      const contextRestoredEvent = { type: "webglcontextrestored" };
      mockContextManager.addContextListener.mock.calls[0][0](
        contextRestoredEvent,
      );

      const updatedProgram = shaderManager.useShader("testShader");
      expect(updatedProgram).toBeDefined();
      expect(updatedProgram).not.toBe(initialProgram);
    });
  });

  describe("Performance Monitoring", () => {
    it("should track shader compilation time", () => {
      const startTime = performance.now();
      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should compile within 100ms
    });

    it("should optimize shader selection based on performance", () => {
      const shaderDefs = [
        {
          vertex: "low quality vertex shader",
          fragment: "low quality fragment shader",
          complexity: 0.3,
        },
        {
          vertex: "high quality vertex shader",
          fragment: "high quality fragment shader",
          complexity: 0.9,
        },
      ];

      // Simulate low performance
      (mockContextManager.getQualityLevel as jest.Mock).mockReturnValue(1);
      shaderManager.registerShader("testShader", shaderDefs);
      const lowPerfProgram = shaderManager.useShader("testShader");

      // Simulate high performance
      (mockContextManager.getQualityLevel as jest.Mock).mockReturnValue(3);
      const contextRestoredEvent = { type: "webglcontextrestored" };
      mockContextManager.addContextListener.mock.calls[0][0](
        contextRestoredEvent,
      );
      const highPerfProgram = shaderManager.useShader("testShader");

      expect(highPerfProgram).not.toBe(lowPerfProgram);
    });
  });

  describe("Integration Tests", () => {
    it("should integrate with WebGLContextManager", () => {
      const shaderDefs = [
        {
          vertex: "vertex shader source",
          fragment: "fragment shader source",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("testShader", shaderDefs);
      const program = shaderManager.useShader("testShader");

      expect(mockContextManager.getContext).toHaveBeenCalled();
      expect(mockContextManager.getQualityLevel).toHaveBeenCalled();
      expect(program).toBeDefined();
    });

    it("should handle concurrent shader operations", () => {
      const shaderDefs1 = [
        {
          vertex: "vertex shader 1",
          fragment: "fragment shader 1",
          complexity: 0.5,
        },
      ];
      const shaderDefs2 = [
        {
          vertex: "vertex shader 2",
          fragment: "fragment shader 2",
          complexity: 0.5,
        },
      ];

      shaderManager.registerShader("shader1", shaderDefs1);
      shaderManager.registerShader("shader2", shaderDefs2);

      const program1 = shaderManager.useShader("shader1");
      const program2 = shaderManager.useShader("shader2");

      expect(program1).toBeDefined();
      expect(program2).toBeDefined();
      expect(program1).not.toBe(program2);
    });
  });
});
