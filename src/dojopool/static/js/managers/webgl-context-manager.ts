import { BaseManager } from './base-manager';
import { DeviceProfileManager, PerformanceProfile } from './device-profile-manager';
import { PerformanceProfiler } from './performance-profiler';

export interface WebGLContextOptions {
    readonly canvas: HTMLCanvasElement;
    readonly contextAttributes?: WebGLContextAttributes;
    readonly maxTextureUnits?: number;
}

interface TextureFormat {
    readonly format: number;
    readonly internalFormat: number;
    readonly type: number;
    readonly compressed: boolean;
}

interface PerformanceMetrics {
    readonly fps: number;
    readonly drawCalls: number;
    readonly textureMemory: number;
    readonly contextLossCount: number;
    readonly lastFrameTime: number;
}

interface TextureStreamOptions {
    readonly url: string;
    readonly width: number;
    readonly height: number;
    readonly priority?: number;
    readonly generateMipmaps?: boolean;
}

interface TexturePreloadGroup {
    readonly id: string;
    readonly textures: TextureStreamOptions[];
    readonly onProgress?: (progress: number) => void;
    priority: number;
}

interface ProgressiveTextureData {
    readonly width: number;
    readonly height: number;
    readonly levels: {
        readonly data: ArrayBufferView;
        readonly quality: number;
    }[];
}

interface StreamingTexture {
    readonly texture: WebGLTexture;
    readonly width: number;
    readonly height: number;
    readonly priority: number;
    loaded: boolean;
    mipLevels: number;
    lastUsed: number;
    currentQuality: number;
    progressiveData?: ProgressiveTextureData;
}

interface TextureAtlasRegion {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly rotated: boolean;
}

interface TextureAtlas {
    readonly texture: WebGLTexture;
    readonly width: number;
    readonly height: number;
    readonly regions: Map<string, TextureAtlasRegion>;
    usedSpace: number;
    lastAccess: number;
}

interface WebGL2Features {
    readonly vertexArrayObjects: boolean;
    readonly instancedArrays: boolean;
    readonly uniformBuffers: boolean;
    readonly transformFeedback: boolean;
    readonly multiDrawIndirect: boolean;
    readonly computeShaders: boolean;
}

interface TextureWorkerMessage {
    readonly type: 'load' | 'compress' | 'process';
    readonly url?: string;
    readonly data?: ArrayBufferView;
    readonly width?: number;
    readonly height?: number;
    readonly format?: string;
    readonly quality?: number;
}

interface ContextState {
    readonly gl: WebGLRenderingContext | WebGL2RenderingContext;
    readonly isWebGL2: boolean;
    lostCount: number;
    lastLostTime: number;
    qualityReductionLevel: number;
    recoveryAttempts: number;
    lastPerformanceCheck: number;
    activeTextures: Set<WebGLTexture>;
    texturePool: WebGLTexture[];
    lastMemoryCheck: number;
    textureFormats: Map<string, TextureFormat>;
    metrics: PerformanceMetrics;
    frameStartTime: number;
    streamingTextures: Map<string, StreamingTexture>;
    streamingQueue: TextureStreamOptions[];
    maxStreamingTextures: number;
    currentStreamingLoad: number;
    lastStreamCheck: number;
    preloadGroups: Map<string, TexturePreloadGroup>;
    progressiveLoadQueue: Set<string>;
    textureAtlases: TextureAtlas[];
    atlasRegionMap: Map<string, { atlas: TextureAtlas; region: TextureAtlasRegion }>;
    webgl2Features: WebGL2Features | null;
    textureWorker: Worker | null;
    pendingWorkerTasks: Map<string, { resolve: (data: ArrayBufferView) => void; reject: (error: Error) => void }>;
}

interface QualityLevel {
    readonly textureQuality: number;
    readonly maxDrawCalls: number;
    readonly useFloatTextures: boolean;
    readonly antialias: boolean;
    readonly depthBuffer: boolean;
    readonly powerPreference: WebGLContextAttributes['powerPreference'];
}

export interface WebGLContextManager {
    getContext(): WebGLRenderingContext | WebGL2RenderingContext | null;
    getQualityLevel(): number;
    addContextListener(listener: (event: { type: string }) => void): void;
    removeContextListener(listener: (event: { type: string }) => void): void;
}

export class WebGLContextManager extends BaseManager<WebGLContextManager> {
    private static readonly CONTEXT_RECOVERY_DELAY = 1000; // 1 second
    private static readonly MAX_RECOVERY_ATTEMPTS = 5;
    private static readonly PERFORMANCE_CHECK_INTERVAL = 5000; // 5 seconds
    private static readonly MEMORY_CHECK_INTERVAL = 10000; // 10 seconds
    private static readonly MIN_STABLE_TIME = 30000; // 30 seconds
    private static readonly MAX_TEXTURE_POOL_SIZE = 32;
    private static readonly TEXTURE_POOL_CLEANUP_THRESHOLD = 0.8; // 80% usage
    private static readonly QUALITY_LEVELS: QualityLevel[] = [
        {
            textureQuality: 1.0,
            maxDrawCalls: 2000,
            useFloatTextures: true,
            antialias: true,
            depthBuffer: true,
            powerPreference: 'high-performance'
        },
        {
            textureQuality: 0.75,
            maxDrawCalls: 1000,
            useFloatTextures: true,
            antialias: true,
            depthBuffer: true,
            powerPreference: 'default'
        },
        {
            textureQuality: 0.5,
            maxDrawCalls: 500,
            useFloatTextures: false,
            antialias: false,
            depthBuffer: true,
            powerPreference: 'low-power'
        },
        {
            textureQuality: 0.25,
            maxDrawCalls: 250,
            useFloatTextures: false,
            antialias: false,
            depthBuffer: false,
            powerPreference: 'low-power'
        }
    ];

    private static readonly DEFAULT_TEXTURE_FORMAT: TextureFormat = {
        format: 0x1908, // RGBA
        internalFormat: 0x1908, // RGBA
        type: 0x1401, // UNSIGNED_BYTE
        compressed: false
    };

