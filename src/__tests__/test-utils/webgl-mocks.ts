import { jest } from "@jest/globals";

export const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
};

export const createMockWebGLContext = (): WebGLRenderingContext => {
  const gl = {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    ARRAY_BUFFER: 34962,
    ELEMENT_ARRAY_BUFFER: 34963,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    TRIANGLES: 4,
    COLOR_BUFFER_BIT: 16384,
    DEPTH_BUFFER_BIT: 256,
    INVALID_ENUM: 1280,
    INVALID_VALUE: 1281,
    INVALID_OPERATION: 1282,
    OUT_OF_MEMORY: 1285,
    CONTEXT_LOST_WEBGL: 37442,

    // Mock methods
    createShader: jest.fn().mockReturnValue({}),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderParameter: jest.fn().mockReturnValue(true),
    getShaderInfoLog: jest.fn().mockReturnValue(""),
    createProgram: jest.fn().mockReturnValue({}),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn().mockReturnValue(true),
    getProgramInfoLog: jest.fn().mockReturnValue(""),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn().mockReturnValue(0),
    getUniformLocation: jest.fn().mockReturnValue({}),
    createBuffer: jest.fn().mockReturnValue({}),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    clear: jest.fn(),
    drawArrays: jest.fn(),
    drawElements: jest.fn(),
    viewport: jest.fn(),
    getError: jest.fn().mockReturnValue(0),
    isContextLost: jest.fn().mockReturnValue(false),
    deleteShader: jest.fn(),
    deleteProgram: jest.fn(),
    deleteBuffer: jest.fn(),
    deleteTexture: jest.fn(),

    // Texture methods
    createTexture: jest.fn().mockReturnValue({}),
    bindTexture: jest.fn(),
    texImage2D: jest.fn(),
    texParameteri: jest.fn(),
    activeTexture: jest.fn(),

    // Framebuffer methods
    createFramebuffer: jest.fn().mockReturnValue({}),
    bindFramebuffer: jest.fn(),
    framebufferTexture2D: jest.fn(),
    checkFramebufferStatus: jest.fn().mockReturnValue(36053), // FRAMEBUFFER_COMPLETE

    // Performance monitoring
    finish: jest.fn(),
    flush: jest.fn(),
  };

  return gl as unknown as WebGLRenderingContext;
};

export const createMockShader = () => ({
  compile: jest.fn(),
  bind: jest.fn(),
  unbind: jest.fn(),
  delete: jest.fn(),
  setUniform: jest.fn(),
  setAttribute: jest.fn(),
});

export const createMockTexture = () => ({
  bind: jest.fn(),
  unbind: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  resize: jest.fn(),
});
