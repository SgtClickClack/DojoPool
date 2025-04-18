// Add interfaces and types
interface QualityMetrics {
  readonly frameRate: number;
  readonly gpuTime: number;
}

interface QualityChangeEvent extends CustomEvent {
  readonly detail: {
    readonly level: number;
  };
}

interface QualityTransitionEvent extends CustomEvent {
  readonly detail: {
    readonly progress: number;
    readonly currentQuality: number;
  };
}

interface QualityTransitionCompleteEvent extends CustomEvent {
  readonly detail: {
    readonly quality: number;
  };
}

class QualityIndicator extends HTMLElement {
  private static readonly AUTO_QUALITY_THRESHOLDS = {
    LOW_FPS: 30,
    HIGH_FPS: 55,
    HIGH_GPU_TIME: 16,
    LOW_GPU_TIME: 8,
  } as const;

  private readonly elements: {
    container: HTMLDivElement;
    statusIcon: HTMLDivElement;
    qualityText: HTMLDivElement;
    controlsContainer: HTMLDivElement;
    transitionOverlay: HTMLDivElement;
    autoButton: HTMLButtonElement;
    qualitySlider: HTMLInputElement;
  };

  private qualityLevel: number = 3;
  private autoMode: boolean = true;
  private isTransitioning: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.elements = this.createElements();
    this.setupStyles();
    this.setupEventListeners();
    this.updateDisplay();
  }

  private createElements() {
    const container = document.createElement("div");
    container.className = "quality-indicator";

    const statusIcon = document.createElement("div");
    statusIcon.className = "status-icon";

    const qualityText = document.createElement("div");
    qualityText.className = "quality-text";

    const controlsContainer = document.createElement("div");
    controlsContainer.className = "controls-container";

    const autoButton = document.createElement("button");
    autoButton.textContent = "Auto";
    autoButton.className = "control-button auto-button";

    const qualitySlider = document.createElement("input");
    qualitySlider.type = "range";
    qualitySlider.min = "1";
    qualitySlider.max = "3";
    qualitySlider.value = "3";
    qualitySlider.className = "quality-slider";

    const transitionOverlay = document.createElement("div");
    transitionOverlay.className = "transition-overlay";

    controlsContainer.append(autoButton, qualitySlider);
    container.append(
      statusIcon,
      qualityText,
      controlsContainer,
      transitionOverlay,
    );
    this.shadowRoot?.appendChild(container);

    return {
      container,
      statusIcon,
      qualityText,
      controlsContainer,
      transitionOverlay,
      autoButton,
      qualitySlider,
    };
  }

  private setupStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
            .quality-indicator {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--bg-color, rgba(0, 0, 0, 0.8));
                color: var(--text-color, white);
                padding: 10px;
                border-radius: 8px;
                font-family: system-ui, -apple-system, sans-serif;
                z-index: 1000;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }

            .status-icon {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 8px;
                display: inline-block;
                vertical-align: middle;
            }

            .status-icon.high {
                background: #4CAF50;
                box-shadow: 0 0 8px #4CAF50;
            }

            .status-icon.medium {
                background: #FFC107;
                box-shadow: 0 0 8px #FFC107;
            }

            .status-icon.low {
                background: #F44336;
                box-shadow: 0 0 8px #F44336;
            }

            .quality-text {
                display: inline-block;
                vertical-align: middle;
                margin-right: 15px;
                font-size: 14px;
            }

            .controls-container {
                display: inline-block;
                vertical-align: middle;
            }

            .control-button {
                background: var(--button-bg, #2196F3);
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 8px;
                font-size: 12px;
                transition: background 0.2s ease;
            }

            .control-button:hover {
                background: var(--button-hover-bg, #1976D2);
            }

            .control-button.active {
                background: var(--button-active-bg, #1565C0);
            }

            .quality-slider {
                width: 100px;
                vertical-align: middle;
            }

            @media (max-width: 768px) {
                .quality-indicator {
                    bottom: 10px;
                    right: 10px;
                    padding: 8px;
                }

                .controls-container {
                    display: none;
                }

                .quality-indicator:hover .controls-container {
                    display: block;
                    position: absolute;
                    bottom: 100%;
                    right: 0;
                    background: var(--bg-color, rgba(0, 0, 0, 0.8));
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 5px;
                }
            }

            .transition-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }

            .transition-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }

            .transition-overlay::after {
                content: '';
                width: 20px;
                height: 20px;
                border: 2px solid var(--button-bg);
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .quality-indicator {
                position: relative;
                overflow: hidden;
            }

            .status-icon {
                transition: background-color 0.3s ease, box-shadow 0.3s ease;
            }

            .quality-text {
                transition: color 0.3s ease;
            }
        `;
    this.shadowRoot?.appendChild(style);
  }

  private setupEventListeners(): void {
    // DOM Events
    this.elements.autoButton.addEventListener(
      "click",
      this.handleAutoButtonClick,
    );
    this.elements.qualitySlider.addEventListener(
      "input",
      this.handleQualitySliderInput,
    );

    // Window Events
    window.addEventListener("webglcontextlost", this.handleContextLost);
    window.addEventListener("webglcontextrestored", this.handleContextRestored);
    window.addEventListener(
      "performanceupdate",
      this.handlePerformanceUpdate as EventListener,
    );
    window.addEventListener(
      "qualitytransition",
      this.handleTransitionProgress as EventListener,
    );
    window.addEventListener(
      "qualitytransitioncomplete",
      this.handleTransitionComplete as EventListener,
    );
  }

  private readonly handleAutoButtonClick = (): void => {
    this.autoMode = !this.autoMode;
    this.elements.autoButton.classList.toggle("active", this.autoMode);
  };

  private readonly handleQualitySliderInput = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    this.setQualityLevel(parseInt(target.value, 10));
  };

  private readonly handleContextLost = (): void => {
    this.setQualityLevel(1);
    this.updateDisplay();
  };

  private readonly handleContextRestored = (): void => {
    if (this.autoMode) {
      this.setQualityLevel(2);
    }
    this.updateDisplay();
  };

  private readonly handlePerformanceUpdate = (
    e: CustomEvent<QualityMetrics>,
  ): void => {
    if (!this.autoMode) return;

    const { frameRate, gpuTime } = e.detail;
    const { LOW_FPS, HIGH_FPS, HIGH_GPU_TIME, LOW_GPU_TIME } =
      QualityIndicator.AUTO_QUALITY_THRESHOLDS;

    if (frameRate < LOW_FPS || gpuTime > HIGH_GPU_TIME) {
      if (this.qualityLevel > 1) {
        this.setQualityLevel(this.qualityLevel - 1);
      }
    } else if (frameRate > HIGH_FPS && gpuTime < LOW_GPU_TIME) {
      if (this.qualityLevel < 3) {
        this.setQualityLevel(this.qualityLevel + 1);
      }
    }
  };

  private readonly handleTransitionProgress = (
    e: QualityTransitionEvent,
  ): void => {
    this.isTransitioning = true;
    this.elements.transitionOverlay.classList.add("active");
    this.updateQualityDisplay(e.detail.currentQuality);
  };

  private readonly handleTransitionComplete = (
    e: QualityTransitionCompleteEvent,
  ): void => {
    this.isTransitioning = false;
    this.elements.transitionOverlay.classList.remove("active");
    this.qualityLevel = e.detail.quality;
    this.updateDisplay();
  };

  private setQualityLevel(level: number): void {
    if (this.isTransitioning) return;

    const event = new CustomEvent<{ level: number }>("qualitychange", {
      detail: { level },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  private updateDisplay(): void {
    const qualityClass = this.getQualityClass(this.qualityLevel);
    const qualityText = this.getQualityText(this.qualityLevel);

    this.elements.statusIcon.className = `status-icon ${qualityClass}`;
    this.elements.qualityText.textContent = `Quality: ${qualityText}`;
    this.elements.qualitySlider.value = this.qualityLevel.toString();
    this.setAttribute("data-quality-level", this.qualityLevel.toString());
  }

  private updateQualityDisplay(quality: number): void {
    const qualityClass = this.getQualityClass(quality);
    const qualityText = this.getQualityText(quality);

    this.elements.statusIcon.className = `status-icon ${qualityClass}`;
    this.elements.qualityText.textContent = `Quality: ${qualityText}`;
  }

  private getQualityClass(quality: number): string {
    if (quality >= 2.7) return "high";
    if (quality >= 1.7) return "medium";
    return "low";
  }

  private getQualityText(quality: number): string {
    if (quality >= 2.7) return "High";
    if (quality >= 1.7) return "Medium";
    return "Low";
  }

  disconnectedCallback(): void {
    // Clean up event listeners
    window.removeEventListener("webglcontextlost", this.handleContextLost);
    window.removeEventListener(
      "webglcontextrestored",
      this.handleContextRestored,
    );
    window.removeEventListener(
      "performanceupdate",
      this.handlePerformanceUpdate as EventListener,
    );
    window.removeEventListener(
      "qualitytransition",
      this.handleTransitionProgress as EventListener,
    );
    window.removeEventListener(
      "qualitytransitioncomplete",
      this.handleTransitionComplete as EventListener,
    );
  }
}

customElements.define("quality-indicator", QualityIndicator);
