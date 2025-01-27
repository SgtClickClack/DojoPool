export class TrendVisualization {
    constructor() {
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
        window.addEventListener('trendUpdate', (event) => {
            const { metric, analysis } = event.detail;
            if (this.isOffline) {
                this.updateQueue.push({ metric, analysis });
            } else {
                this.updateMetricDisplay(metric, analysis);
            }
        });
    }

    _initialize() {
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

        timeRangeSelect.addEventListener('change', (event) => {
            this.selectedRange = event.target.value;
            this.updateAllCharts();
        });
    }

    createVisualization() {
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

            this.container.appendChild(section);
            this.initChart(metric, canvas);
        });
    }

    updateMetricDisplay(metric, analysis) {
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

    initNetworkHandling() {
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

    processUpdateQueue() {
        while (this.updateQueue.length > 0) {
            const update = this.updateQueue.shift();
            this.updateMetricDisplay(update.metric, update.analysis);
        }
    }

    updateAllCharts() {
        console.log(`Updating all charts with range: ${this.selectedRange}`);
        // Implementation would fetch and update chart data based on selected range
    }

    initChart(metric, canvas) {
        try {
            const chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Current',
                            data: [],
                            borderColor: '#4CAF50',
                            tension: 0.4,
                            fill: false
                        },
                        {
                            label: 'Baseline',
                            data: [],
                            borderColor: '#2196F3',
                            tension: 0.4,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            this.charts.set(metric, chart);
        } catch (error) {
            console.warn(`Failed to initialize chart for ${metric}: ${error.message}`);
        }
    }
}

export const trendVisualization = new TrendVisualization(); 