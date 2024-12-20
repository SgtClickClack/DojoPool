import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  RemoveCircle,
  Star,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { api } from '../../services/api';

const PredictorContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const MetricBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
}));

interface PerformancePrediction {
  skill_trend: {
    trend: 'improving_rapidly' | 'improving_steadily' | 'stable' | 'declining' | 'unknown';
    confidence: number;
  };
  potential_peak: {
    current_level: number;
    estimated_peak: number;
    confidence: number;
  };
  areas_for_improvement: Array<{
    aspect: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
}

export const PerformancePredictor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);

  useEffect(() => {
    fetchPrediction();
  }, []);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai/predict-performance');
      setPrediction(response.data);
    } catch (err) {
      setError('Failed to fetch performance prediction');
      console.error('Performance prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving_rapidly':
      case 'improving_steadily':
        return <TrendingUp color="success" />;
      case 'stable':
        return <RemoveCircle color="primary" />;
      case 'declining':
        return <TrendingDown color="error" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'primary';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!prediction) {
    return null;
  }

  return (
    <PredictorContainer elevation={3}>
      <Typography variant="h5" gutterBottom>
        Performance Analysis
      </Typography>

      <MetricBox>
        <Box display="flex" alignItems="center" mb={1}>
          {getTrendIcon(prediction.skill_trend.trend)}
          <Typography variant="h6" sx={{ ml: 1 }}>
            Skill Trend
          </Typography>
        </Box>
        <Typography variant="body1" color="textSecondary">
          {prediction.skill_trend.trend.replace('_', ' ').toUpperCase()}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Confidence: {(prediction.skill_trend.confidence * 100).toFixed(1)}%
        </Typography>
      </MetricBox>

      <MetricBox>
        <Box display="flex" alignItems="center" mb={1}>
          <Star color="primary" />
          <Typography variant="h6" sx={{ ml: 1 }}>
            Performance Potential
          </Typography>
        </Box>
        <Typography variant="body1">
          Current Level: {(prediction.potential_peak.current_level * 100).toFixed(1)}%
        </Typography>
        <Typography variant="body1">
          Estimated Peak: {(prediction.potential_peak.estimated_peak * 100).toFixed(1)}%
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Confidence: {(prediction.potential_peak.confidence * 100).toFixed(1)}%
        </Typography>
      </MetricBox>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Areas for Improvement
      </Typography>

      <List>
        {prediction.areas_for_improvement.map((area, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <CheckCircle color={getPriorityColor(area.priority) as any} />
            </ListItemIcon>
            <ListItemText
              primary={area.aspect.replace('_', ' ').toUpperCase()}
              secondary={
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    color={`${getPriorityColor(area.priority)}.main`}
                  >
                    {area.priority.toUpperCase()} PRIORITY
                  </Typography>
                  <br />
                  {area.suggestion}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </PredictorContainer>
  );
};

export default PerformancePredictor; 