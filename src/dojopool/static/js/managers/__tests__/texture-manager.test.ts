import { WebGLContextManager } from '../webgl-context-manager';
import { DeviceProfileManager } from '../device-profile-manager';
import { PerformanceProfiler } from '../performance-profiler';

// Mock WebGL context
const mockWebGLContext = {
    createTexture: jest.fn().mockReturnValue({}),
    bindTexture: jest.fn(),
    texImage2D: jest.fn(),
    compressedTexImage2D: jest.fn(),
    texParameteri: jest.fn(),
    generateMipmap: jest.fn(),
    deleteTexture: jest.fn(),
    getParameter: jest.fn().mockReturnValue(0),
    getExtension: jest.fn().mockReturnValue(null),
    getSupportedExtensions: jest.fn().mockReturnValue([]),
    texStorage2D: jest.fn(),
    texSubImage2D: jest.fn(),
    TEXTURE_2D: 0,
    RGBA: 1,
    RGBA8: 2,
    UNSIGNED_BYTE: 3,
    LINEAR: 4,
    NEAREST: 5,
    TEXTURE_MIN_FILTER: 6,
    TEXTURE_MAG_FILTER: 7,
    TEXTURE_WIDTH: 8,
    TEXTURE_HEIGHT: 9,
    COMPRESSED_RGBA_S3TC_DXT5_EXT: 10,
    COMPRESSED_RGBA8_ETC2_EAC: 11,
    COMPRESSED_RGBA_ASTC_4x4_KHR: 12
} as unknown as WebGLRenderingContext;

// Mock DeviceProfileManager
const mockDeviceProfileManager = {
    isMobileDevice: jest.fn().mockReturnValue(false),
    getProfile: jest.fn().mockReturnValue({
        useWebGL2: false,
        maxTextureSize: 4096,
        maxTextureUnits: 8
    })
} as unknown as DeviceProfileManager;

// Mock PerformanceProfiler
const mockPerformanceProfiler = {
    getInstance: jest.fn().mockReturnValue({
        start: jest.fn(),
        end: jest.fn(),
        getMetrics: jest.fn().mockReturnValue({})
    })
} as unknown as PerformanceProfiler;

