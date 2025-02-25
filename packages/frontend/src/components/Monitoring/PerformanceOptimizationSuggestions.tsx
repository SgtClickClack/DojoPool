import React, { useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Divider,
    useTheme
} from '@mui/material';
import {
    Speed,
    Memory,
    NetworkCheck,
    Code,
    BugReport,
    Lightbulb
} from '@mui/icons-material';
import { TestResult } from '../../services/monitoring/AutomatedPerformanceTesting';

interface PerformanceOptimizationSuggestionsProps {
    testResult: TestResult;
}

interface OptimizationSuggestion {
    type: 'fps' | 'memory' | 'network' | 'code' | 'general';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    implementation: string;
}

export const PerformanceOptimizationSuggestions: React.FC<PerformanceOptimizationSuggestionsProps> = ({
    testResult
}) => {
    const theme = useTheme();

    const suggestions = useMemo(() => {
        const optimizations: OptimizationSuggestion[] = [];

        // FPS and Frame Time Optimizations
        if (testResult.averageMetrics.fps < 60) {
            optimizations.push({
                type: 'fps',
                priority: testResult.averageMetrics.fps < 30 ? 'high' : 'medium',
                title: 'Low Frame Rate Detected',
                description: 'Frame rate is below optimal levels, affecting gameplay smoothness.',
                impact: 'Improved visual responsiveness and player experience.',
                implementation: `
                    - Optimize render loops and game logic
                    - Implement frame time budgeting
                    - Consider reducing visual effects during high-activity periods
                    - Profile and optimize expensive render operations
                `
            });
        }

        // Memory Optimizations
        if (testResult.averageMetrics.memoryUsage > 75 * 1024 * 1024) {
            optimizations.push({
                type: 'memory',
                priority: testResult.averageMetrics.memoryUsage > 150 * 1024 * 1024 ? 'high' : 'medium',
                title: 'High Memory Usage',
                description: 'Memory consumption is above recommended levels.',
                impact: 'Reduced risk of crashes and improved performance stability.',
                implementation: `
                    - Implement object pooling for frequently created/destroyed objects
                    - Review and optimize texture and asset memory usage
                    - Add memory cleanup routines during scene transitions
                    - Monitor and fix memory leaks
                `
            });
        }

        // Network Optimizations
        if (testResult.averageMetrics.networkLatency > 100) {
            optimizations.push({
                type: 'network',
                priority: testResult.averageMetrics.networkLatency > 200 ? 'high' : 'medium',
                title: 'High Network Latency',
                description: 'Network response times are impacting game responsiveness.',
                impact: 'Smoother multiplayer experience and reduced lag.',
                implementation: `
                    - Implement client-side prediction
                    - Optimize network packet size and frequency
                    - Add network state interpolation
                    - Consider regional server deployment
                `
            });
        }

        // Code Optimizations based on Physics and Render Time
        if (testResult.averageMetrics.physicsTime > 8 || testResult.averageMetrics.renderTime > 16) {
            optimizations.push({
                type: 'code',
                priority: 'high',
                title: 'Performance Bottlenecks Detected',
                description: 'Processing times for physics or rendering are excessive.',
                impact: 'Improved game performance and reduced CPU/GPU load.',
                implementation: `
                    - Profile and optimize expensive calculations
                    - Implement spatial partitioning for physics
                    - Use object pooling for particle systems
                    - Consider using Web Workers for heavy computations
                `
            });
        }

        // General Optimizations
        if (testResult.performanceScore < 80) {
            optimizations.push({
                type: 'general',
                priority: testResult.performanceScore < 60 ? 'high' : 'medium',
                title: 'General Performance Issues',
                description: 'Overall performance score indicates room for improvement.',
                impact: 'Better overall user experience and game performance.',
                implementation: `
                    - Review and optimize asset loading strategies
                    - Implement progressive enhancement based on device capabilities
                    - Add performance monitoring and automated testing
                    - Consider implementing level of detail (LOD) system
                `
            });
        }

        return optimizations;
    }, [testResult]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return theme.palette.error.main;
            case 'medium':
                return theme.palette.warning.main;
            default:
                return theme.palette.success.main;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'fps':
                return <Speed />;
            case 'memory':
                return <Memory />;
            case 'network':
                return <NetworkCheck />;
            case 'code':
                return <Code />;
            case 'general':
                return <BugReport />;
            default:
                return <Lightbulb />;
        }
    };

    if (suggestions.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Performance Optimization Suggestions
                    </Typography>
                    <Typography color="success.main">
                        No optimization suggestions at this time. Performance is within acceptable ranges.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Performance Optimization Suggestions
                </Typography>
                <List>
                    {suggestions.map((suggestion, index) => (
                        <React.Fragment key={index}>
                            <ListItem alignItems="flex-start">
                                <ListItemIcon>
                                    {getIcon(suggestion.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="subtitle1">
                                                {suggestion.title}
                                            </Typography>
                                            <Chip
                                                label={suggestion.priority.toUpperCase()}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getPriorityColor(suggestion.priority),
                                                    color: 'white'
                                                }}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box mt={1}>
                                            <Typography variant="body2" paragraph>
                                                {suggestion.description}
                                            </Typography>
                                            <Typography variant="body2" color="primary" paragraph>
                                                Impact: {suggestion.impact}
                                            </Typography>
                                            <Typography variant="body2">
                                                Suggested Implementation:
                                            </Typography>
                                            <List dense>
                                                {suggestion.implementation.trim().split('\n').map((step, i) => (
                                                    <ListItem key={i}>
                                                        <ListItemText
                                                            primary={step.trim().replace('-', '•')}
                                                            sx={{ my: 0 }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    }
                                />
                            </ListItem>
                            {index < suggestions.length - 1 && (
                                <Divider variant="inset" component="li" />
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
}; 