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

const mockCanvas = {
  getContext: jest.fn().mockReturnValue(mockWebGLContext),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  width: 800,
  height: 600,
} as unknown as HTMLCanvasElement;

const mockDeviceProfileImplementation = {
  getProfile: jest.fn().mockReturnValue({
    useWebGL2: false,
    isMobileDevice: false,
    maxTextureSize: 4096,
    maxTextureUnits: 8,
    maxDrawCalls: 1000,
  }),
  isMobileDevice: jest.fn().mockReturnValue(false),
};

const mockProfilerImplementation = {
  getMetrics: jest.fn().mockReturnValue({
    drawCalls: 0,
    triangleCount: 0,
    gpuTime: 0,
  }),
};

jest.mock('../device-profile-manager', () => ({
  DeviceProfileManager: {
    getInstance: jest.fn().mockReturnValue(mockDeviceProfileImplementation),
  },
}));
jest.mock('../performance-profiler', () => ({
  PerformanceProfiler: {
    getInstance: jest.fn().mockReturnValue(mockProfilerImplementation),
  },
}));
