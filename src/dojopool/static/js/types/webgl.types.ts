export interface WebGLContextState {
  lostCount: number;
  lastLostTime: number;
  qualityLevel: number;
  isContextLost: boolean;
  recoveryAttempts: number;
}

export interface WebGLResources {
  gl: WebGLRenderingContext | null;
  program: WebGLProgram | null;
  vertexBuffer: WebGLBuffer | null;
  textureCoordBuffer: WebGLBuffer | null;
  texture: WebGLTexture | null;
}

export interface GPUCapabilities {
  maxTextureSize: number;
  maxViewportDims: number[];
  maxRenderbufferSize: number;
}

export interface ShaderConfig {
  vertexSource: string;
  fragmentSource: string;
  quality: number;
}
