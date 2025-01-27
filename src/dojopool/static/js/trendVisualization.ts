// Type definitions
import { Chart, ChartConfiguration } from 'chart.js';

interface TrendAnalysis {
    direction: string;
    anomaly: boolean;
}

interface TrendUpdate {
    metric: string;
    analysis: TrendAnalysis;
}

interface ChartDataset {
    label: string;
    data: number[];
    borderColor: string;
    tension: number;
    fill: boolean;
}

interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

export class TrendVisualization {
    private selectedRange: string;
    private container: HTMLElement | null;
    private charts: Map<string, Chart>;
    private isOffline: boolean;
    private updateQueue: TrendUpdate[];
    private debounceTimeout: NodeJS.Timeout | null;
    private metrics: string[];

    constructor() {
        // Register the line chart type
        Chart.defaults.global.defaultFontFamily = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        Chart.defaults.global.defaultFontSize = 12;

        this.selectedRange = '24h';
        this.container = null;
        this.charts = new Map();
        this.isOffline = false;
        this.updateQueue = [];
        this.debounceTimeout = null;
        this.metrics = ['loadTime', 'bandwidth', 'memory'];

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._initialize());
        } else {
            this._initialize();
        }

        // Listen for trend updates
        window.addEventListener('trendUpdate', ((event: CustomEvent<TrendUpdate>) => {
            const { metric, analysis } = event.detail;
            if (this.isOffline) {
                this.updateQueue.push({ metric, analysis });
            } else {
                this.updateMetricDisplay(metric, analysis);
            }
        }) as EventListener);
    }

    private _initialize(): void {
        this.container = document.querySelector('.trend-visualization');
        if (!this.container) {
            console.warn('Trend visualization container not found');
            return;
        }

        // Clear any existing content
        this.container.innerHTML = '';

        this.createVisualization();
        this.initNetworkHandling();

        // Add time range selector
        const timeRangeSelect = document.createElement('select');
        timeRangeSelect.className = 'time-range-select';
        ['15m', '1h', '24h', '7d'].forEach(range => {
            const option = document.createElement('option');
            option.value = range;
            option.textContent = range;
            if (range === this.selectedRange) {
                option.selected = true;
            }
            timeRangeSelect.appendChild(option);
        });

        this.container.insertBefore(timeRangeSelect, this.container.firstChild);

        timeRangeSelect.addEventListener('change', (event: Event) => {
            const target = event.target as HTMLSelectElement;
            this.selectedRange = target.value;
            this.updateAllCharts();
        });
    }

    private createVisualization(): void {
        this.metrics.forEach(metric => {
            const section = document.createElement('div');
            section.className = 'trend-section';
            section.setAttribute('data-metric', metric);

            const header = document.createElement('div');
            header.className = 'trend-section-header';
            header.textContent = metric.charAt(0).toUpperCase() + metric.slice(1);

            const directionSpan = document.createElement('span');
            directionSpan.className = 'trend-direction';

            const canvas = document.createElement('canvas');
            canvas.id = `${metric}-trend-chart`;

            section.appendChild(header);
            section.appendChild(directionSpan);
            section.appendChild(canvas);

            this.container?.appendChild(section);
            this.initChart(metric, canvas);
        });
    }

    private updateMetricDisplay(metric: string, analysis: TrendAnalysis): void {
        if (!this.container) return;

        const section = this.container.querySelector(`[data-metric="${metric}"]`);
        if (!section) return;

        const directionSpan = section.querySelector('.trend-direction');
        if (!directionSpan) return;

        if (!analysis) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Invalid metric data received';
            section.appendChild(errorMessage);
            return;
        }

        directionSpan.textContent = analysis.direction || 'stable';
        directionSpan.className = `trend-direction ${analysis.direction || 'stable'}`;

        if (analysis.anomaly) {
            section.classList.add('anomaly');
        } else {
            section.classList.remove('anomaly');
        }
    }

    private initNetworkHandling(): void {
        window.addEventListener('online', () => {
            if (!this.container) return;
            this.isOffline = false;
            this.container.classList.remove('offline');
            this.processUpdateQueue();
        });

        window.addEventListener('offline', () => {
            if (!this.container) return;
            this.isOffline = true;
            this.container.classList.add('offline');
        });
    }

    private processUpdateQueue(): void {
        while (this.updateQueue.length > 0) {
            const update = this.updateQueue.shift();
            if (update) {
                this.updateMetricDisplay(update.metric, update.analysis);
            }
        }
    }

    private updateAllCharts(): void {
        console.log(`Updating all charts with range: ${this.selectedRange}`);
        // Implementation would fetch and update chart data based on selected range
    }

    private initChart(metric: string, canvas: HTMLCanvasElement): void {
        try {
            const config: ChartConfiguration = {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Current',
                            data: [],
                            borderColor: '#4CAF50',
                            tension: 0.4,
                            fill: false,
                            pointRadius: 2,
                            borderWidth: 2
                        },
                        {
                            label: 'Baseline',
                            data: [],
                            borderColor: '#2196F3',
                            tension: 0.4,
                            fill: false,
                            pointRadius: 2,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        xAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: 'Time'
                            }
                        }],
                        yAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: metric
                            }
                        }]
                    },
                    animation: {
                        duration: 750,
                        easing: 'easeInOutQuart'
                    },
                    tooltips: {
                        mode: 'index',
                        intersect: false
                    },
                    hover: {
                        mode: 'nearest',
                        intersect: true
                    }
                }
            };

            const chart = new Chart(canvas.getContext('2d')!, config);
            this.charts.set(metric, chart);
        } catch (error) {
            if (error instanceof Error) {
                console.warn(`Failed to initialize chart for ${metric}: ${error.message}`);
            }
        }
    }
}

// Export singleton instance
export const trendVisualization = new TrendVisualization(); 