    private static readonly STREAMING_CHECK_INTERVAL = 1000; // 1 second
    private static readonly MAX_CONCURRENT_STREAMS = 2;
    private static readonly MAX_STREAMING_TEXTURES = 64;
    private static readonly STREAMING_MEMORY_LIMIT = 256 * 1024 * 1024; // 256MB
    private static readonly PROGRESSIVE_QUALITY_LEVELS = [0.25, 0.5, 0.75, 1.0];
    private static readonly PROGRESSIVE_LOAD_INTERVAL = 100; // 100ms
    private static readonly ATLAS_SIZE = 2048;
    private static readonly MIN_ATLAS_REGION = 64;
    private static readonly MAX_ATLAS_COUNT = 4;
    private static readonly ATLAS_CLEANUP_THRESHOLD = 0.2; // 20% usage
    private static readonly MEMORY_PRESSURE_THRESHOLD = 0.8; // 80% of limit
    private static readonly WORKER_SCRIPT = `
        self.onmessage = async function(e) {
            const { type, url, data, width, height, format, quality } = e.data;
            
            try {
                let result;
                switch (type) {
                    case 'load':
                        result = await loadAndProcessImage(url);
                        break;
                    case 'compress':
                        result = compressImageData(data, width, height, format);
                        break;
                    case 'process':
                        result = processImageData(data, width, height, quality);
                        break;
                }
                self.postMessage({ success: true, data: result }, [result.buffer]);
            } catch (error) {
                self.postMessage({ success: false, error: error.message });
            }
        };

        async function loadAndProcessImage(url) {
            const response = await fetch(url);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            return imageToArray(bitmap);
        }

        function imageToArray(bitmap) {
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);
            return ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
        }

        function compressImageData(data, width, height, format) {
            // Implement format-specific compression
            switch (format) {
                case 'rle':
                    return compressRLE(data);
                case 'etc2':
                    return compressETC2(data, width, height);
                default:
                    return data;
            }
        }

        function processImageData(data, width, height, quality) {
            const canvas = new OffscreenCanvas(
                Math.round(width * quality),
                Math.round(height * quality)
            );
            const ctx = canvas.getContext('2d');
            const imageData = new ImageData(
                new Uint8ClampedArray(data),
                width,
                height
            );
            ctx.putImageData(imageData, 0, 0);
            return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        }

        function compressRLE(data) {
            const compressed = new Uint8Array(data.length);
            let writeIndex = 0;
            let readIndex = 0;

            while (readIndex < data.length) {
                let count = 1;
                while (
                    count < 255 &&
                    readIndex + 4 < data.length &&
                    data[readIndex] === data[readIndex + 4] &&
                    data[readIndex + 1] === data[readIndex + 5] &&
                    data[readIndex + 2] === data[readIndex + 6] &&
                    data[readIndex + 3] === data[readIndex + 7]
                ) {
                    count++;
                    readIndex += 4;
                }

                compressed[writeIndex++] = count;
                compressed[writeIndex++] = data[readIndex++];
                compressed[writeIndex++] = data[readIndex++];
                compressed[writeIndex++] = data[readIndex++];
                compressed[writeIndex++] = data[readIndex++];
            }

            return compressed.slice(0, writeIndex);
        }

        function compressETC2(data, width, height) {
            // Simplified ETC2 compression simulation
            const blockSize = 4;
            const compressed = new Uint8Array(Math.ceil(width / 4) * Math.ceil(height / 4) * 8);
            let writeIndex = 0;

            for (let y = 0; y < height; y += blockSize) {
                for (let x = 0; x < width; x += blockSize) {
                    const block = getBlock(data, x, y, width, height, blockSize);
                    const compressedBlock = compressBlock(block);
                    compressed.set(compressedBlock, writeIndex);
                    writeIndex += 8;
                }
            }

            return compressed;
        }

        function getBlock(data, x, y, width, height, blockSize) {
            const block = new Uint8Array(blockSize * blockSize * 4);
            let writeIndex = 0;

            for (let by = 0; by < blockSize; by++) {
                for (let bx = 0; bx < blockSize; bx++) {
                    const px = Math.min(x + bx, width - 1);
                    const py = Math.min(y + by, height - 1);
                    const index = (py * width + px) * 4;

                    block[writeIndex++] = data[index];
                    block[writeIndex++] = data[index + 1];
                    block[writeIndex++] = data[index + 2];
                    block[writeIndex++] = data[index + 3];
                }
            }

            return block;
        }

        function compressBlock(block) {
            // Simplified block compression
            const compressed = new Uint8Array(8);
            let r = 0, g = 0, b = 0, a = 0;

            // Average color
            for (let i = 0; i < block.length; i += 4) {
                r += block[i];
                g += block[i + 1];
                b += block[i + 2];
                a += block[i + 3];
            }

            compressed[0] = r >> 4;
            compressed[1] = g >> 4;
            compressed[2] = b >> 4;
            compressed[3] = a >> 4;

            // Simplified differential encoding
            for (let i = 4; i < 8; i++) {
                compressed[i] = Math.random() * 255;
            }

            return compressed;
        }
    `;

    private readonly canvas: HTMLCanvasElement;
    private readonly deviceProfile: DeviceProfileManager;
    private readonly profiler: PerformanceProfiler;
    private contextState: ContextState | null = null;
    private readonly contextLostListeners: Set<() => void> = new Set();
    private readonly contextRestoredListeners: Set<() => void> = new Set();
    private performanceCheckerId: number | null = null;
    private readonly maxTextureUnits: number;
    private memoryCheckerId: number | null = null;
    private streamingCheckerId: number | null = null;
    private progressiveLoaderId: number | null = null;
    private atlasCleanupTimer: number | null = null;

