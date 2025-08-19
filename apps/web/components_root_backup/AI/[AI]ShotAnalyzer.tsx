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
import axios from 'axios';

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
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ShotAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('shot_video', file);

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/api/ai/analyze-shot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAnalysis(response.data);
    } catch (err) {
      setError(
        'Failed to analyze shot. Please try again with a different video.'
      );
      console.error('Error analyzing shot:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderMetrics = (metrics: ShotMetrics) => (
    <MetricsContainer>
      <MetricCard>
        <Typography variant="h6" gutterBottom>
          Velocity
        </Typography>
        <Typography variant="h4" color="primary">
          {metrics.velocity.toFixed(1)}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          mph
        </Typography>
      </MetricCard>
      <MetricCard>
        <Typography variant="h6" gutterBottom>
          Spin
        </Typography>
        <Typography variant="h4" color="primary">
          {metrics.spin.toFixed(1)}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          rpm
        </Typography>
      </MetricCard>
      <MetricCard>
        <Typography variant="h6" gutterBottom>
          Accuracy
        </Typography>
        <Typography variant="h4" color="primary">
          {(metrics.accuracy * 100).toFixed(1)}%
        </Typography>
      </MetricCard>
    </MetricsContainer>
  );

  return (
    <AnalyzerContainer>
      <Typography variant="h5" gutterBottom>
        Shot Analysis
      </Typography>

      <Box display="flex" justifyContent="center" mb={3}>
        <label htmlFor="shot-video-upload">
          <Input
            accept="video/*"
            id="shot-video-upload"
            type="file"
            onChange={handleFileUpload}
            disabled={loading}
          />
          <Button
            variant="contained"
            component="span"
            startIcon={<PhotoCamera />}
            disabled={loading}
          >
            Upload Shot Video
          </Button>
        </label>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {analysis && !loading && (
        <>
          {analysis.metrics && renderMetrics(analysis.metrics)}

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <List>
                {analysis.recommendations.map((recommendation, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                    {index < analysis.recommendations.length - 1 && (
                      <Divider component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </>
          )}
        </>
      )}
    </AnalyzerContainer>
  );
};

export default ShotAnalyzer;
