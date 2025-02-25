import { MetricsConfig } from '../../workers/metrics.config';
import { WebSocketService } from '../websocket/WebSocketService';

interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

interface ComponentRenderTiming {
    componentName: string;
    renderTime: number;
    timestamp: number;
}

class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private wsService: WebSocketService;
    private metricsWorker: Worker | null = null;
    private metrics: PerformanceMetric[] = [];
    private renderTimings: ComponentRenderTiming[] = [];
    private readonly maxMetricsSize = MetricsConfig.PROCESSING.MAX_CACHE_SIZE;
    private readonly flushInterval = MetricsConfig.CACHE.CLEANUP_INTERVAL;
    private flushTimeout: NodeJS.Timeout | null = null;

    private constructor() {
        this.wsService = WebSocketService.getInstance();
        this.initializeMetricsWorker();
        this.startFlushInterval();
    }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    private initializeMetricsWorker(): void {
        if (typeof Worker !== 'undefined') {
            this.metricsWorker = new Worker(
                new URL('../../workers/metrics.worker.ts', import.meta.url)
            );

            this.metricsWorker.onmessage = (event) => {
                if (event.data.type === 'metrics_processed') {
                    this.sendMetricsToBackend(event.data.metrics);
                }
            };
        }
    }

    public trackMetric(name: string, value: number, metadata?: Record<string, any>): void {
        const metric: PerformanceMetric = {
            name,
            value,
            timestamp: Date.now(),
            metadata
        };

        this.metrics.push(metric);

        if (this.metrics.length >= this.maxMetricsSize) {
            this.flushMetrics();
        }
    }

    public trackRender(componentName: string, startTime: number): void {
        const renderTime = performance.now() - startTime;
        const timing: ComponentRenderTiming = {
            componentName,
            renderTime,
            timestamp: Date.now()
        };

        this.renderTimings.push(timing);
        this.trackMetric(`render_time_${componentName}`, renderTime);
    }

    public trackGameMetrics(gameId: string, metrics: Record<string, number>): void {
        Object.entries(metrics).forEach(([key, value]) => {
            this.trackMetric(`game_${key}`, value, { gameId });
        });
    }

    private async flushMetrics(): Promise<void> {
        if (this.metrics.length === 0 && this.renderTimings.length === 0) return;

        try {
            if (this.metricsWorker) {
                // Process metrics in worker
                this.metricsWorker.postMessage({
                    type: 'process_metrics',
                    metrics: this.metrics,
                    renderTimings: this.renderTimings
                });
            } else {
                // Fallback: send directly to backend
                await this.sendMetricsToBackend({
                    metrics: this.metrics,
                    renderTimings: this.renderTimings
                });
            }

            // Clear metrics after successful processing
            this.metrics = [];
            this.renderTimings = [];
        } catch (error) {
            console.error('Failed to flush metrics:', error);
        }
    }

    private startFlushInterval(): void {
        if (this.flushTimeout) {
            clearInterval(this.flushTimeout);
        }

        this.flushTimeout = setInterval(() => {
            this.flushMetrics();
        }, this.flushInterval);
    }

    private async sendMetricsToBackend(data: any): Promise<void> {
        try {
            this.wsService.sendMessage({
                type: 'metrics_update',
                data: {
                    timestamp: Date.now(),
                    ...data
                }
            });
        } catch (error) {
            console.error('Error sending metrics to backend:', error);
            throw error;
        }
    }

    public getMetricsSnapshot(): {
        metrics: PerformanceMetric[];
        renderTimings: ComponentRenderTiming[];
    } {
        return {
            metrics: [...this.metrics],
            renderTimings: [...this.renderTimings]
        };
    }

    public destroy(): void {
        if (this.flushTimeout) {
            clearInterval(this.flushTimeout);
            this.flushTimeout = null;
        }

        if (this.metricsWorker) {
            this.metricsWorker.terminate();
            this.metricsWorker = null;
        }

        this.flushMetrics();
    }
} 