    protected constructor(options: WebGLContextOptions) {
        super();
        this.canvas = options.canvas;
        this.deviceProfile = DeviceProfileManager.getInstance();
        this.profiler = PerformanceProfiler.getInstance();
        this.maxTextureUnits = options.maxTextureUnits ?? 8;
        this.initializeContext(options.contextAttributes);
        this.setupEventListeners();
        this.startPerformanceMonitoring();
        this.startMemoryMonitoring();
        this.startStreamingMonitor();
        this.startProgressiveLoader();
    }

    private initializeContext(attributes?: WebGLContextAttributes): void {
        const profile = this.deviceProfile.getProfile();
        const qualityLevel = this.contextState?.qualityReductionLevel ?? 0;
        const quality = WebGLContextManager.QUALITY_LEVELS[qualityLevel];

        const contextAttributes: WebGLContextAttributes = {
            alpha: true,
            antialias: quality.antialias,
            depth: quality.depthBuffer,
            failIfMajorPerformanceCaveat: false,
            powerPreference: quality.powerPreference,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            stencil: false,
            ...attributes
        };

        let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

        // Try WebGL 2 first if supported and enabled
        if (profile.useWebGL2) {
            gl = this.canvas.getContext('webgl2', contextAttributes);
        }

        // Fall back to WebGL 1
        if (!gl) {
            gl = this.canvas.getContext('webgl', contextAttributes);
        }

        if (!gl) {
            throw new Error('Failed to initialize WebGL context');
        }

        this.contextState = {
            gl,
            isWebGL2: gl instanceof WebGL2RenderingContext,
            lostCount: this.contextState?.lostCount ?? 0,
            lastLostTime: this.contextState?.lastLostTime ?? 0,
            qualityReductionLevel: qualityLevel,
            recoveryAttempts: 0,
            lastPerformanceCheck: Date.now(),
            activeTextures: new Set(this.contextState?.activeTextures ?? []),
            texturePool: this.contextState?.texturePool ?? [],
            lastMemoryCheck: Date.now(),
            textureFormats: this.detectTextureFormats(gl),
            metrics: {
                fps: 0,
                drawCalls: 0,
                textureMemory: 0,
                contextLossCount: 0,
                lastFrameTime: 0
            },
            frameStartTime: performance.now(),
            streamingTextures: new Map(),
            streamingQueue: [],
            maxStreamingTextures: this.calculateMaxStreamingTextures(),
            currentStreamingLoad: 0,
            lastStreamCheck: Date.now(),
            preloadGroups: new Map(),
            progressiveLoadQueue: new Set(),
            textureAtlases: [],
            atlasRegionMap: new Map(),
            webgl2Features: this.detectWebGL2Features(gl),
            textureWorker: this.createTextureWorker(),
            pendingWorkerTasks: new Map()
        };

        this.configureContext(gl, profile, quality);
    }

    private configureContext(
        gl: WebGLRenderingContext | WebGL2RenderingContext,
        profile: PerformanceProfile,
        quality: QualityLevel
    ): void {
        // Enable extensions based on quality level
        if (quality.useFloatTextures) {
            gl.getExtension('OES_texture_float');
        }

        // Configure texture filtering
        const filterMode = quality.textureQuality > 0.5 ? gl.LINEAR : gl.NEAREST;
        gl.hint(gl.GENERATE_MIPMAP_HINT, quality.textureQuality > 0.7 ? gl.NICEST : gl.FASTEST);

        // Set default state
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Additional mobile optimizations
        if (this.deviceProfile.isMobileDevice()) {
            gl.hint(gl.FRAGMENT_SHADER_DERIVATIVE_HINT, gl.FASTEST);
            if (quality.textureQuality <= 0.5) {
                gl.disable(gl.DITHER);
            }
        }
    }

    private detectTextureFormats(gl: WebGLRenderingContext | WebGL2RenderingContext): Map<string, TextureFormat> {
        const formats = new Map<string, TextureFormat>();
        const exts = gl.getSupportedExtensions() || [];

        // Add default RGBA format
        formats.set('rgba', WebGLContextManager.DEFAULT_TEXTURE_FORMAT);

        // Check for compressed texture support
        const compressionExts = [
            'WEBGL_compressed_texture_s3tc',
            'WEBGL_compressed_texture_etc',
            'WEBGL_compressed_texture_astc',
            'WEBGL_compressed_texture_pvrtc'
        ];

        for (const extName of compressionExts) {
            const ext = gl.getExtension(extName);
            if (ext) {
                switch (extName) {
                    case 'WEBGL_compressed_texture_s3tc':
                        formats.set('dxt5', {
                            format: ext.COMPRESSED_RGBA_S3TC_DXT5_EXT,
                            internalFormat: ext.COMPRESSED_RGBA_S3TC_DXT5_EXT,
                            type: 0,
                            compressed: true
                        });
                        break;
                    case 'WEBGL_compressed_texture_etc':
                        formats.set('etc2', {
                            format: ext.COMPRESSED_RGBA8_ETC2_EAC,
                            internalFormat: ext.COMPRESSED_RGBA8_ETC2_EAC,
                            type: 0,
                            compressed: true
                        });
                        break;
                    case 'WEBGL_compressed_texture_astc':
                        formats.set('astc', {
                            format: ext.COMPRESSED_RGBA_ASTC_4x4_KHR,
                            internalFormat: ext.COMPRESSED_RGBA_ASTC_4x4_KHR,
                            type: 0,
                            compressed: true
                        });
                        break;
                    case 'WEBGL_compressed_texture_pvrtc':
                        formats.set('pvrtc', {
                            format: ext.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
                            internalFormat: ext.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
                            type: 0,
                            compressed: true
                        });
                        break;
                }
            }
        }

        return formats;
    }

    private detectWebGL2Features(gl: WebGLRenderingContext | WebGL2RenderingContext): WebGL2Features | null {
        if (!(gl instanceof WebGL2RenderingContext)) return null;

        return {
            vertexArrayObjects: true,
            instancedArrays: true,
            uniformBuffers: true,
            transformFeedback: true,
            multiDrawIndirect: !!gl.getExtension('WEBGL_multi_draw'),
            computeShaders: !!gl.getExtension('WEBGL_compute_shader')
        };
    }

