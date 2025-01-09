import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Box,
    CircularProgress,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Divider,
    Paper,
    LinearProgress
} from '@mui/material';
import {
    FitnessCenter as FitnessCenterIcon,
    Speed as SpeedIcon,
    Timeline as TimelineIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { MLService } from '../../services/ml.service';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface TrainingPlanProps {
    metrics: any;
    onPlanGenerated: (plan: any) => void;
}

const mlService = new MLService();

export const TrainingPlan: React.FC<TrainingPlanProps> = ({
    metrics,
    onPlanGenerated
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trainingPlan, setTrainingPlan] = useState<any>(null);
    const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);

    useEffect(() => {
        // Simulate loading performance history
        generatePerformanceHistory();
    }, []);

    useEffect(() => {
        if (performanceHistory.length > 0) {
            generateTrainingPlan();
        }
    }, [performanceHistory]);

    const generatePerformanceHistory = () => {
        const history = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);

            history.push({
                date: date.toISOString(),
                accuracy: 0.6 + Math.random() * 0.3,
                consistency: 0.5 + Math.random() * 0.4,
                speed: 40 + Math.random() * 30,
                stamina: 0.7 + Math.random() * 0.2
            });
        }

        setPerformanceHistory(history);
    };

    const generateTrainingPlan = async () => {
        try {
            setLoading(true);
            setError(null);

            const targetMetrics = ['accuracy', 'consistency', 'speed', 'stamina'];
            const response = await mlService.generateTrainingPlan(
                performanceHistory,
                targetMetrics,
                7 // Generate a week-long plan
            );

            setTrainingPlan(response.data);
            onPlanGenerated(response.data);
        } catch (err) {
            setError('Failed to generate training plan');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPerformanceData = () => {
        return performanceHistory.slice(-7).map(data => ({
            date: new Date(data.date).toLocaleDateString(),
            accuracy: data.accuracy * 100,
            consistency: data.consistency * 100,
            speed: data.speed,
            stamina: data.stamina * 100
        }));
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'precision_practice':
                return <TimelineIcon />;
            case 'speed_drill':
                return <SpeedIcon />;
            case 'endurance_training':
                return <FitnessCenterIcon />;
            default:
                return <TrendingUpIcon />;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Personalized Training Plan
                </Typography>

                <Grid container spacing={3}>
                    {/* Performance Overview */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Recent Performance
                        </Typography>
                        <Box height={300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={getPerformanceData()}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="accuracy" name="Accuracy %" fill="#8884d8" />
                                    <Bar dataKey="consistency" name="Consistency %" fill="#82ca9d" />
                                    <Bar dataKey="speed" name="Speed" fill="#ffc658" />
                                    <Bar dataKey="stamina" name="Stamina %" fill="#ff8042" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Grid>

                    {/* Training Plan */}
                    {trainingPlan && (
                        <Grid item xs={12}>
                            <Paper elevation={2} sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Weekly Training Schedule
                                </Typography>
                                <List>
                                    {trainingPlan.map((day: any, index: number) => (
                                        <React.Fragment key={index}>
                                            <ListItem>
                                                <ListItemText
                                                    primary={
                                                        <Box display="flex" alignItems="center" mb={1}>
                                                            <Typography variant="subtitle1">
                                                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                                            </Typography>
                                                            {day.focus_areas.map((area: string) => (
                                                                <Chip
                                                                    key={area}
                                                                    label={area}
                                                                    size="small"
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <List dense>
                                                            {day.activities.map((activity: any, actIndex: number) => (
                                                                <ListItem key={actIndex}>
                                                                    <ListItemIcon>
                                                                        {getActivityIcon(activity.type)}
                                                                    </ListItemIcon>
                                                                    <ListItemText
                                                                        primary={activity.type.replace('_', ' ')}
                                                                        secondary={`${activity.duration} minutes - ${activity.intensity} intensity`}
                                                                    />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    }
                                                />
                                            </ListItem>
                                            {index < trainingPlan.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Grid item xs={12}>
                            <Typography color="error">
                                {error}
                            </Typography>
                        </Grid>
                    )}

                    {/* Refresh Button */}
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={generateTrainingPlan}
                            disabled={loading}
                            fullWidth
                        >
                            Regenerate Training Plan
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}; 