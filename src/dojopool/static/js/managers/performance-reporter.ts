import { BaseManager } from './base-manager';
import { PerformanceReport } from './performance-monitor';

export interface ReportFormat {
    type: 'json' | 'csv' | 'html';
    includeVisualizations?: boolean;
}

export interface ReportingOptions {
    autoExport?: boolean;
    exportInterval?: number;
    format?: ReportFormat;
    filename?: string;
}

export class PerformanceReporter extends BaseManager<PerformanceReporter> {
    private reports: PerformanceReport[] = [];
    private exportInterval?: number;
    private readonly options: Required<ReportingOptions>;

    protected constructor(options: ReportingOptions = {}) {
        super();
        this.options = {
            autoExport: options.autoExport || false,
            exportInterval: options.exportInterval || 3600000, // 1 hour
            format: options.format || { type: 'json', includeVisualizations: true },
            filename: options.filename || 'performance-report'
        };

        if (this.options.autoExport) {
            this.startAutoExport();
        }
    }

    public static override getInstance(options?: ReportingOptions): PerformanceReporter {
        return BaseManager.getInstance.call(PerformanceReporter) || new PerformanceReporter(options);
    }

    public addReport(report: PerformanceReport): void {
        this.reports.push(report);
    }

    public async exportReport(format?: ReportFormat): Promise<void> {
        const reportFormat = format || this.options.format;
        const data = await this.formatReport(reportFormat);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${this.options.filename}-${timestamp}`;

        switch (reportFormat.type) {
            case 'json':
                this.downloadFile(`${filename}.json`, JSON.stringify(data, null, 2), 'application/json');
                break;
            case 'csv':
                this.downloadFile(`${filename}.csv`, this.convertToCSV(data), 'text/csv');
                break;
            case 'html':
                this.downloadFile(`${filename}.html`, this.generateHTML(data), 'text/html');
                break;
        }
    }

    private async formatReport(format: ReportFormat): Promise<any> {
        const summary = this.generateSummary();
        const trends = this.analyzeTrends();
        const recommendations = this.generateRecommendations();

        if (format.includeVisualizations) {
            const visualizations = await this.captureVisualizations();
            return { summary, trends, recommendations, visualizations };
        }

        return { summary, trends, recommendations };
    }

    private generateSummary(): any {
        if (this.reports.length === 0) return {};

        const fps = this.reports.map(r => r.fps);
        const frameTime = this.reports.map(r => r.frameTime);
        const gpuTime = this.reports.map(r => r.gpuMetrics.gpuTime);
        const memory = this.reports.map(r => r.memoryUsage.usedJSHeapSize);
        const workerUtil = this.reports.map(r => r.workerMetrics.totalUtilization);

        return {
            timeRange: {
                start: this.reports[0].timestamp,
                end: this.reports[this.reports.length - 1].timestamp
            },
            performance: {
                fps: {
                    average: this.average(fps),
                    min: Math.min(...fps),
                    max: Math.max(...fps),
                    p95: this.percentile(fps, 95)
                },
                frameTime: {
                    average: this.average(frameTime),
                    min: Math.min(...frameTime),
                    max: Math.max(...frameTime),
                    p95: this.percentile(frameTime, 95)
                },
                gpuTime: {
                    average: this.average(gpuTime),
                    min: Math.min(...gpuTime),
                    max: Math.max(...gpuTime),
                    p95: this.percentile(gpuTime, 95)
                }
            },
            memory: {
                average: this.average(memory),
                peak: Math.max(...memory),
                growth: this.calculateGrowthRate(memory)
            },
            workers: {
                averageUtilization: this.average(workerUtil),
                peakUtilization: Math.max(...workerUtil)
            },
            violations: this.summarizeViolations()
        };
    }

    private analyzeTrends(): any {
        return {
            performance: this.detectPerformanceTrends(),
            memory: this.detectMemoryTrends(),
            workers: this.detectWorkerTrends()
        };
    }

    private generateRecommendations(): any {
        const recommendations: any[] = [];
        const summary = this.generateSummary();

        // Performance recommendations
        if (summary.performance.fps.average < 55) {
            recommendations.push({
                type: 'performance',
                severity: 'high',
                issue: 'Low average FPS',
                recommendation: 'Consider reducing draw calls or optimizing shaders'
            });
        }

        // Memory recommendations
        if (summary.memory.growth > 1024 * 1024) { // More than 1MB/s growth
            recommendations.push({
                type: 'memory',
                severity: 'high',
                issue: 'Memory leak detected',
                recommendation: 'Check for uncleaned resources or accumulating caches'
            });
        }

        // Worker recommendations
        if (summary.workers.averageUtilization > 0.8) {
            recommendations.push({
                type: 'workers',
                severity: 'medium',
                issue: 'High worker utilization',
                recommendation: 'Consider adding more workers or optimizing tasks'
            });
        }

        return recommendations;
    }

    private async captureVisualizations(): Promise<string[]> {
        const visualizations: string[] = [];
        const canvases = document.querySelectorAll('canvas');

        for (const canvas of canvases) {
            try {
                const dataUrl = canvas.toDataURL('image/png');
                visualizations.push(dataUrl);
            } catch (error) {
                console.error('Failed to capture canvas:', error);
            }
        }

        return visualizations;
    }

    private convertToCSV(data: any): string {
        // Implement CSV conversion logic
        const rows: string[] = [];
        const headers = this.extractHeaders(data);
        rows.push(headers.join(','));

        this.reports.forEach(report => {
            const row = headers.map(header => this.extractValue(report, header));
            rows.push(row.join(','));
        });

        return rows.join('\n');
    }

    private generateHTML(data: any): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Performance Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 2em; }
                    .section { margin-bottom: 2em; }
                    .chart { margin: 1em 0; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .recommendation { padding: 1em; margin: 0.5em 0; border-left: 4px solid; }
                    .high { border-color: #f44336; }
                    .medium { border-color: #ff9800; }
                    .low { border-color: #4caf50; }
                </style>
            </head>
            <body>
                <h1>Performance Report</h1>
                ${this.renderSummaryHTML(data.summary)}
                ${this.renderTrendsHTML(data.trends)}
                ${this.renderRecommendationsHTML(data.recommendations)}
                ${data.visualizations ? this.renderVisualizationsHTML(data.visualizations) : ''}
            </body>
            </html>
        `;
    }

