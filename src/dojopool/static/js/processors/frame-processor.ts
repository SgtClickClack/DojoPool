import { ShaderManager } from '../managers/shader-manager';
import { TransitionManager } from '../managers/transition-manager';
import { WebGLContextManager } from '../managers/webgl-context-manager';
import { shotDetectionShaders } from '../shaders/shot-detection';

interface WebGLResources {
    readonly frameBuffers: WebGLFramebuffer[];
    readonly textures: WebGLTexture[];
}

interface ProcessingError extends Error {
    readonly type: 'WEBGL' | 'BUFFER' | 'SHADER';
    readonly recoverable: boolean;
}

export class FrameProcessor {
    private static readonly TEXTURE_COUNT = 2;
    private static readonly DEFAULT_CANVAS_SIZE = {
        width: 640,
        height: 480
    } as const;

    private readonly canvas: HTMLCanvasElement;
    private readonly contextManager: WebGLContextManager;
    private readonly shaderManager: ShaderManager;
    private readonly transitionManager: TransitionManager;
    private readonly gl: WebGLRenderingContext;
    private readonly resources: WebGLResources;

    private currentTextureIndex = 0;
    private isInitialized = false;

    constructor() {
        this.canvas = this.createCanvas();
        this.contextManager = WebGLContextManager.getInstance();
        this.gl = this.initializeWebGLContext();
        this.shaderManager = new ShaderManager(this.contextManager);
        this.transitionManager = new TransitionManager(this.contextManager, this.shaderManager);
        this.resources = this.initializeResources();

        this.setupEventListeners();
        this.initializeShaders();
    }

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = FrameProcessor.DEFAULT_CANVAS_SIZE.width;
        canvas.height = FrameProcessor.DEFAULT_CANVAS_SIZE.height;
        return canvas;
    }

    private initializeWebGLContext(): WebGLRenderingContext {
        const gl = this.contextManager.getContext();
        if (!gl) {
            throw this.createError('WEBGL', 'Failed to get WebGL context', false);
        }
        return gl;
    }

    private initializeResources(): WebGLResources {
        const frameBuffers: WebGLFramebuffer[] = [];
        const textures: WebGLTexture[] = [];

        for (let i = 0; i < FrameProcessor.TEXTURE_COUNT; i++) {
            const { frameBuffer, texture } = this.createBufferPair();
            frameBuffers.push(frameBuffer);
            textures.push(texture);
        }

        return { frameBuffers, textures };
    }

    private createBufferPair(): { frameBuffer: WebGLFramebuffer; texture: WebGLTexture } {
        const frameBuffer = this.gl.createFramebuffer();
        const texture = this.gl.createTexture();

        if (!frameBuffer || !texture) {
            throw this.createError('BUFFER', 'Failed to create frame buffer or texture', true);
        }

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        this.configureTexture();

        return { frameBuffer, texture };
    }

    private configureTexture(): void {
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    }

    private setupEventListeners(): void {
        this.contextManager.addContextListener(this.handleContextEvent);
        window.addEventListener('qualitychange', this.handleQualityChange);
    }

    private initializeShaders(): void {
        try {
            this.shaderManager.registerShader('shotDetection', shotDetectionShaders);
            this.isInitialized = true;
        } catch (error) {
            throw this.createError('SHADER', 'Failed to initialize shaders', true);
        }
    }

    private readonly handleContextEvent = (event: WebGLContextEvent): void => {
        if (event.type === 'webglcontextrestored') {
            this.reinitialize();
        }
    };

    private readonly handleQualityChange = (event: CustomEvent): void => {
        const { level } = event.detail;
        this.transitionManager.startTransition(level);
    };

    private reinitialize(): void {
        this.resources.frameBuffers.forEach(buffer => {
            if (buffer) this.gl.deleteFramebuffer(buffer);
        });
        this.resources.textures.forEach(texture => {
            if (texture) this.gl.deleteTexture(texture);
        });

        const newResources = this.initializeResources();
        Object.assign(this.resources, newResources);
        this.initializeShaders();
    }

    private createError(type: ProcessingError['type'], message: string, recoverable: boolean): ProcessingError {
        const error = new Error(message) as ProcessingError;
        error.type = type;
        error.recoverable = recoverable;
        return error;
    }

    public cleanup(): void {
        // Clean up WebGL resources
        this.resources.frameBuffers.forEach(buffer => {
            if (buffer) this.gl.deleteFramebuffer(buffer);
        });
        this.resources.textures.forEach(texture => {
            if (texture) this.gl.deleteTexture(texture);
        });

        // Clean up managers
        this.shaderManager.cleanup();
        this.transitionManager.cleanup();

        // Remove event listeners
        this.contextManager.removeContextListener(this.handleContextEvent);
        window.removeEventListener('qualitychange', this.handleQualityChange);

        this.isInitialized = false;
    }

    public processFrame(videoElement: HTMLVideoElement): ImageData | null {
        if (!videoElement.videoWidth || !videoElement.videoHeight) {
            return null;
        }

        // Resize canvas if needed
        if (this.canvas.width !== videoElement.videoWidth ||
            this.canvas.height !== videoElement.videoHeight) {
            this.canvas.width = videoElement.videoWidth;
            this.canvas.height = videoElement.videoHeight;

            // Resize textures
            this.resources.textures.forEach(texture => {
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.texImage2D(
                    this.gl.TEXTURE_2D,
                    0,
                    this.gl.RGBA,
                    this.canvas.width,
                    this.canvas.height,
                    0,
                    this.gl.RGBA,
                    this.gl.UNSIGNED_BYTE,
                    null
                );
            });
        }

        // Update current texture with video frame
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.resources.textures[this.currentTextureIndex]);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            videoElement
        );

        // Use shot detection shader
        const shader = this.shaderManager.useShader('shotDetection');
        if (!shader) {
            return null;
        }

        // Bind frame buffer for rendering
        const nextIndex = (this.currentTextureIndex + 1) % 2;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.resources.frameBuffers[nextIndex]);

        // Set viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Set uniforms
        const uniforms = this.shaderManager.getUniforms('shotDetection');
        if (uniforms) {
            this.gl.uniform1i(uniforms.get('uCurrentFrame')!, this.currentTextureIndex);
            this.gl.uniform1i(uniforms.get('uPreviousFrame')!, nextIndex);
        }

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        // Read pixels
        const pixels = new Uint8Array(this.canvas.width * this.canvas.height * 4);
        this.gl.readPixels(
            0, 0,
            this.canvas.width, this.canvas.height,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            pixels
        );

        // Swap indices
        this.currentTextureIndex = nextIndex;

        return new ImageData(
            new Uint8ClampedArray(pixels),
            this.canvas.width,
            this.canvas.height
        );
    }
} 