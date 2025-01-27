import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PhotoCamera } from '@mui/icons-material';
import { api } from '../../services/api';

const AnalyzerContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const MetricsContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: theme.palette.background.default,
}));

const Input = styled('input')({
  display: 'none',
});

interface ShotMetrics {
  velocity: number;
  spin: number;
  accuracy: number;
}

interface ShotAnalysis {
  success: boolean;
  error?: string;
  metrics?: ShotMetrics;
  recommendations?: string[];
}

export const ShotAnalyzer: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ShotAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('frames', file);
      });

      const response = await api.post('/ai/analyze-shot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysis(response.data);
    } catch (err) {
      setError('Failed to analyze shot. Please try again.');
      console.error('Shot analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const renderMetrics = (metrics: ShotMetrics) => (
    <MetricsContainer>
      <MetricCard elevation={2}>
        <Typography variant="h6" color="primary">
          Velocity
        </Typography>
        <Typography variant="h4">{metrics.velocity.toFixed(1)}</Typography>
        <Typography variant="body2" color="textSecondary">
          m/s
        </Typography>
      </MetricCard>

      <MetricCard elevation={2}>
        <Typography variant="h6" color="primary">
          Spin
        </Typography>
        <Typography variant="h4">{(metrics.spin * 100).toFixed(1)}</Typography>
        <Typography variant="body2" color="textSecondary">
          %
        </Typography>
      </MetricCard>

      <MetricCard elevation={2}>
        <Typography variant="h6" color="primary">
          Accuracy
        </Typography>
        <Typography variant="h4">{(metrics.accuracy * 100).toFixed(1)}</Typography>
        <Typography variant="body2" color="textSecondary">
          %
        </Typography>
      </MetricCard>
    </MetricsContainer>
  );

  return (
    <AnalyzerContainer elevation={3}>
      <Typography variant="h5" gutterBottom>
        Shot Analysis
      </Typography>

      <Box sx={{ mb: 3 }}>
        <label htmlFor="shot-upload">
          <Input
            accept="image/*"
            id="shot-upload"
            multiple
            type="file"
            onChange={handleFileUpload}
            disabled={analyzing}
          />
          <Button
            variant="contained"
            component="span"
            startIcon={<PhotoCamera />}
            disabled={analyzing}
          >
            Upload Shot Sequence
          </Button>
        </label>
      </Box>

      {analyzing && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {analysis && analysis.success && analysis.metrics && (
        <>
          {renderMetrics(analysis.metrics)}

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Recommendations
          </Typography>

          <List>
            {analysis.recommendations?.map((recommendation, index) => (
              <ListItem key={index}>
                <ListItemText primary={recommendation} />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </AnalyzerContainer>
  );
};

export default ShotAnalyzer;
