import React, { useState, useEffect } from 'react';
import { Box, Container, Grid } from '@mui/material';
import { SystemStatus } from './SystemStatus';
import { MetricsChart } from './MetricsChart';
import { OptimizationRecommendations } from './OptimizationRecommendations';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

export const PerformanceDashboard: React.FC = () => {
    const [timeRange, setTimeRange] = useState<string>('1h');
    const {
        systemStatus,
        metricsHistory,
        recommendations,
        loading,
        error,
        fetchMetrics
    } = usePerformanceMonitor();

    useEffect(() => {
        // Initial fetch
        fetchMetrics(timeRange);

        // Set up polling interval
        const interval = setInterval(() => {
            fetchMetrics(timeRange);
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, [timeRange, fetchMetrics]);

    const handleTimeRangeChange = (newRange: string) => {
        setTimeRange(newRange);
    };

    if (loading) {
        return <div>Loading performance metrics...</div>;
    }

    if (error) {
        return <div>Error loading performance metrics: {error}</div>;
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <SystemStatus status={systemStatus} />
                    </Grid>
                    <Grid item xs={12}>
                        <MetricsChart
                            data={metricsHistory}
                            timeRange={timeRange}
                            onTimeRangeChange={handleTimeRangeChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <OptimizationRecommendations
                            recommendations={recommendations}
                        />
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}; 