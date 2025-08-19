import { BaseManager } from './base-manager';

export interface WebGLTimingInfo {
  gpuTime: number;
  drawCalls: number;
  triangleCount: number;
  contextLost: boolean;
}

export interface WebGLResourceStats {
  textures: number;
  buffers: number;
  shaders: number;
  programs: number;
}

export class WebGLProfiler extends BaseManager<WebGLProfiler> {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private ext: EXT_disjoint_timer_query | null = null;
  private activeQuery: WebGLQuery | null = null;
  private lastGPUTime: number = 0;
  private drawCallCount: number = 0;
  private triangleCount: number = 0;
  private resourceStats: WebGLResourceStats = {
    textures: 0,
    buffers: 0,
    shaders: 0,
    programs: 0,
  };

  protected constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    super();
    this.gl = gl;
    this.initializeExtensions();
  }

  public static override getInstance(
    gl: WebGLRenderingContext | WebGL2RenderingContext
  ): WebGLProfiler {
    return BaseManager.getInstance.call(WebGLProfiler) || new WebGLProfiler(gl);
  }

  private initializeExtensions(): void {
    // Try WebGL 2 timer query first
    if (this.gl instanceof WebGL2RenderingContext) {
      this.ext = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
    }
    // Fall back to WebGL 1 timer query
    if (!this.ext) {
      this.ext = this.gl.getExtension('EXT_disjoint_timer_query');
    }
  }

  public startFrame(): void {
    if (!this.ext) return;

    // Check if previous query is available
    if (this.activeQuery) {
      const available = this.gl.getQueryParameter(
        this.activeQuery,
        this.gl.QUERY_RESULT_AVAILABLE
      );
      if (available) {
        this.lastGPUTime =
          this.gl.getQueryParameter(this.activeQuery, this.gl.QUERY_RESULT) /
          1000000; // Convert to ms
        this.gl.deleteQuery(this.activeQuery);
        this.activeQuery = null;
      }
    }

    // Start new query
    if (!this.activeQuery) {
      this.activeQuery = this.gl.createQuery()!;
      this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, this.activeQuery);
    }

    // Reset frame counters
    this.drawCallCount = 0;
    this.triangleCount = 0;
  }

  public endFrame(): WebGLTimingInfo {
    if (this.ext && this.activeQuery) {
      this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    }

    return {
      gpuTime: this.lastGPUTime,
      drawCalls: this.drawCallCount,
      triangleCount: this.triangleCount,
      contextLost: this.gl.isContextLost(),
    };
  }

  public trackDrawCall(primitiveCount: number, mode: number): void {
    this.drawCallCount++;

    // Calculate triangle count based on primitive type
    switch (mode) {
      case this.gl.TRIANGLES:
        this.triangleCount += primitiveCount / 3;
        break;
      case this.gl.TRIANGLE_STRIP:
      case this.gl.TRIANGLE_FAN:
        this.triangleCount += primitiveCount - 2;
        break;
    }
  }

  public trackResourceCreation(
    type: 'texture' | 'buffer' | 'shader' | 'program'
  ): void {
    this.resourceStats[`${type}s` as keyof WebGLResourceStats]++;
  }

  public trackResourceDeletion(
    type: 'texture' | 'buffer' | 'shader' | 'program'
  ): void {
    this.resourceStats[`${type}s` as keyof WebGLResourceStats]--;
  }

  public getResourceStats(): WebGLResourceStats {
    return { ...this.resourceStats };
  }

  public override cleanup(): void {
    if (this.activeQuery) {
      this.gl.deleteQuery(this.activeQuery);
      this.activeQuery = null;
    }
    this.lastGPUTime = 0;
    this.drawCallCount = 0;
    this.triangleCount = 0;
    this.resourceStats = {
      textures: 0,
      buffers: 0,
      shaders: 0,
      programs: 0,
    };
    this.onCleanup();
  }
}