    private createTextureWorker(): Worker | null {
        try {
            const blob = new Blob([WebGLContextManager.WORKER_SCRIPT], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const worker = new Worker(url);
            URL.revokeObjectURL(url);

            worker.onmessage = (e: MessageEvent) => {
                const { success, data, error } = e.data;
                const task = this.contextState?.pendingWorkerTasks.get(e.data.id);
                if (task) {
                    if (success) {
                        task.resolve(data);
                    } else {
                        task.reject(new Error(error));
                    }
                    this.contextState?.pendingWorkerTasks.delete(e.data.id);
                }
            };

            return worker;
        } catch (error) {
            console.warn('Failed to create texture worker:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    private async processTextureInWorker(message: TextureWorkerMessage): Promise<ArrayBufferView> {
        if (!this.contextState?.textureWorker) {
            throw new Error('Texture worker not available');
        }

        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).slice(2);
            this.contextState.pendingWorkerTasks.set(id, { resolve, reject });
            this.contextState.textureWorker.postMessage({ ...message, id });
        });
    }

    private startPerformanceMonitoring(): void {
        this.performanceCheckerId = self.setInterval(() => {
            this.checkPerformance();
        }, WebGLContextManager.PERFORMANCE_CHECK_INTERVAL);
    }

    private checkPerformance(): void {
        if (!this.contextState) return;

        const now = Date.now();
        const metrics = this.profiler.getMetrics();
        const timeSinceLastLoss = now - this.contextState.lastLostTime;
        const currentQuality = WebGLContextManager.QUALITY_LEVELS[this.contextState.qualityReductionLevel];

        // Check if we can increase quality
        if (
            timeSinceLastLoss > WebGLContextManager.MIN_STABLE_TIME &&
            metrics.frameRate >= currentQuality.maxDrawCalls &&
            this.contextState.qualityReductionLevel > 0
        ) {
            this.contextState.qualityReductionLevel--;
            this.initializeContext();
            return;
        }

        // Check if we need to reduce quality
        if (
            metrics.frameRate < currentQuality.maxDrawCalls * 0.8 ||
            metrics.contextLostCount > this.contextState.lostCount
        ) {
            this.reduceQuality();
        }
    }

    private reduceQuality(): void {
        if (!this.contextState) return;

        const nextLevel = this.contextState.qualityReductionLevel + 1;
        if (nextLevel < WebGLContextManager.QUALITY_LEVELS.length) {
            this.contextState.qualityReductionLevel = nextLevel;
            this.initializeContext();
        }
    }

    private setupEventListeners(): void {
        this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
        this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
    }

    private readonly handleContextLost = (event: Event): void => {
        event.preventDefault();
        if (this.contextState) {
            this.contextState.lostCount++;
            this.contextState.lastLostTime = Date.now();
            this.contextState.recoveryAttempts = 0;
        }
        this.contextLostListeners.forEach(listener => listener());
        this.attemptContextRecovery();
    };

    private readonly handleContextRestored = (): void => {
        if (!this.contextState) return;

        const profile = this.deviceProfile.getProfile();
        const quality = WebGLContextManager.QUALITY_LEVELS[this.contextState.qualityReductionLevel];

        if (this.contextState.gl) {
            this.configureContext(this.contextState.gl, profile, quality);
        }

        this.contextRestoredListeners.forEach(listener => listener());
    };

    private async attemptContextRecovery(): Promise<void> {
        if (!this.contextState) return;

        const { recoveryAttempts, lastLostTime } = this.contextState;
        const timeSinceLastLoss = Date.now() - lastLostTime;

        // If we've had too many recovery attempts, reduce quality
        if (recoveryAttempts >= WebGLContextManager.MAX_RECOVERY_ATTEMPTS) {
            this.reduceQuality();
            this.contextState.recoveryAttempts = 0;
            return;
        }

        // Wait before attempting recovery
        if (timeSinceLastLoss < WebGLContextManager.CONTEXT_RECOVERY_DELAY) {
            await new Promise(resolve =>
                setTimeout(resolve, WebGLContextManager.CONTEXT_RECOVERY_DELAY - timeSinceLastLoss)
            );
        }

        try {
            this.contextState.recoveryAttempts++;
            this.initializeContext();
        } catch (error) {
            console.error('Context recovery failed:', error instanceof Error ? error.message : 'Unknown error');
            // Try again with reduced quality if recovery failed
            this.reduceQuality();
        }
    }

    public getContext(): WebGLRenderingContext | WebGL2RenderingContext {
        if (!this.contextState?.gl) {
            throw new Error('WebGL context not initialized');
        }
        return this.contextState.gl;
    }

    public getCurrentQualityLevel(): number {
        return this.contextState?.qualityReductionLevel ?? 0;
    }

    public onContextLost(listener: () => void): () => void {
        this.contextLostListeners.add(listener);
        return () => {
            this.contextLostListeners.delete(listener);
        };
    }

    public onContextRestored(listener: () => void): () => void {
        this.contextRestoredListeners.add(listener);
        return () => {
            this.contextRestoredListeners.delete(listener);
        };
    }

    private startMemoryMonitoring(): void {
        this.memoryCheckerId = self.setInterval(() => {
            this.checkMemoryUsage();
        }, WebGLContextManager.MEMORY_CHECK_INTERVAL);
        this.atlasCleanupTimer = self.setInterval(() => {
            this.cleanupAtlases();
        }, WebGLContextManager.MEMORY_CHECK_INTERVAL);
    }

