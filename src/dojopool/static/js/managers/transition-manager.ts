import { BaseManager } from './base-manager';
import { type ShaderManager } from './shader-manager';
import { type WebGLContextManager } from './webgl-context-manager';

interface TransitionState {
  readonly startQuality: number;
  readonly targetQuality: number;
  readonly startTime: number;
  readonly duration: number;
  progress: number;
}

interface TransitionEvents {
  readonly progress: CustomEvent<{
    readonly progress: number;
    readonly currentQuality: number;
  }>;
  readonly complete: CustomEvent<{
    readonly quality: number;
  }>;
}

export class TransitionManager extends BaseManager<TransitionManager> {
  private static readonly TRANSITION_DURATION = 1000; // 1 second transition
  private static readonly MIN_QUALITY = 1;
  private static readonly MAX_QUALITY = 3;

  private readonly contextManager: WebGLContextManager;
  private readonly shaderManager: ShaderManager;
  private currentTransition: TransitionState | null = null;
  private transitionFrameId: number | null = null;

  constructor(
    contextManager: WebGLContextManager,
    shaderManager: ShaderManager
  ) {
    super();
    this.contextManager = contextManager;
    this.shaderManager = shaderManager;
  }

  public startTransition(targetQuality: number): void {
    // Validate target quality
    if (
      targetQuality < TransitionManager.MIN_QUALITY ||
      targetQuality > TransitionManager.MAX_QUALITY
    ) {
      throw new Error(`Invalid quality level: ${targetQuality}`);
    }

    const currentQuality = this.contextManager.getQualityLevel();

    // Don't transition if already at target quality
    if (currentQuality === targetQuality) return;

    this.cancelCurrentTransition();

    this.currentTransition = {
      startQuality: currentQuality,
      targetQuality,
      progress: 0,
      startTime: performance.now(),
      duration: TransitionManager.TRANSITION_DURATION,
    };

    this.updateTransition();
  }

  private readonly updateTransition = (): void => {
    if (!this.currentTransition) return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.currentTransition.startTime;
    this.currentTransition.progress = Math.min(
      elapsed / this.currentTransition.duration,
      1
    );

    const easedProgress = this.calculateEasedProgress(
      this.currentTransition.progress
    );
    const interpolatedQuality = this.interpolateQuality(
      this.currentTransition.startQuality,
      this.currentTransition.targetQuality,
      easedProgress
    );

    // Update quality level
    this.contextManager.setQualityLevel(interpolatedQuality);

    // Dispatch progress event
    this.dispatchTransitionEvent('progress', {
      progress: easedProgress,
      currentQuality: interpolatedQuality,
    });

    if (this.currentTransition.progress < 1) {
      // Continue transition
      this.transitionFrameId = requestAnimationFrame(this.updateTransition);
    } else {
      // Transition complete
      this.dispatchTransitionEvent('complete', {
        quality: this.currentTransition.targetQuality,
      });
      this.cleanupTransition();
    }
  };

  private calculateEasedProgress(progress: number): number {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  private interpolateQuality(
    start: number,
    end: number,
    progress: number
  ): number {
    return start + (end - start) * progress;
  }

  private dispatchTransitionEvent<K extends keyof TransitionEvents>(
    type: K,
    detail: TransitionEvents[K]['detail']
  ): void {
    const event = new CustomEvent(`qualitytransition${type}`, {
      detail,
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
  }

  private cancelCurrentTransition(): void {
    if (this.transitionFrameId !== null) {
      cancelAnimationFrame(this.transitionFrameId);
      this.transitionFrameId = null;
    }
  }

  private cleanupTransition(): void {
    this.currentTransition = null;
    this.transitionFrameId = null;
  }

  public override cleanup(): void {
    this.cancelCurrentTransition();
    this.cleanupTransition();
    this.onCleanup();
  }
}