describe('TextureManager', () => {
    let webglManager: WebGLContextManager;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create canvas
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;

        // Create WebGLContextManager instance
        webglManager = new WebGLContextManager({
            canvas,
            contextAttributes: {
                alpha: true,
                depth: true,
                stencil: true,
                antialias: true
            }
        });

        // Mock WebGL context state
        (webglManager as any).contextState = {
            gl: mockWebGLContext,
            texturePool: [],
            activeTextures: new Set(),
            textureFormats: new Map([['rgba', {
                format: mockWebGLContext.RGBA,
                internalFormat: mockWebGLContext.RGBA,
                type: mockWebGLContext.UNSIGNED_BYTE,
                compressed: false
            }]]),
            qualityReductionLevel: 0,
            streamingTextures: new Map(),
            streamingQueue: [],
            maxStreamingTextures: 64,
            currentStreamingLoad: 0,
            lastStreamCheck: 0,
            preloadGroups: new Map(),
            progressiveLoadQueue: new Set(),
            textureAtlases: [],
            atlasRegionMap: new Map(),
            webgl2Features: null,
            textureWorker: null,
            pendingWorkerTasks: new Map()
        };
    });

    afterEach(() => {
        webglManager.cleanup();
    });

    describe('Basic Texture Operations', () => {
        it('should create a new texture', () => {
            const texture = webglManager.createTexture(256, 256);
            expect(texture).toBeDefined();
            expect(mockWebGLContext.createTexture).toHaveBeenCalled();
            expect(mockWebGLContext.bindTexture).toHaveBeenCalled();
            expect(mockWebGLContext.texParameteri).toHaveBeenCalledTimes(2);
        });

        it('should reuse texture from pool when available', () => {
            const poolTexture = {};
            (webglManager as any).contextState.texturePool.push(poolTexture);
            
            const texture = webglManager.createTexture(256, 256);
            expect(texture).toBe(poolTexture);
            expect(mockWebGLContext.createTexture).not.toHaveBeenCalled();
        });

        it('should handle texture creation failure', () => {
            (mockWebGLContext.createTexture as jest.Mock).mockReturnValueOnce(null);
            const texture = webglManager.createTexture(256, 256);
            expect(texture).toBeNull();
        });

        it('should handle texture creation with data', () => {
            const data = new Uint8Array(256 * 256 * 4);
            const texture = webglManager.createTexture(256, 256, data);
            expect(texture).toBeDefined();
            expect(mockWebGLContext.texImage2D).toHaveBeenCalledWith(
                mockWebGLContext.TEXTURE_2D,
                0,
                mockWebGLContext.RGBA,
                256,
                256,
                0,
                mockWebGLContext.RGBA,
                mockWebGLContext.UNSIGNED_BYTE,
                data
            );
        });
    });

    describe('Texture Format Detection', () => {
        it('should detect compressed texture formats', () => {
            (mockWebGLContext.getSupportedExtensions as jest.Mock).mockReturnValue([
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_compressed_texture_etc',
                'WEBGL_compressed_texture_astc'
            ]);

            (mockWebGLContext.getExtension as jest.Mock).mockImplementation((name) => {
                switch (name) {
                    case 'WEBGL_compressed_texture_s3tc':
                        return { COMPRESSED_RGBA_S3TC_DXT5_EXT: mockWebGLContext.COMPRESSED_RGBA_S3TC_DXT5_EXT };
                    case 'WEBGL_compressed_texture_etc':
                        return { COMPRESSED_RGBA8_ETC2_EAC: mockWebGLContext.COMPRESSED_RGBA8_ETC2_EAC };
                    case 'WEBGL_compressed_texture_astc':
                        return { COMPRESSED_RGBA_ASTC_4x4_KHR: mockWebGLContext.COMPRESSED_RGBA_ASTC_4x4_KHR };
                    default:
                        return null;
                }
            });

            // Reinitialize context to trigger format detection
            webglManager = new WebGLContextManager({ canvas });

            const formats = (webglManager as any).contextState.textureFormats;
            expect(formats.has('dxt5')).toBe(true);
            expect(formats.has('etc2')).toBe(true);
            expect(formats.has('astc')).toBe(true);
        });

        it('should handle compressed texture data', () => {
            const data = new Uint8Array(256 * 256);
            (mockWebGLContext.getSupportedExtensions as jest.Mock).mockReturnValue(['WEBGL_compressed_texture_etc']);
            (mockWebGLContext.getExtension as jest.Mock).mockReturnValue({
                COMPRESSED_RGBA8_ETC2_EAC: mockWebGLContext.COMPRESSED_RGBA8_ETC2_EAC
            });
            (mockDeviceProfileManager.isMobileDevice as jest.Mock).mockReturnValue(true);

            // Reinitialize context to trigger format detection
            webglManager = new WebGLContextManager({ canvas });
            const texture = webglManager.createTexture(256, 256, data);

            expect(texture).toBeDefined();
            expect(mockWebGLContext.compressedTexImage2D).toHaveBeenCalled();
        });
    });

    describe('Texture Memory Management', () => {
        it('should calculate texture memory usage', () => {
            (mockWebGLContext.getParameter as jest.Mock)
                .mockReturnValueOnce(256) // width
                .mockReturnValueOnce(256); // height

            (webglManager as any).contextState.activeTextures.add({});
            const memory = (webglManager as any).calculateTextureMemory();
            expect(memory).toBe(256 * 256 * 4); // width * height * 4 bytes per pixel
        });

        it('should handle texture pool cleanup', () => {
            // Fill the texture pool
            for (let i = 0; i < 32; i++) {
                const texture = webglManager.createTexture(256, 256);
                webglManager.deleteTexture(texture!);
            }

            // Create one more texture - should trigger cleanup
            const texture = webglManager.createTexture(256, 256);
            expect(mockWebGLContext.deleteTexture).toHaveBeenCalled();
            expect(texture).toBeDefined();
        });

        it('should track active textures', () => {
            const texture = webglManager.createTexture(256, 256);
            expect((webglManager as any).contextState.activeTextures.has(texture)).toBe(true);

            webglManager.deleteTexture(texture!);
            expect((webglManager as any).contextState.activeTextures.has(texture)).toBe(false);
        });
    });

    describe('Streaming Textures', () => {
        it('should request streaming texture', () => {
            const options = {
                url: 'test.png',
                width: 256,
                height: 256
            };

            webglManager.requestStreamingTexture(options);
            expect((webglManager as any).contextState.streamingQueue).toContain(options);
        });

        it('should not queue duplicate streaming requests', () => {
            const options = {
                url: 'test.png',
                width: 256,
                height: 256
            };

            webglManager.requestStreamingTexture(options);
            webglManager.requestStreamingTexture(options);
            expect((webglManager as any).contextState.streamingQueue.length).toBe(1);
        });

        it('should update last used time for existing streaming textures', () => {
            const now = Date.now();
            const options = {
                url: 'test.png',
                width: 256,
                height: 256
            };

            const streamingTexture = {
                texture: {},
                width: 256,
                height: 256,
                priority: 0,
                loaded: true,
                mipLevels: 1,
                lastUsed: now - 1000,
                currentQuality: 1.0
            };

            (webglManager as any).contextState.streamingTextures.set(options.url, streamingTexture);
            webglManager.requestStreamingTexture(options);
            expect(streamingTexture.lastUsed).toBeGreaterThanOrEqual(now);
        });
    });

    describe('Progressive Loading', () => {
        it('should handle progressive texture loading', async () => {
            const options = {
                url: 'test.png',
                width: 256,
                height: 256,
                generateMipmaps: true
            };

            // Mock worker
            (webglManager as any).contextState.textureWorker = {
                postMessage: jest.fn()
            };

            // Mock successful texture creation
            const mockTexture = {};
            (mockWebGLContext.createTexture as jest.Mock).mockReturnValue(mockTexture);

            await (webglManager as any).loadStreamingTexture(options);

            const streamingTexture = (webglManager as any).contextState.streamingTextures.get(options.url);
            expect(streamingTexture).toBeDefined();
            expect(streamingTexture.texture).toBe(mockTexture);
            expect(streamingTexture.loaded).toBe(true);
            expect(streamingTexture.mipLevels).toBe(9); // log2(256) + 1
        });

        it('should handle progressive loading failure', async () => {
            const options = {
                url: 'test.png',
                width: 256,
                height: 256
            };

            // Mock worker error
            (webglManager as any).contextState.textureWorker = {
                postMessage: jest.fn()
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await expect((webglManager as any).loadStreamingTexture(options)).rejects.toThrow();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Cleanup', () => {
        it('should clean up all textures', () => {
            const texture1 = webglManager.createTexture(256, 256);
            const texture2 = webglManager.createTexture(256, 256);

            webglManager.cleanup();

            expect(mockWebGLContext.deleteTexture).toHaveBeenCalledWith(texture1);
            expect(mockWebGLContext.deleteTexture).toHaveBeenCalledWith(texture2);
            expect((webglManager as any).contextState.activeTextures.size).toBe(0);
            expect((webglManager as any).contextState.texturePool.length).toBe(0);
        });

        it('should handle cleanup with no textures', () => {
            expect(() => webglManager.cleanup()).not.toThrow();
        });

        it('should clean up streaming textures', () => {
            const streamingTexture = {
                texture: {},
                width: 256,
                height: 256,
                priority: 0,
                loaded: true,
                mipLevels: 1,
                lastUsed: Date.now(),
                currentQuality: 1.0
            };

            (webglManager as any).contextState.streamingTextures.set('test.png', streamingTexture);
            webglManager.cleanup();

            expect(mockWebGLContext.deleteTexture).toHaveBeenCalledWith(streamingTexture.texture);
            expect((webglManager as any).contextState.streamingTextures.size).toBe(0);
            expect((webglManager as any).contextState.streamingQueue.length).toBe(0);
        });
    });
}); 