    private renderSummaryHTML(summary: any): string {
        return `
            <div class="section">
                <h2>Summary</h2>
                <table>
                    <tr>
                        <th>Metric</th>
                        <th>Average</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>95th Percentile</th>
                    </tr>
                    <tr>
                        <td>FPS</td>
                        <td>${summary.performance.fps.average.toFixed(2)}</td>
                        <td>${summary.performance.fps.min.toFixed(2)}</td>
                        <td>${summary.performance.fps.max.toFixed(2)}</td>
                        <td>${summary.performance.fps.p95.toFixed(2)}</td>
                    </tr>
                    <!-- Add more rows for other metrics -->
                </table>
            </div>
        `;
    }

    private renderTrendsHTML(trends: any): string {
        return `
            <div class="section">
                <h2>Trends</h2>
                <!-- Add trend visualizations -->
            </div>
        `;
    }

    private renderRecommendationsHTML(recommendations: any[]): string {
        return `
            <div class="section">
                <h2>Recommendations</h2>
                ${recommendations.map(rec => `
                    <div class="recommendation ${rec.severity}">
                        <h3>${rec.issue}</h3>
                        <p>${rec.recommendation}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    private renderVisualizationsHTML(visualizations: string[]): string {
        return `
            <div class="section">
                <h2>Visualizations</h2>
                ${visualizations.map(viz => `
                    <div class="chart">
                        <img src="${viz}" alt="Performance Visualization" />
                    </div>
                `).join('')}
            </div>
        `;
    }

    private downloadFile(filename: string, content: string, type: string): void {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    private startAutoExport(): void {
        this.exportInterval = window.setInterval(() => {
            this.exportReport();
        }, this.options.exportInterval);
    }

    private average(values: number[]): number {
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    private percentile(values: number[], p: number): number {
        const sorted = [...values].sort((a, b) => a - b);
        const pos = (sorted.length - 1) * p / 100;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sorted[base + 1] !== undefined) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        }
        return sorted[base];
    }

    private calculateGrowthRate(values: number[]): number {
        if (values.length < 2) return 0;
        const timeSpan = this.reports[this.reports.length - 1].timestamp - this.reports[0].timestamp;
        return (values[values.length - 1] - values[0]) / (timeSpan / 1000);
    }

    private summarizeViolations(): any {
        const violations = this.reports.flatMap(r => r.budgetStatus.violations);
        const byType = new Map<string, number>();
        violations.forEach(v => {
            byType.set(v.metric, (byType.get(v.metric) || 0) + 1);
        });
        return Object.fromEntries(byType);
    }

    private detectPerformanceTrends(): any {
        // Implement trend detection logic
        return {};
    }

    private detectMemoryTrends(): any {
        // Implement memory trend detection
        return {};
    }

    private detectWorkerTrends(): any {
        // Implement worker trend detection
        return {};
    }

    private extractHeaders(data: any): string[] {
        // Implement header extraction logic
        return [];
    }

    private extractValue(obj: any, path: string): any {
        // Implement value extraction logic
        return '';
    }

    public override cleanup(): void {
        if (this.exportInterval) {
            clearInterval(this.exportInterval);
        }
        this.reports = [];
        this.onCleanup();
    }
} 