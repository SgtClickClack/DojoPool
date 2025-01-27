import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface Experiment {
    id: string;
    name: string;
    description: string;
    variants: string[];
    traffic_percentage: number;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
}

interface Metrics {
    [variant: string]: {
        [eventType: string]: {
            count: number;
            sum: number;
            mean: number;
            min: number;
            max: number;
        };
    };
}

const ExperimentDashboard: React.FC = () => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();

    useEffect(() => {
        fetchExperiments();
    }, []);

    useEffect(() => {
        if (selectedExperiment) {
            fetchMetrics(selectedExperiment);
        }
    }, [selectedExperiment]);

    const fetchExperiments = async () => {
        try {
            const token = await getToken();
            const response = await fetch('/api/experiments/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setExperiments(data);
            if (data.length > 0) {
                setSelectedExperiment(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching experiments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMetrics = async (experimentId: string) => {
        try {
            const token = await getToken();
            const response = await fetch(`/api/experiments/${experimentId}/metrics`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setMetrics(data);
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    };

    const renderMetricsTable = () => {
        if (!metrics || !selectedExperiment) return null;

        const experiment = experiments.find(e => e.id === selectedExperiment);
        if (!experiment) return null;

        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Variant</TableCell>
                            <TableCell>Event Type</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Mean</TableCell>
                            <TableCell align="right">Min</TableCell>
                            <TableCell align="right">Max</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(metrics).map(([variant, variantMetrics]) =>
                            Object.entries(variantMetrics).map(([eventType, stats]) => (
                                <TableRow key={`${variant}-${eventType}`}>
                                    <TableCell>{variant}</TableCell>
                                    <TableCell>{eventType}</TableCell>
                                    <TableCell align="right">{stats.count}</TableCell>
                                    <TableCell align="right">{stats.mean.toFixed(2)}</TableCell>
                                    <TableCell align="right">{stats.min.toFixed(2)}</TableCell>
                                    <TableCell align="right">{stats.max.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box my={4}>
                <Typography variant="h4" component="h1" gutterBottom>
                    A/B Testing Dashboard
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Active Experiments
                                </Typography>
                                <Box display="flex" gap={2}>
                                    {experiments.map((experiment) => (
                                        <Button
                                            key={experiment.id}
                                            variant={selectedExperiment === experiment.id ? "contained" : "outlined"}
                                            onClick={() => setSelectedExperiment(experiment.id)}
                                        >
                                            {experiment.name}
                                        </Button>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {selectedExperiment && (
                        <>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Experiment Details
                                        </Typography>
                                        {experiments
                                            .filter((e) => e.id === selectedExperiment)
                                            .map((experiment) => (
                                                <Box key={experiment.id}>
                                                    <Typography><strong>Description:</strong> {experiment.description}</Typography>
                                                    <Typography><strong>Variants:</strong> {experiment.variants.join(', ')}</Typography>
                                                    <Typography>
                                                        <strong>Traffic:</strong> {(experiment.traffic_percentage * 100).toFixed(1)}%
                                                    </Typography>
                                                    <Typography>
                                                        <strong>Start Date:</strong> {format(new Date(experiment.start_date), 'PPP')}
                                                    </Typography>
                                                    {experiment.end_date && (
                                                        <Typography>
                                                            <strong>End Date:</strong> {format(new Date(experiment.end_date), 'PPP')}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ))}
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Metrics
                                        </Typography>
                                        {renderMetricsTable()}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Box>
        </Container>
    );
};

export default ExperimentDashboard; 