    private checkMemoryUsage(): void {
        if (!this.contextState) return;

        const now = Date.now();
        if (now - this.contextState.lastMemoryCheck < WebGLContextManager.MEMORY_CHECK_INTERVAL) return;

        this.contextState.lastMemoryCheck = now;

        // Clean up unused textures
        if (this.contextState.texturePool.length > WebGLContextManager.MAX_TEXTURE_POOL_SIZE * WebGLContextManager.TEXTURE_POOL_CLEANUP_THRESHOLD) {
            this.cleanupTexturePool();
        }

        // Force texture cleanup on low memory
        if (this.deviceProfile.getCapabilities().isLowEndDevice || this.deviceProfile.isMobileDevice()) {
            this.cleanupTexturePool(true);
        }
    }

    private cleanupTexturePool(force: boolean = false): void {
        if (!this.contextState?.gl) return;

        const { gl, texturePool, activeTextures } = this.contextState;
        const maxPoolSize = force ? Math.floor(WebGLContextManager.MAX_TEXTURE_POOL_SIZE / 2) : WebGLContextManager.MAX_TEXTURE_POOL_SIZE;

        while (texturePool.length > maxPoolSize) {
            const texture = texturePool.pop();
            if (texture && !activeTextures.has(texture)) {
                gl.deleteTexture(texture);
            }
        }
    }

    public createTexture(width: number, height: number, data?: ArrayBufferView | null): WebGLTexture | null {
        if (!this.contextState?.gl) return null;

        const { gl, texturePool, activeTextures, textureFormats } = this.contextState;
        const isMobile = this.deviceProfile.isMobileDevice();

        // Try to reuse a texture from the pool
        let texture = texturePool.pop();
        if (!texture) {
            texture = gl.createTexture();
            if (!texture) return null;
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Choose appropriate texture format
        let format: TextureFormat;
        if (isMobile && data) {
            // Try compressed formats for mobile
            if (textureFormats.has('etc2')) { // Android
                format = textureFormats.get('etc2')!;
            } else if (textureFormats.has('pvrtc')) { // iOS
                format = textureFormats.get('pvrtc')!;
            } else {
                format = WebGLContextManager.DEFAULT_TEXTURE_FORMAT;
            }
        } else {
            format = WebGLContextManager.DEFAULT_TEXTURE_FORMAT;
        }

        // Upload texture data
        if (data) {
            if (format.compressed) {
                gl.compressedTexImage2D(
                    gl.TEXTURE_2D,
                    0,
                    format.internalFormat,
                    width,
                    height,
                    0,
                    data
                );
            } else {
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    format.internalFormat,
                    width,
                    height,
                    0,
                    format.format,
                    format.type,
                    data
                );
            }
        }

        // Set texture parameters based on quality level
        const quality = WebGLContextManager.QUALITY_LEVELS[this.contextState.qualityReductionLevel];
        const filterMode = quality.textureQuality > 0.5 ? gl.LINEAR : gl.NEAREST;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterMode);

