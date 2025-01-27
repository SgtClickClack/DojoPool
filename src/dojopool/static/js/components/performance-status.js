import { initializePerformanceMonitoring } from '../performance-init.js';

export class PerformanceStatus extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.initializeMonitoring();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --status-bg: rgba(255, 255, 255, 0.9);
                    --status-border: #2196F3;
                    --status-text: #333;
                    --status-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .status-widget {
                    background: var(--status-bg);
                    border: 2px solid var(--status-border);
                    border-radius: 8px;
                    padding: 10px;
                    margin: 10px;
                    box-shadow: var(--status-shadow);
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    backdrop-filter: blur(5px);
                    transition: all 0.3s ease;
                    max-width: 300px;
                    color: var(--status-text);
                }

                .status-widget.minimized {
                    width: auto;
                    padding: 5px 10px;
                }

                .status-header {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }

                .status-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 8px;
                }

                .status-good { background: #4caf50; }
                .status-warning { background: #ff9800; }
                .status-error { background: #f44336; }

                .metrics {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                    font-size: 0.9em;
                }

                .metric {
                    text-align: center;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }

                .metric-value {
                    font-weight: bold;
                    font-family: 'Orbitron', sans-serif;
                    color: var(--status-border);
                }

                .metric-label {
                    opacity: 0.8;
                    font-size: 0.8em;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .optimization-tip {
                    margin-top: 10px;
                    padding: 8px;
                    background: rgba(255, 152, 0, 0.1);
                    border-left: 3px solid #ff9800;
                    border-radius: 0 4px 4px 0;
                    font-size: 0.8em;
                    display: none;
                }

                .toggle-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    margin-left: auto;
                    color: inherit;
                    font-size: 1.2em;
                    opacity: 0.7;
                    transition: opacity 0.3s ease;
                }

                .toggle-btn:hover {
                    opacity: 1;
                }
            </style>
            <div class="status-widget">
                <div class="status-header">
                    <div class="status-indicator status-good" id="status"></div>
                    <span>Performance</span>
                    <button class="toggle-btn" id="toggle">−</button>
                </div>
                <div class="metrics" id="metrics">
                    <div class="metric">
                        <div class="metric-value" id="fps">60</div>
                        <div class="metric-label">FPS</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" id="connection">Good</div>
                        <div class="metric-label">Connection</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" id="quality">High</div>
                        <div class="metric-label">Quality</div>
                    </div>
                </div>
                <div class="optimization-tip" id="tip"></div>
            </div>
        `;

        // Add toggle functionality
        const widget = this.shadowRoot.querySelector('.status-widget');
        const metrics = this.shadowRoot.getElementById('metrics');
        const toggleBtn = this.shadowRoot.getElementById('toggle');
        const tip = this.shadowRoot.getElementById('tip');

        toggleBtn.addEventListener('click', () => {
            const isMinimized = widget.classList.toggle('minimized');
            toggleBtn.textContent = isMinimized ? '+' : '−';
            metrics.style.display = isMinimized ? 'none' : 'grid';
            tip.style.display = 'none';
        });
    }

    initializeMonitoring() {
        const performanceSystem = initializePerformanceMonitoring({
            containers: {},
            monitor: {
                sampleInterval: 1000
            },
            network: {
                enabled: true
            }
        });

        performanceSystem.start();

        setInterval(() => {
            const metrics = performanceSystem.monitor.getMetrics();
            const networkMetrics = performanceSystem.networkProfiler?.getMetrics();

            if (metrics) {
                // Update FPS
                const fps = Math.round(metrics.fps);
                this.shadowRoot.getElementById('fps').textContent = fps;

                // Update connection status
                let connectionStatus = 'Good';
                if (networkMetrics) {
                    const latency = networkMetrics.stats.averageLatency;
                    if (latency > 200) {
                        connectionStatus = 'Poor';
                    } else if (latency > 100) {
                        connectionStatus = 'Fair';
                    }
                }
                this.shadowRoot.getElementById('connection').textContent = connectionStatus;

                // Update quality level
                let quality = 'High';
                if (fps < 30) {
                    quality = 'Low';
                } else if (fps < 45) {
                    quality = 'Medium';
                }
                this.shadowRoot.getElementById('quality').textContent = quality;

                // Update status and tips
                const statusIndicator = this.shadowRoot.getElementById('status');
                const tip = this.shadowRoot.getElementById('tip');

                if (fps < 30 || (networkMetrics && networkMetrics.stats.averageLatency > 200)) {
                    statusIndicator.className = 'status-indicator status-error';
                    tip.textContent = fps < 30 ?
                        'Tip: Try lowering the quality settings for better performance' :
                        'Tip: Check your internet connection';
                    tip.style.display = 'block';
                } else if (fps < 45 || (networkMetrics && networkMetrics.stats.averageLatency > 100)) {
                    statusIndicator.className = 'status-indicator status-warning';
                    tip.style.display = 'none';
                } else {
                    statusIndicator.className = 'status-indicator status-good';
                    tip.style.display = 'none';
                }
            }
        }, 1000);

        // Cleanup on disconnect
        this.addEventListener('disconnectedCallback', () => {
            performanceSystem.cleanup();
        });
    }
}

// Register the custom element
customElements.define('performance-status', PerformanceStatus); 