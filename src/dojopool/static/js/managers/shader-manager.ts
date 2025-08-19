import { BaseManager } from './base-manager';
import { type WebGLContextManager } from './webgl-context-manager';

interface ShaderDefinition {
  vertex: string;
  fragment: string;
  complexity: number;
}

interface ShaderProgram {
  program: WebGLProgram;
  attributes: Map<string, number>;
  uniforms: Map<string, WebGLUniformLocation>;
}

interface ShaderVariant {
  quality: number;
  programs: Map<string, ShaderProgram>;
}

export class ShaderManager extends BaseManager<ShaderManager> {
  private readonly context: WebGLRenderingContext;
  private readonly contextManager: WebGLContextManager;
  private shaderVariants: Map<string, ShaderVariant[]> = new Map();
  private activeVariants: Map<string, ShaderProgram> = new Map();
  private currentQuality: number;

  constructor(contextManager: WebGLContextManager) {
    super();
    this.contextManager = contextManager;
    this.context = contextManager.getContext()!;
    this.currentQuality = contextManager.getQualityLevel();

    // Listen for quality changes
    this.contextManager.addContextListener(this.handleContextEvent.bind(this));
  }

  public registerShader(name: string, definitions: ShaderDefinition[]): void {
    // Sort definitions by complexity
    const sortedDefs = [...definitions].sort(
      (a, b) => a.complexity - b.complexity
    );
    const variants: ShaderVariant[] = [];

    // Create variants for different quality levels
    for (
      let quality = 1;
      quality <= this.contextManager.getQualityLevel();
      quality++
    ) {
      const def = this.selectDefinitionForQuality(sortedDefs, quality);
      const programs = new Map<string, ShaderProgram>();

      try {
        const program = this.createProgram(def.vertex, def.fragment);
        if (program) {
          programs.set(name, program);
          variants.push({ quality, programs });
        }
      } catch (error) {
        console.error(
          `Failed to compile shader ${name} for quality ${quality}:`,
          error
        );
      }
    }

    this.shaderVariants.set(name, variants);
    this.updateActiveVariant(name);
  }

  private selectDefinitionForQuality(
    definitions: ShaderDefinition[],
    quality: number
  ): ShaderDefinition {
    // Map quality level to complexity threshold
    const maxComplexity = quality / this.contextManager.getQualityLevel();

    // Find the most complex shader that fits within the quality threshold
    for (let i = definitions.length - 1; i >= 0; i--) {
      if (definitions[i].complexity <= maxComplexity) {
        return definitions[i];
      }
    }

    return definitions[0]; // Fallback to simplest version
  }

  private createProgram(
    vertexSource: string,
    fragmentSource: string
  ): ShaderProgram | null {
    const vertexShader = this.compileShader(
      vertexSource,
      this.context.VERTEX_SHADER
    );
    const fragmentShader = this.compileShader(
      fragmentSource,
      this.context.FRAGMENT_SHADER
    );

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = this.context.createProgram();
    if (!program) {
      return null;
    }

    this.context.attachShader(program, vertexShader);
    this.context.attachShader(program, fragmentShader);
    this.context.linkProgram(program);

    if (!this.context.getProgramParameter(program, this.context.LINK_STATUS)) {
      console.error(
        'Failed to link program:',
        this.context.getProgramInfoLog(program)
      );
      this.context.deleteProgram(program);
      return null;
    }

    // Clean up shaders
    this.context.deleteShader(vertexShader);
    this.context.deleteShader(fragmentShader);

    return {
      program,
      attributes: this.getAttributes(program),
      uniforms: this.getUniforms(program),
    };
  }

  private compileShader(source: string, type: number): WebGLShader | null {
    const shader = this.context.createShader(type);
    if (!shader) {
      return null;
    }

    this.context.shaderSource(shader, source);
    this.context.compileShader(shader);

    if (!this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)) {
      console.error(
        'Failed to compile shader:',
        this.context.getShaderInfoLog(shader)
      );
      this.context.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private getAttributes(program: WebGLProgram): Map<string, number> {
    const attributes = new Map<string, number>();
    const numAttributes = this.context.getProgramParameter(
      program,
      this.context.ACTIVE_ATTRIBUTES
    );

    for (let i = 0; i < numAttributes; i++) {
      const info = this.context.getActiveAttrib(program, i);
      if (info) {
        attributes.set(
          info.name,
          this.context.getAttribLocation(program, info.name)
        );
      }
    }

    return attributes;
  }

  private getUniforms(
    program: WebGLProgram
  ): Map<string, WebGLUniformLocation> {
    const uniforms = new Map<string, WebGLUniformLocation>();
    const numUniforms = this.context.getProgramParameter(
      program,
      this.context.ACTIVE_UNIFORMS
    );

    for (let i = 0; i < numUniforms; i++) {
      const info = this.context.getActiveUniform(program, i);
      if (info) {
        const location = this.context.getUniformLocation(program, info.name);
        if (location) {
          uniforms.set(info.name, location);
        }
      }
    }

    return uniforms;
  }

  private updateActiveVariant(shaderName: string): void {
    const variants = this.shaderVariants.get(shaderName);
    if (!variants) return;

    // Find the best variant for current quality level
    const bestVariant = variants
      .filter((v) => v.quality <= this.currentQuality)
      .sort((a, b) => b.quality - a.quality)[0];

    if (bestVariant) {
      const program = bestVariant.programs.get(shaderName);
      if (program) {
        this.activeVariants.set(shaderName, program);
      }
    }
  }

  private handleContextEvent(event: WebGLContextEvent): void {
    if (event.type === 'webglcontextrestored') {
      this.currentQuality = this.contextManager.getQualityLevel();
      // Recompile all shaders for new quality level
      this.shaderVariants.forEach((_, name) => {
        this.updateActiveVariant(name);
      });
    }
  }

  public useShader(name: string): ShaderProgram | null {
    const program = this.activeVariants.get(name);
    if (program) {
      this.context.useProgram(program.program);
      return program;
    }
    return null;
  }

  public getAttributes(name: string): Map<string, number> | null {
    return this.activeVariants.get(name)?.attributes || null;
  }

  public getUniforms(name: string): Map<string, WebGLUniformLocation> | null {
    return this.activeVariants.get(name)?.uniforms || null;
  }

  public override cleanup(): void {
    // Clean up all shader programs
    this.activeVariants.forEach((program) => {
      this.context.deleteProgram(program.program);
    });
    this.activeVariants.clear();
    this.shaderVariants.clear();

    // Remove context listener
    this.contextManager.removeContextListener(
      this.handleContextEvent.bind(this)
    );
    this.onCleanup();
  }
}
