import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    CircularProgress,
    LinearProgress,
    Tooltip,
    IconButton,
    useTheme
} from '@mui/material';
import {
    Timeline,
    Memory,
    Speed,
    NetworkCheck,
    Warning,
    Settings,
    Refresh
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { GamePerformanceMonitor } from '../../services/monitoring/GamePerformanceMonitor';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';
import { PerformanceSettingsDialog } from './PerformanceSettingsDialog';

interface PerformanceDashboardProps {
    gameId?: string;
    refreshInterval?: number;
}

interface MetricHistory {
    timestamps: number[];
    values: number[];
}

interface PerformanceHistory {
    fps: MetricHistory;
    renderTime: MetricHistory;
    physicsTime: MetricHistory;
    networkLatency: MetricHistory;
    memoryUsage: MetricHistory;
}

const MAX_HISTORY_POINTS = 60; // 1 minute of data at 1 sample per second

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
    gameId,
    refreshInterval = 1000
}) => {
    const theme = useTheme();
    const performanceMonitor = GamePerformanceMonitor.getInstance();
    const { trackMetric } = usePerformanceMonitoring({
        componentName: 'PerformanceDashboard',
        gameId
    });

    const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
    const [history, setHistory] = useState<PerformanceHistory>({
        fps: { timestamps: [], values: [] },
        renderTime: { timestamps: [], values: [] },
        physicsTime: { timestamps: [], values: [] },
        networkLatency: { timestamps: [], values: [] },
        memoryUsage: { timestamps: [], values: [] }
    });
    const [issues, setIssues] = useState<string[]>([]);
    const [score, setScore] = useState(100);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Update metrics periodically
    useEffect(() => {
        const updateMetrics = () => {
            const currentMetrics = performanceMonitor.getMetrics();
            setMetrics(currentMetrics);
            setScore(performanceMonitor.getPerformanceScore());

            // Update history
            const timestamp = Date.now();
            setHistory(prev => {
                const updateMetricHistory = (
                    current: MetricHistory,
                    newValue: number
                ): MetricHistory => {
                    const timestamps = [...current.timestamps, timestamp];
                    const values = [...current.values, newValue];
                    
                    // Keep only last MAX_HISTORY_POINTS
                    if (timestamps.length > MAX_HISTORY_POINTS) {
                        timestamps.shift();
                        values.shift();
                    }
                    
                    return { timestamps, values };
                };

                return {
                    fps: updateMetricHistory(prev.fps, currentMetrics.fps),
                    renderTime: updateMetricHistory(prev.renderTime, currentMetrics.renderTime),
                    physicsTime: updateMetricHistory(prev.physicsTime, currentMetrics.physicsTime),
                    networkLatency: updateMetricHistory(prev.networkLatency, currentMetrics.networkLatency),
                    memoryUsage: updateMetricHistory(prev.memoryUsage, currentMetrics.memoryUsage)
                };
            });

            // Track dashboard render performance
            trackMetric('update_time', performance.now());
        };

        const interval = setInterval(updateMetrics, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval, performanceMonitor, trackMetric]);

    // Chart configuration
    const chartOptions = useMemo(() => ({
        responsive: true,
        animation: false,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'second'
                },
                grid: {
                    color: theme.palette.divider
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: theme.palette.divider
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }), [theme.palette.divider]);

    const handleRefresh = () => {
        performanceMonitor.startMonitoring();
        const currentMetrics = performanceMonitor.getMetrics();
        setMetrics(currentMetrics);
        setScore(performanceMonitor.getPerformanceScore());
        trackMetric('manual_refresh', performance.now());
    };

    const handleSettingsOpen = () => {
        setIsSettingsOpen(true);
    };

    const handleSettingsClose = () => {
        setIsSettingsOpen(false);
        handleRefresh(); // Refresh metrics after settings change
    };

    const renderMetricCard = (
        title: string,
        value: number,
        unit: string,
        icon: React.ReactNode,
        threshold: number,
        history: MetricHistory
    ) => {
        const isWarning = value > threshold;
        const chartData = {
            labels: history.timestamps.map(t => new Date(t)),
            datasets: [{
                data: history.values,
                borderColor: isWarning ? theme.palette.warning.main : theme.palette.primary.main,
                tension: 0.4
            }]
        };

        return (
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                        {icon}
                        <Typography variant="h6" ml={1}>
                            {title}
                        </Typography>
                        {isWarning && (
                            <Tooltip title="Exceeds threshold">
                                <Warning color="warning" sx={{ ml: 'auto' }} />
                            </Tooltip>
                        )}
                    </Box>
                    <Typography variant="h4" gutterBottom>
                        {value.toFixed(1)} {unit}
                    </Typography>
                    <Box height={100}>
                        <Line data={chartData} options={chartOptions} />
                    </Box>
                </CardContent>
            </Card>
        );
    };

    const renderPerformanceScore = () => (
        <Card>
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <Speed />
                    <Typography variant="h6" ml={1}>
                        Performance Score
                    </Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="center">
                    <CircularProgress
                        variant="determinate"
                        value={score}
                        size={120}
                        thickness={8}
                        sx={{
                            color: score > 80 ? 'success.main' :
                                   score > 60 ? 'warning.main' :
                                   'error.main'
                        }}
                    />
                    <Typography
                        variant="h3"
                        position="absolute"
                        color={
                            score > 80 ? 'success.main' :
                            score > 60 ? 'warning.main' :
                            'error.main'
                        }
                    >
                        {score}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box p={3}>
            <Box display="flex" alignItems="center" mb={3}>
                <Typography variant="h4">Performance Dashboard</Typography>
                <Box ml="auto">
                    <Tooltip title="Refresh">
                        <IconButton onClick={handleRefresh}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Settings">
                        <IconButton onClick={handleSettingsOpen}>
                            <Settings />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    {renderPerformanceScore()}
                </Grid>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Active Issues
                            </Typography>
                            {issues.length > 0 ? (
                                issues.map((issue, index) => (
                                    <Typography
                                        key={index}
                                        color="warning.main"
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                        mb={1}
                                    >
                                        <Warning fontSize="small" />
                                        {issue}
                                    </Typography>
                                ))
                            ) : (
                                <Typography color="success.main">
                                    No active issues
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    {renderMetricCard(
                        'FPS',
                        metrics.fps,
                        'fps',
                        <Timeline />,
                        performanceMonitor.getThresholds().minFps,
                        history.fps
                    )}
                </Grid>
                <Grid item xs={12} md={6}>
                    {renderMetricCard(
                        'Render Time',
                        metrics.renderTime,
                        'ms',
                        <Speed />,
                        performanceMonitor.getThresholds().maxRenderTime,
                        history.renderTime
                    )}
                </Grid>
                <Grid item xs={12} md={6}>
                    {renderMetricCard(
                        'Network Latency',
                        metrics.networkLatency,
                        'ms',
                        <NetworkCheck />,
                        performanceMonitor.getThresholds().maxNetworkLatency,
                        history.networkLatency
                    )}
                </Grid>
                <Grid item xs={12} md={6}>
                    {renderMetricCard(
                        'Memory Usage',
                        metrics.memoryUsage / (1024 * 1024),
                        'MB',
                        <Memory />,
                        performanceMonitor.getThresholds().maxMemoryUsage / (1024 * 1024),
                        history.memoryUsage
                    )}
                </Grid>
            </Grid>

            <PerformanceSettingsDialog
                open={isSettingsOpen}
                onClose={handleSettingsClose}
            />
        </Box>
    );
}; 