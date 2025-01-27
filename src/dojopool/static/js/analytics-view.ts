import { Chart, ChartConfiguration } from 'chart.js';
import shotAnalytics from './shot-analytics';
import shotPredictor from './shot-predictor';

class AnalyticsView {
    private container: HTMLElement;
    private charts: Map<string, Chart> = new Map();
    private updateInterval = 5000; // Update every 5 seconds
    private predictionMarkers: HTMLElement[] = [];

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error('Analytics container not found');
        this.container = container;
        this.initializeView();
        this.startUpdates();
        this.initializePredictionListeners();
    }

    private initializeView(): void {
        this.container.innerHTML = `
            <div class="analytics-dashboard">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Shot Heatmap & Predictions</h5>
                                <div class="position-relative">
                                    <canvas id="heatmap-chart"></canvas>
                                    <div id="prediction-overlay" class="position-absolute top-0 start-0 w-100 h-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Time Distribution</h5>
                                <canvas id="time-distribution-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Shot Intervals</h5>
                                <canvas id="intervals-chart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Model Performance</h5>
                                <canvas id="model-performance-chart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Processing Time</h5>
                                <canvas id="processing-time-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">ML Insights</h5>
                                <div id="ml-insights" class="insights-container"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initializeCharts();
    }

    private initializeCharts(): void {
        // Heatmap
        const heatmapCtx = document.getElementById('heatmap-chart') as HTMLCanvasElement;
        this.charts.set('heatmap', new Chart(heatmapCtx, this.createHeatmapConfig()));

        // Time Distribution
        const timeDistCtx = document.getElementById('time-distribution-chart') as HTMLCanvasElement;
        this.charts.set('timeDistribution', new Chart(timeDistCtx, this.createTimeDistributionConfig()));

        // Intervals
        const intervalsCtx = document.getElementById('intervals-chart') as HTMLCanvasElement;
        this.charts.set('intervals', new Chart(intervalsCtx, this.createIntervalsConfig()));

        // Accuracy
        const accuracyCtx = document.getElementById('accuracy-chart') as HTMLCanvasElement;
        this.charts.set('accuracy', new Chart(accuracyCtx, this.createAccuracyConfig()));

        // Processing Time
        const processingCtx = document.getElementById('processing-time-chart') as HTMLCanvasElement;
        this.charts.set('processingTime', new Chart(processingCtx, this.createProcessingTimeConfig()));

        // Model Performance Chart
        const modelPerfCtx = document.getElementById('model-performance-chart') as HTMLCanvasElement;
        this.charts.set('modelPerformance', new Chart(modelPerfCtx, this.createModelPerformanceConfig()));
    }

    private createHeatmapConfig(): ChartConfiguration {
        return {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Shot Distribution',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 100
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: 100
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context: any) => {
                                const point = context.raw;
                                return `Shots: ${point.weight}`;
                            }
                        }
                    }
                }
            }
        };
    }

    private createTimeDistributionConfig(): ChartConfiguration {
        return {
            type: 'bar',
            data: {
                labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Shots per Hour',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };
    }

    private createIntervalsConfig(): ChartConfiguration {
        return {
            type: 'doughnut',
            data: {
                labels: ['Rapid', 'Normal', 'Slow'],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(75, 192, 192, 0.5)'
                    ]
                }]
            }
        };
    }

    private createAccuracyConfig(): ChartConfiguration {
        return {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Accuracy',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1
                    }
                }
            }
        };
    }

    private createProcessingTimeConfig(): ChartConfiguration {
        return {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Processing Time (ms)',
                    data: [],
                    borderColor: 'rgba(153, 102, 255, 1)',
                    tension: 0.1
                }]
            }
        };
    }

    private createModelPerformanceConfig(): ChartConfiguration {
        return {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Accuracy',
                        data: [],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Loss',
                        data: [],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: 1
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        };
    }

    private updatePredictionMarkers(predictions: Array<{ position: { x: number; y: number }, confidence: number }>): void {
        // Clear existing markers
        this.predictionMarkers.forEach(marker => marker.remove());
        this.predictionMarkers = [];

        const overlay = document.getElementById('prediction-overlay');
        if (!overlay) return;

        predictions.forEach(pred => {
            const marker = document.createElement('div');
            marker.className = 'prediction-marker';
            marker.style.left = `${pred.position.x}%`;
            marker.style.top = `${pred.position.y}%`;
            marker.style.opacity = `${pred.confidence}`;

            const tooltip = document.createElement('div');
            tooltip.className = 'prediction-tooltip';
            tooltip.textContent = `Confidence: ${(pred.confidence * 100).toFixed(1)}%`;

            marker.appendChild(tooltip);
            overlay.appendChild(marker);
            this.predictionMarkers.push(marker);
        });
    }

    private updateMLInsights(): void {
        const container = document.getElementById('ml-insights');
        if (!container) return;

        const metrics = shotPredictor.getMetrics();
        const analysis = shotAnalytics.analyzeShots();

        const insights = [
            {
                title: 'Model Performance',
                content: `Accuracy: ${(metrics.accuracy * 100).toFixed(1)}% | Loss: ${metrics.loss.toFixed(3)}`
            },
            {
                title: 'Predictions Made',
                content: `Total: ${metrics.predictions} | Recent Success Rate: ${(analysis.accuracy * 100).toFixed(1)}%`
            }
        ];

        container.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <h6>${insight.title}</h6>
                <p>${insight.content}</p>
            </div>
        `).join('');
    }

    private async initializePredictionListeners(): Promise<void> {
        // Listen for new shots to update predictions
        shotAnalytics.on('shotAdded', async (shot) => {
            const recentShots = shotAnalytics.getRecentShots();
            const prediction = await shotPredictor.predict(recentShots);

            if (prediction) {
                this.updatePredictionMarkers([prediction]);
            }
        });

        // Listen for model training events
        shotPredictor.on('trainingProgress', (progress) => {
            const chart = this.charts.get('modelPerformance');
            if (chart) {
                const timestamp = new Date().toLocaleTimeString();

                chart.data.labels?.push(timestamp);
                chart.data.datasets[0].data.push(progress.accuracy);
                chart.data.datasets[1].data.push(progress.loss);

                if (chart.data.labels.length > 20) {
                    chart.data.labels.shift();
                    chart.data.datasets[0].data.shift();
                    chart.data.datasets[1].data.shift();
                }

                chart.update();
            }
        });

        shotPredictor.on('trainingComplete', () => {
            this.updateMLInsights();
        });
    }

    private updateCharts(): void {
        const analysis = shotAnalytics.analyzeShots();

        // Update heatmap
        const heatmap = this.charts.get('heatmap');
        if (heatmap) {
            heatmap.data.datasets[0].data = analysis.hotspots;
            heatmap.update();
        }

        // Update time distribution
        const timeDistribution = this.charts.get('timeDistribution');
        if (timeDistribution) {
            timeDistribution.data.datasets[0].data = Object.values(analysis.patterns.timeOfDay);
            timeDistribution.update();
        }

        // Update intervals
        const intervals = this.charts.get('intervals');
        if (intervals) {
            intervals.data.datasets[0].data = Object.values(analysis.patterns.intervalDistribution);
            intervals.update();
        }

        // Update accuracy
        const accuracy = this.charts.get('accuracy');
        if (accuracy) {
            accuracy.data.labels?.push(new Date().toLocaleTimeString());
            accuracy.data.datasets[0].data.push(analysis.accuracy);
            if (accuracy.data.labels.length > 20) {
                accuracy.data.labels.shift();
                accuracy.data.datasets[0].data.shift();
            }
            accuracy.update();
        }

        // Update processing time
        const processingTime = this.charts.get('processingTime');
        if (processingTime) {
            processingTime.data.labels?.push(new Date().toLocaleTimeString());
            processingTime.data.datasets[0].data.push(analysis.averageProcessingTime);
            if (processingTime.data.labels.length > 20) {
                processingTime.data.labels.shift();
                processingTime.data.datasets[0].data.shift();
            }
            processingTime.update();
        }

        // Update ML insights
        this.updateMLInsights();
    }

    private startUpdates(): void {
        // Initial update
        this.updateCharts();

        // Set up periodic updates
        setInterval(() => this.updateCharts(), this.updateInterval);

        // Listen for real-time updates
        shotAnalytics.on('shotAdded', () => this.updateCharts());
        shotAnalytics.on('analysisUpdate', () => this.updateCharts());
    }
}

export default AnalyticsView; 