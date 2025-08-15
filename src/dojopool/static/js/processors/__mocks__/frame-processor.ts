// Mock WebGL context
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
    cleanup: jest.fn(),
  })),
}));
jest.mock("../../managers/transition-manager", () => ({
  TransitionManager: jest.fn().mockImplementation(() => ({
    startTransition: jest.fn(),
    cleanup: jest.fn(),
  })),
})); 