        activeTextures.add(texture);
        this.updateMetrics();
        return texture;
    }

    private updateMetrics(): void {
        if (!this.contextState) return;

        const now = performance.now();
        const frameTime = now - this.contextState.frameStartTime;

        this.contextState.metrics = {
            fps: 1000 / frameTime,
            drawCalls: this.profiler.getMetrics().drawCalls,
            textureMemory: this.calculateTextureMemory(),
            contextLossCount: this.contextState.lostCount,
            lastFrameTime: frameTime
        };

        this.contextState.frameStartTime = now;
    }

    private calculateTextureMemory(): number {
        if (!this.contextState?.gl) return 0;

        let totalMemory = 0;
        const { gl, activeTextures, streamingTextures } = this.contextState;

        // Calculate memory for regular textures
        for (const texture of activeTextures) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            const width = gl.getParameter(gl.TEXTURE_WIDTH);
            const height = gl.getParameter(gl.TEXTURE_HEIGHT);
            totalMemory += width * height * 4;
        }

        // Calculate memory for streaming textures
        for (const [_, streamingTexture] of streamingTextures) {
            if (streamingTexture.loaded) {
                let mipSize = streamingTexture.width * streamingTexture.height * 4;
                for (let i = 1; i < streamingTexture.mipLevels; i++) {
                    mipSize /= 4;
                    totalMemory += mipSize;
                }
                totalMemory += streamingTexture.width * streamingTexture.height * 4;
            }
        }

        return totalMemory;
    }

    public getMetrics(): Readonly<PerformanceMetrics> {
        return this.contextState?.metrics ?? {
            fps: 0,
            drawCalls: 0,
            textureMemory: 0,
            contextLossCount: 0,
            lastFrameTime: 0
        };
    }

    public deleteTexture(texture: WebGLTexture): void {
        if (!this.contextState?.gl || !texture) return;

        const { gl, texturePool, activeTextures } = this.contextState;
        activeTextures.delete(texture);

        // Add to pool if space available, otherwise delete
        if (texturePool.length < WebGLContextManager.MAX_TEXTURE_POOL_SIZE) {
            texturePool.push(texture);
        } else {
            gl.deleteTexture(texture);
        }
    }

    private calculateMaxStreamingTextures(): number {
        const capabilities = this.deviceProfile.getCapabilities();
        if (capabilities.isMobile) {
            return Math.min(32, WebGLContextManager.MAX_STREAMING_TEXTURES);
        }
        return WebGLContextManager.MAX_STREAMING_TEXTURES;
    }

    private startStreamingMonitor(): void {
        this.streamingCheckerId = self.setInterval(() => {
            this.processStreamingQueue();
        }, WebGLContextManager.STREAMING_CHECK_INTERVAL);
    }

    private async processStreamingQueue(): Promise<void> {
        if (!this.contextState) return;

        const { streamingQueue, streamingTextures, currentStreamingLoad } = this.contextState;
        const maxLoad = this.contextState.maxStreamingTextures;

        // Sort queue by priority
        streamingQueue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        // Process queue if we have capacity
        while (
            streamingQueue.length > 0 &&
            currentStreamingLoad < maxLoad &&
            streamingTextures.size < this.contextState.maxStreamingTextures
        ) {
            const options = streamingQueue.shift();
            if (!options) break;

            try {
                this.contextState.currentStreamingLoad++;
                await this.loadStreamingTexture(options);
            } catch (error) {
                console.error('Failed to load streaming texture:', error instanceof Error ? error.message : 'Unknown error');
            } finally {
                this.contextState.currentStreamingLoad--;
            }
        }

        // Cleanup old textures if needed
        this.cleanupStreamingTextures();
    }

    private async loadStreamingTexture(options: TextureStreamOptions): Promise<void> {
        if (!this.contextState?.gl) return;

        try {
            // Load and process image in worker
            const imageData = await this.processTextureInWorker({
                type: 'load',
                url: options.url
            });

            // Create and setup texture
            const texture = await this.createTextureFromWorkerData(
                imageData,
                options.width,
                options.height,
                options.generateMipmaps
            );

            if (texture) {
                const streamingTexture: StreamingTexture = {
                    texture,
                    width: options.width,
                    height: options.height,
                    priority: options.priority ?? 0,
                    loaded: true,
                    mipLevels: options.generateMipmaps
                        ? Math.floor(Math.log2(Math.max(options.width, options.height))) + 1
                        : 1,
                    lastUsed: Date.now(),
                    currentQuality: 1.0
                };

                this.contextState.streamingTextures.set(options.url, streamingTexture);
                this.updateMetrics();
            }
        } catch (error) {
            console.error('Failed to load streaming texture:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    private async createTextureFromWorkerData(
        data: ArrayBufferView,
        width: number,
        height: number,
        generateMipmaps: boolean = false
    ): Promise<WebGLTexture | null> {
        if (!this.contextState?.gl) return null;

        const { gl, webgl2Features } = this.contextState;
        const texture = this.createTexture(width, height);
        if (!texture) return null;

        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Use optimal format based on WebGL version
        if (webgl2Features) {
            // WebGL 2 optimizations
            gl.texStorage2D(gl.TEXTURE_2D, generateMipmaps ? Math.log2(Math.max(width, height)) + 1 : 1, gl.RGBA8, width, height);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
        } else {
            // WebGL 1 fallback
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        }

        if (generateMipmaps) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        return texture;
    }

    private loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            image.src = url;
        });
    }

    private cleanupStreamingTextures(): void {
        if (!this.contextState) return;

        const { streamingTextures } = this.contextState;
        const now = Date.now();
        const maxAge = 30000; // 30 seconds

        for (const [url, texture] of streamingTextures) {
            if (now - texture.lastUsed > maxAge) {
                this.deleteStreamingTexture(url);
            }
        }
    }

    private deleteStreamingTexture(url: string): void {
        if (!this.contextState) return;

        const { streamingTextures } = this.contextState;
        const texture = streamingTextures.get(url);
        if (texture) {
            this.deleteTexture(texture.texture);
            streamingTextures.delete(url);
        }
    }

    public requestStreamingTexture(options: TextureStreamOptions): void {
        if (!this.contextState) return;

        const { streamingTextures, streamingQueue } = this.contextState;

        // Check if already loaded or queued
        if (streamingTextures.has(options.url)) {
            const texture = streamingTextures.get(options.url)!;
            texture.lastUsed = Date.now();
            return;
        }

        if (streamingQueue.some(opt => opt.url === options.url)) {
            return;
        }

        // Add to queue
        streamingQueue.push(options);
    }

    public getStreamingTexture(url: string): WebGLTexture | null {
        if (!this.contextState) return null;

        const texture = this.contextState.streamingTextures.get(url);
        if (texture) {
            texture.lastUsed = Date.now();
            return texture.loaded ? texture.texture : null;
        }
        return null;
    }

    public createPreloadGroup(id: string, textures: TextureStreamOptions[], priority: number = 0): void {
        if (!this.contextState) return;

        const group: TexturePreloadGroup = {
            id,
            textures,
            priority,
            onProgress: (progress: number) => {
                console.debug(`Preload group ${id}: ${Math.round(progress * 100)}% complete`);
            }
        };

        this.contextState.preloadGroups.set(id, group);
        this.schedulePreload(group);
    }

    private async schedulePreload(group: TexturePreloadGroup): Promise<void> {
        const total = group.textures.length;
        let loaded = 0;

        for (const texture of group.textures) {
            // Enhance texture options with group priority
            const enhancedOptions = {
                ...texture,
                priority: texture.priority ?? group.priority
            };

            try {
                await this.preloadTexture(enhancedOptions);
                loaded++;
                group.onProgress?.(loaded / total);
            } catch (error) {
                console.error('Failed to preload texture:', error instanceof Error ? error.message : 'Unknown error');
            }
        }
    }

    private async preloadTexture(options: TextureStreamOptions): Promise<void> {
        if (!this.contextState?.gl) return;

        try {
            const image = await this.loadImage(options.url);
            const progressiveData = await this.createProgressiveData(image, options);

            // Create texture with lowest quality first
            const texture = await this.loadStreamingTexture({
                ...options,
                generateMipmaps: true
            });

            if (texture && this.contextState.streamingTextures.has(options.url)) {
                const streamingTexture = this.contextState.streamingTextures.get(options.url)!;
                streamingTexture.progressiveData = progressiveData;
                streamingTexture.currentQuality = 0;
                this.contextState.progressiveLoadQueue.add(options.url);
            }
        } catch (error) {
            console.error('Preload failed:', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    private async createProgressiveData(image: HTMLImageElement, options: TextureStreamOptions): Promise<ProgressiveTextureData> {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const levels: ProgressiveTextureData['levels'] = [];

        for (const quality of WebGLContextManager.PROGRESSIVE_QUALITY_LEVELS) {
            const width = Math.round(options.width * quality);
            const height = Math.round(options.height * quality);

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(image, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            levels.push({
                data: this.compressImageData(imageData),
                quality
            });
        }

        return {
            width: options.width,
            height: options.height,
            levels
        };
    }

    private compressImageData(imageData: ImageData): Uint8Array {
        const { data } = imageData;
        const compressed = new Uint8Array(data.length);

        // Basic RLE compression
        let writeIndex = 0;
        let readIndex = 0;

        while (readIndex < data.length) {
            let count = 1;
            while (
                count < 255 &&
                readIndex + 4 < data.length &&
                data[readIndex] === data[readIndex + 4] &&
                data[readIndex + 1] === data[readIndex + 5] &&
                data[readIndex + 2] === data[readIndex + 6] &&
                data[readIndex + 3] === data[readIndex + 7]
            ) {
                count++;
                readIndex += 4;
            }

            compressed[writeIndex++] = count;
            compressed[writeIndex++] = data[readIndex++];
            compressed[writeIndex++] = data[readIndex++];
            compressed[writeIndex++] = data[readIndex++];
            compressed[writeIndex++] = data[readIndex++];
        }

        return compressed.slice(0, writeIndex);
    }

    private startProgressiveLoader(): void {
        this.progressiveLoaderId = self.setInterval(() => {
            this.processProgressiveQueue();
        }, WebGLContextManager.PROGRESSIVE_LOAD_INTERVAL);
    }

    private async processProgressiveQueue(): Promise<void> {
        if (!this.contextState?.gl) return;

        const { progressiveLoadQueue, streamingTextures } = this.contextState;

        for (const url of progressiveLoadQueue) {
            const texture = streamingTextures.get(url);
            if (!texture || !texture.progressiveData) continue;

            const nextQualityIndex = Math.min(
                Math.floor(texture.currentQuality * WebGLContextManager.PROGRESSIVE_QUALITY_LEVELS.length),
                WebGLContextManager.PROGRESSIVE_QUALITY_LEVELS.length - 1
            );

            const nextLevel = texture.progressiveData.levels[nextQualityIndex];
            if (nextLevel && nextLevel.quality > texture.currentQuality) {
                await this.updateTextureQuality(texture, nextLevel);
                texture.currentQuality = nextLevel.quality;

                if (nextLevel.quality >= 1.0) {
                    progressiveLoadQueue.delete(url);
                }
            }
        }
    }

    private async updateTextureQuality(
        streamingTexture: StreamingTexture,
        level: { data: ArrayBufferView; quality: number }
    ): Promise<void> {
        if (!this.contextState?.gl) return;

        const { gl } = this.contextState;
        const { texture, width, height } = streamingTexture;

        gl.bindTexture(gl.TEXTURE_2D, texture);

        const scaledWidth = Math.round(width * level.quality);
        const scaledHeight = Math.round(height * level.quality);

        const format = this.selectTextureFormat(scaledWidth, scaledHeight);

        if (format.compressed) {
            gl.compressedTexImage2D(
                gl.TEXTURE_2D,
                0,
                format.internalFormat,
                scaledWidth,
                scaledHeight,
                0,
                level.data
            );
        } else {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                format.internalFormat,
                scaledWidth,
                scaledHeight,
                0,
                format.format,
                format.type,
                level.data
            );
        }

        if (streamingTexture.mipLevels > 1) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
    }

    private selectTextureFormat(width: number, height: number): TextureFormat {
        if (!this.contextState) return WebGLContextManager.DEFAULT_TEXTURE_FORMAT;

        const { textureFormats } = this.contextState;
        const isMobile = this.deviceProfile.isMobileDevice();
        const totalPixels = width * height;

        if (isMobile) {
            // Prefer more aggressive compression for larger textures
            if (totalPixels > 262144) { // 512x512
                if (textureFormats.has('astc')) return textureFormats.get('astc')!;
                if (textureFormats.has('etc2')) return textureFormats.get('etc2')!;
                if (textureFormats.has('pvrtc')) return textureFormats.get('pvrtc')!;
            }
        } else if (totalPixels > 262144) {
            if (textureFormats.has('dxt5')) return textureFormats.get('dxt5')!;
        }

        return WebGLContextManager.DEFAULT_TEXTURE_FORMAT;
    }

    public override cleanup(): void {
        this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
        this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
        if (this.performanceCheckerId !== null) {
            self.clearInterval(this.performanceCheckerId);
            this.performanceCheckerId = null;
        }
        if (this.memoryCheckerId !== null) {
            self.clearInterval(this.memoryCheckerId);
            this.memoryCheckerId = null;
        }
        if (this.streamingCheckerId !== null) {
            self.clearInterval(this.streamingCheckerId);
            this.streamingCheckerId = null;
        }
        if (this.progressiveLoaderId !== null) {
            self.clearInterval(this.progressiveLoaderId);
            this.progressiveLoaderId = null;
        }
        if (this.atlasCleanupTimer !== null) {
            self.clearInterval(this.atlasCleanupTimer);
            this.atlasCleanupTimer = null;
        }
        this.contextLostListeners.clear();
        this.contextRestoredListeners.clear();
        if (this.contextState?.gl) {
            const { gl, activeTextures, texturePool } = this.contextState;
            [...activeTextures, ...texturePool].forEach(texture => {
                gl.deleteTexture(texture);
            });
        }
        this.contextState = null;
        this.onCleanup();

        // Clean up streaming textures
        if (this.contextState?.streamingTextures) {
            for (const [url] of this.contextState.streamingTextures) {
                this.deleteStreamingTexture(url);
            }
        }

        // Clean up atlases
        if (this.contextState?.gl) {
            for (const atlas of this.contextState.textureAtlases) {
                this.contextState.gl.deleteTexture(atlas.texture);
            }
        }

        if (this.contextState?.textureWorker) {
            this.contextState.textureWorker.terminate();
        }
    }

    private async createAtlas(): Promise<TextureAtlas | null> {
        if (!this.contextState?.gl) return null;

        const texture = this.createTexture(
            WebGLContextManager.ATLAS_SIZE,
            WebGLContextManager.ATLAS_SIZE
        );
        if (!texture) return null;

        return {
            texture,
            width: WebGLContextManager.ATLAS_SIZE,
            height: WebGLContextManager.ATLAS_SIZE,
            regions: new Map(),
            usedSpace: 0,
            lastAccess: Date.now()
        };
    }

    private findAtlasRegion(width: number, height: number): { atlas: TextureAtlas; region: TextureAtlasRegion } | null {
        if (!this.contextState) return null;

        // Round up to nearest power of 2
        width = Math.max(WebGLContextManager.MIN_ATLAS_REGION, Math.pow(2, Math.ceil(Math.log2(width))));
        height = Math.max(WebGLContextManager.MIN_ATLAS_REGION, Math.pow(2, Math.ceil(Math.log2(height))));

        // Try to find space in existing atlases
        for (const atlas of this.contextState.textureAtlases) {
            const region = this.findFreeRegion(atlas, width, height);
            if (region) {
                return { atlas, region };
            }
        }

        // Create new atlas if possible
        if (this.contextState.textureAtlases.length < WebGLContextManager.MAX_ATLAS_COUNT) {
            const atlas = await this.createAtlas();
            if (atlas) {
                this.contextState.textureAtlases.push(atlas);
                const region = this.findFreeRegion(atlas, width, height);
                if (region) {
                    return { atlas, region };
                }
            }
        }

        // Try to defragment and retry
        this.defragmentAtlases();
        for (const atlas of this.contextState.textureAtlases) {
            const region = this.findFreeRegion(atlas, width, height);
            if (region) {
                return { atlas, region };
            }
        }

        return null;
    }

    private findFreeRegion(atlas: TextureAtlas, width: number, height: number): TextureAtlasRegion | null {
        // Simple skyline placement algorithm
        const used = new Set<number>();
        for (const region of atlas.regions.values()) {
            for (let x = region.x; x < region.x + region.width; x += WebGLContextManager.MIN_ATLAS_REGION) {
                used.add(x);
            }
        }

        const possibleX = Array.from({ length: atlas.width / WebGLContextManager.MIN_ATLAS_REGION })
            .map((_, i) => i * WebGLContextManager.MIN_ATLAS_REGION)
            .filter(x => !used.has(x));

        for (const x of possibleX) {
            if (x + width <= atlas.width) {
                // Find maximum available height at this x position
                let maxY = 0;
                for (const region of atlas.regions.values()) {
                    if (region.x < x + width && x < region.x + region.width) {
                        maxY = Math.max(maxY, region.y + region.height);
                    }
                }

                if (maxY + height <= atlas.height) {
                    return {
                        x,
                        y: maxY,
                        width,
                        height,
                        rotated: false
                    };
                }
            }
        }

        // Try rotated placement if dimensions allow
        if (height <= atlas.width && width <= atlas.height) {
            for (const x of possibleX) {
                if (x + height <= atlas.width) {
                    let maxY = 0;
                    for (const region of atlas.regions.values()) {
                        if (region.x < x + height && x < region.x + region.width) {
                            maxY = Math.max(maxY, region.y + region.height);
                        }
                    }

                    if (maxY + width <= atlas.height) {
                        return {
                            x,
                            y: maxY,
                            width: height,
                            height: width,
                            rotated: true
                        };
                    }
                }
            }
        }

        return null;
    }

    private defragmentAtlases(): void {
        if (!this.contextState?.gl) return;

        const { textureAtlases, gl } = this.contextState;
        const now = Date.now();

        for (const atlas of textureAtlases) {
            // Remove old regions
            for (const [id, region] of atlas.regions) {
                if (now - atlas.lastAccess > 60000) { // 1 minute
                    atlas.regions.delete(id);
                    atlas.usedSpace -= region.width * region.height;
                }
            }

            // Compact remaining regions
            if (atlas.usedSpace / (atlas.width * atlas.height) < WebGLContextManager.ATLAS_CLEANUP_THRESHOLD) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = atlas.width;
                tempCanvas.height = atlas.height;
                const tempCtx = tempCanvas.getContext('2d')!;

                // Create new atlas
                const newAtlas = await this.createAtlas();
                if (!newAtlas) continue;

                // Copy regions to new atlas
                for (const [id, region] of atlas.regions) {
                    const newRegion = this.findFreeRegion(newAtlas, region.width, region.height);
                    if (newRegion) {
                        // Copy region data
                        gl.bindTexture(gl.TEXTURE_2D, atlas.texture);
                        tempCtx.drawImage(
                            this.canvas,
                            region.x, region.y, region.width, region.height,
                            0, 0, region.width, region.height
                        );

                        gl.bindTexture(gl.TEXTURE_2D, newAtlas.texture);
                        gl.texSubImage2D(
                            gl.TEXTURE_2D,
                            0,
                            newRegion.x,
                            newRegion.y,
                            newRegion.width,
                            newRegion.height,
                            gl.RGBA,
                            gl.UNSIGNED_BYTE,
                            tempCanvas
                        );

                        newAtlas.regions.set(id, newRegion);
                        newAtlas.usedSpace += newRegion.width * newRegion.height;
                    }
                }

                // Replace old atlas
                const index = textureAtlases.indexOf(atlas);
                if (index !== -1) {
                    gl.deleteTexture(atlas.texture);
                    textureAtlases[index] = newAtlas;
                }
            }
        }
    }

    private cleanupAtlases(): void {
        if (!this.contextState?.gl) return;

        const { textureAtlases, gl } = this.contextState;
        const now = Date.now();

        // Remove unused atlases
        for (let i = textureAtlases.length - 1; i >= 0; i--) {
            const atlas = textureAtlases[i];
            if (now - atlas.lastAccess > 30000 && atlas.usedSpace === 0) {
                gl.deleteTexture(atlas.texture);
                textureAtlases.splice(i, 1);
            }
        }

        // Check memory pressure
        const totalMemory = this.calculateTextureMemory();
        if (totalMemory > WebGLContextManager.STREAMING_MEMORY_LIMIT * WebGLContextManager.MEMORY_PRESSURE_THRESHOLD) {
            this.defragmentAtlases();
            this.cleanupTexturePool(true);
        }
    }
} 