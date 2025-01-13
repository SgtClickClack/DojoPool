import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Slider,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { MLService } from '../../services/ml.service';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnomalyDetectionProps {
  onAnomalyDetected: (anomalies: any) => void;
}

const mlService = new MLService();

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ onAnomalyDetected }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [contamination, setContamination] = useState(0.1);

  useEffect(() => {
    // Simulate receiving performance data
    const interval = setInterval(() => {
      const newData = generatePerformanceData();
      setPerformanceData((prev) => [...prev.slice(-49), newData]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (performanceData.length >= 50) {
      detectAnomalies();
    }
  }, [performanceData, contamination]);

  const generatePerformanceData = () => {
    // Generate random performance metrics
    const baseAccuracy = 0.75 + Math.random() * 0.2;
    const baseSpeed = 50 + Math.random() * 20;

    // Occasionally generate anomalous data
    const isAnomalous = Math.random() < 0.1;

    return {
      timestamp: new Date().toISOString(),
      accuracy: isAnomalous ? baseAccuracy * 0.5 : baseAccuracy,
      speed: isAnomalous ? baseSpeed * 1.5 : baseSpeed,
      shots_taken: Math.floor(10 + Math.random() * 20),
      success_rate: isAnomalous ? 0.3 + Math.random() * 0.2 : 0.6 + Math.random() * 0.3,
    };
  };

  const detectAnomalies = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await mlService.detectAnomalies(performanceData, contamination);

      const detectedAnomalies = performanceData.filter(
        (_, index) => response.data.anomalies[index]
      );

      setAnomalies(detectedAnomalies);
      onAnomalyDetected(detectedAnomalies);
    } catch (err) {
      setError('Failed to detect anomalies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScatterData = () => {
    return performanceData.map((data, index) => ({
      accuracy: data.accuracy,
      speed: data.speed,
      isAnomaly: anomalies.includes(data),
    }));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Anomaly Detection
        </Typography>

        <Grid container spacing={3}>
          {/* Contamination Slider */}
          <Grid item xs={12}>
            <Typography gutterBottom>Contamination Factor: {contamination}</Typography>
            <Slider
              value={contamination}
              onChange={(_, value) => setContamination(value as number)}
              min={0.01}
              max={0.5}
              step={0.01}
              valueLabelDisplay="auto"
            />
          </Grid>

          {/* Performance Scatter Plot */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Performance Distribution
            </Typography>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="accuracy" name="Accuracy" unit="%" />
                  <YAxis type="number" dataKey="speed" name="Speed" unit=" m/s" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter
                    name="Normal"
                    data={getScatterData().filter((d) => !d.isAnomaly)}
                    fill="#8884d8"
                  />
                  <Scatter
                    name="Anomaly"
                    data={getScatterData().filter((d) => d.isAnomaly)}
                    fill="#ff7300"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* Anomalies Table */}
          {anomalies.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Detected Anomalies
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell align="right">Accuracy</TableCell>
                      <TableCell align="right">Speed</TableCell>
                      <TableCell align="right">Success Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {anomalies.map((anomaly, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(anomaly.timestamp).toLocaleTimeString()}</TableCell>
                        <TableCell align="right">{(anomaly.accuracy * 100).toFixed(1)}%</TableCell>
                        <TableCell align="right">{anomaly.speed.toFixed(1)}</TableCell>
                        <TableCell align="right">
                          {(anomaly.success_rate * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

          {/* Summary Alert */}
          {anomalies.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Detected {anomalies.length} anomalies in recent performance data.
              </Alert>
            </Grid>
          )}

          {/* Error Message */}
          {error && (
            <Grid item xs={12}>
              <Typography color="error">{error}</Typography>
            </Grid>
          )}

          {/* Loading Indicator */}
          {loading && (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};
