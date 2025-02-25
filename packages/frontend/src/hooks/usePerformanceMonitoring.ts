import { useEffect, useRef } from 'react';
import { PerformanceMonitor } from '../services/monitoring/PerformanceMonitor';

interface UsePerformanceMonitoringOptions {
    componentName: string;
    trackRender?: boolean;
    trackGameMetrics?: boolean;
    gameId?: string;
}

export const usePerformanceMonitoring = ({
    componentName,
    trackRender = true,
    trackGameMetrics = false,
    gameId
}: UsePerformanceMonitoringOptions) => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    const renderStartTime = useRef<number>(0);

    useEffect(() => {
        if (trackRender) {
            renderStartTime.current = performance.now();
            return () => {
                performanceMonitor.trackRender(componentName, renderStartTime.current);
            };
        }
    }, [componentName, trackRender]);

    const trackMetric = (name: string, value: number, metadata?: Record<string, any>) => {
        performanceMonitor.trackMetric(
            `${componentName}_${name}`,
            value,
            { ...metadata, componentName }
        );
    };

    const trackGameMetric = (metrics: Record<string, number>) => {
        if (trackGameMetrics && gameId) {
            performanceMonitor.trackGameMetrics(gameId, metrics);
        }
    };

    return {
        trackMetric,
        trackGameMetric
    };
}; 