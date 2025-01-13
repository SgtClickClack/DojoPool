import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import { MLService } from '../../services/ml.service';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PatternRecognitionProps {
  modelId: string | null;
  onPatternDetected: (pattern: any) => void;
}

const mlService = new MLService();

export const PatternRecognition: React.FC<PatternRecognitionProps> = ({
  modelId,
  onPatternDetected,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [recentShots, setRecentShots] = useState<any[]>([]);
  const [patternScores, setPatternScores] = useState<number[]>([]);

  useEffect(() => {
    // Simulate receiving real-time shot data
    const interval = setInterval(() => {
      const newShot = generateRandomShot();
      setRecentShots((prev) => [...prev.slice(-9), newShot]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (recentShots.length >= 10) {
      detectPattern();
    }
  }, [recentShots, modelId]);

  const generateRandomShot = () => {
    const shotTypes = ['straight', 'spin', 'curve', 'lob', 'slice'];
    return {
      type: shotTypes[Math.floor(Math.random() * shotTypes.length)],
      position: {
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100,
      },
      speed: Math.random() * 100,
      spin: Math.random() * 100,
      timestamp: new Date().toISOString(),
    };
  };

  const detectPattern = async () => {
    if (!modelId) {
      setError('No model selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const transformedData = mlService.transformSequenceData(recentShots);
      const response = await mlService.predictNextPattern(modelId, transformedData);

      const newPattern = {
        timestamp: new Date().toISOString(),
        score: response.data.pattern_score,
        is_anomaly: response.data.is_anomaly,
        shots: [...recentShots],
      };

      setPatterns((prev) => [...prev.slice(-4), newPattern]);
      setPatternScores((prev) => [...prev.slice(-9), response.data.pattern_score]);
      onPatternDetected(newPattern);
    } catch (err) {
      setError('Failed to detect pattern');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Pattern Recognition
        </Typography>

        <Grid container spacing={3}>
          {/* Recent Shots */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Recent Shots
            </Typography>
            <List dense>
              {recentShots.map((shot, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={`Shot ${index + 1}: ${shot.type}`}
                      secondary={`Speed: ${shot.speed.toFixed(1)}, Spin: ${shot.spin.toFixed(1)}`}
                    />
                  </ListItem>
                  {index < recentShots.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Grid>

          {/* Pattern Scores Chart */}
          {patternScores.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Pattern Scores Over Time
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={patternScores.map((score, index) => ({
                      index,
                      score,
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          )}

          {/* Detected Patterns */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Detected Patterns
            </Typography>
            {patterns.map((pattern, index) => (
              <Box key={index} mb={2}>
                <Alert severity={pattern.is_anomaly ? 'warning' : 'info'} sx={{ mb: 1 }}>
                  {pattern.is_anomaly ? 'Anomalous Pattern Detected' : 'Normal Pattern Detected'}
                </Alert>
                <Typography variant="body2" color="textSecondary">
                  Pattern Score: {pattern.score.toFixed(3)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Detected at: {new Date(pattern.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            ))}
          </Grid>

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
