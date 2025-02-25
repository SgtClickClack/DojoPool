import { PerformanceMonitor } from './PerformanceMonitor';

interface GameMetrics {
    fps: number;
    frameTime: number;
    renderTime: number;
    physicsTime: number;
    networkLatency: number;
    memoryUsage: number;
}

interface GamePerformanceThresholds {
    minFps: number;
    maxFrameTime: number;
    maxRenderTime: number;
    maxPhysicsTime: number;
    maxNetworkLatency: number;
    maxMemoryUsage: number;
}

export class GamePerformanceMonitor {
    private static instance: GamePerformanceMonitor;
    private performanceMonitor: PerformanceMonitor;
    private metrics: GameMetrics;
    private thresholds: GamePerformanceThresholds;
    private frameCount: number = 0;
    private lastFrameTime: number = 0;
    private frameTimeHistory: number[] = [];
    private readonly HISTORY_SIZE = 60; // 1 second at 60fps
    private animationFrameId: number | null = null;
    private isMonitoring: boolean = false;

    private constructor() {
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            renderTime: 0,
            physicsTime: 0,
            networkLatency: 0,
            memoryUsage: 0
        };
        this.thresholds = {
            minFps: 55,
            maxFrameTime: 20,
            maxRenderTime: 10,
            maxPhysicsTime: 5,
            maxNetworkLatency: 100,
            maxMemoryUsage: 50 * 1024 * 1024 // 50MB
        };
    }

    public static getInstance(): GamePerformanceMonitor {
        if (!GamePerformanceMonitor.instance) {
            GamePerformanceMonitor.instance = new GamePerformanceMonitor();
        }
        return GamePerformanceMonitor.instance;
    }

    public startMonitoring(): void {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        this.lastFrameTime = performance.now();
        this.monitorFrame();
    }

    public stopMonitoring(): void {
        this.isMonitoring = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private monitorFrame = (): void => {
        if (!this.isMonitoring) return;

        const currentTime = performance.now();
        const frameTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Update frame time history
        this.frameTimeHistory.push(frameTime);
        if (this.frameTimeHistory.length > this.HISTORY_SIZE) {
            this.frameTimeHistory.shift();
        }

        // Calculate metrics
        this.updateMetrics();

        // Track performance
        this.trackPerformance();

        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.monitorFrame);
    };

    private updateMetrics(): void {
        // Calculate FPS from frame time history
        const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / 
            this.frameTimeHistory.length;
        
        this.metrics = {
            ...this.metrics,
            fps: Math.round(1000 / avgFrameTime),
            frameTime: avgFrameTime,
            memoryUsage: this.getMemoryUsage()
        };
    }

    private getMemoryUsage(): number {
        if (performance.memory) {
            return (performance.memory as any).usedJSHeapSize;
        }
        return 0;
    }

    public trackRenderTime(startTime: number): void {
        const renderTime = performance.now() - startTime;
        this.metrics.renderTime = renderTime;
        
        this.performanceMonitor.trackMetric('game_render_time', renderTime, {
            fps: this.metrics.fps,
            exceedsThreshold: renderTime > this.thresholds.maxRenderTime
        });
    }

    public trackPhysicsTime(startTime: number): void {
        const physicsTime = performance.now() - startTime;
        this.metrics.physicsTime = physicsTime;

        this.performanceMonitor.trackMetric('game_physics_time', physicsTime, {
            fps: this.metrics.fps,
            exceedsThreshold: physicsTime > this.thresholds.maxPhysicsTime
        });
    }

    public trackNetworkLatency(latency: number): void {
        this.metrics.networkLatency = latency;

        this.performanceMonitor.trackMetric('game_network_latency', latency, {
            exceedsThreshold: latency > this.thresholds.maxNetworkLatency
        });
    }

    private trackPerformance(): void {
        // Track overall game performance
        this.performanceMonitor.trackMetric('game_performance', {
            fps: this.metrics.fps,
            frameTime: this.metrics.frameTime,
            renderTime: this.metrics.renderTime,
            physicsTime: this.metrics.physicsTime,
            networkLatency: this.metrics.networkLatency,
            memoryUsage: this.metrics.memoryUsage
        });

        // Check for performance issues
        this.checkPerformanceIssues();
    }

    private checkPerformanceIssues(): void {
        const issues: string[] = [];

        if (this.metrics.fps < this.thresholds.minFps) {
            issues.push('Low FPS');
        }
        if (this.metrics.frameTime > this.thresholds.maxFrameTime) {
            issues.push('High Frame Time');
        }
        if (this.metrics.renderTime > this.thresholds.maxRenderTime) {
            issues.push('High Render Time');
        }
        if (this.metrics.physicsTime > this.thresholds.maxPhysicsTime) {
            issues.push('High Physics Time');
        }
        if (this.metrics.networkLatency > this.thresholds.maxNetworkLatency) {
            issues.push('High Network Latency');
        }
        if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
            issues.push('High Memory Usage');
        }

        if (issues.length > 0) {
            this.performanceMonitor.trackMetric('game_performance_issues', {
                issues,
                metrics: this.metrics
            });
        }
    }

    public setThresholds(thresholds: Partial<GamePerformanceThresholds>): void {
        this.thresholds = {
            ...this.thresholds,
            ...thresholds
        };
    }

    public getMetrics(): GameMetrics {
        return { ...this.metrics };
    }

    public getThresholds(): GamePerformanceThresholds {
        return { ...this.thresholds };
    }

    public getPerformanceScore(): number {
        const weights = {
            fps: 0.3,
            frameTime: 0.2,
            renderTime: 0.2,
            physicsTime: 0.1,
            networkLatency: 0.1,
            memoryUsage: 0.1
        };

        const scores = {
            fps: Math.min(100, (this.metrics.fps / this.thresholds.minFps) * 100),
            frameTime: Math.min(100, (this.thresholds.maxFrameTime / this.metrics.frameTime) * 100),
            renderTime: Math.min(100, (this.thresholds.maxRenderTime / this.metrics.renderTime) * 100),
            physicsTime: Math.min(100, (this.thresholds.maxPhysicsTime / this.metrics.physicsTime) * 100),
            networkLatency: Math.min(100, (this.thresholds.maxNetworkLatency / this.metrics.networkLatency) * 100),
            memoryUsage: Math.min(100, (this.thresholds.maxMemoryUsage / this.metrics.memoryUsage) * 100)
        };

        return Object.entries(weights).reduce((total, [metric, weight]) => {
            return total + (scores[metric as keyof typeof scores] * weight);
        }, 0);
    }

    public cleanup(): void {
        this.stopMonitoring();
        this.frameTimeHistory = [];
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            renderTime: 0,
            physicsTime: 0,
            networkLatency: 0,
            memoryUsage: 0
        };
    }
} 