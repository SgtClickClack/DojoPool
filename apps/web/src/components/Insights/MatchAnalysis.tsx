import { getMatchInsights } from '@/services/APIService';
import type { MatchInsightsResponseDto } from '@dojopool/shared';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

// Dynamic imports for charts to avoid SSR issues
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const RadarChart = dynamic(() => import('recharts').then((m) => m.RadarChart), {
  ssr: false,
});
const PolarGrid = dynamic(() => import('recharts').then((m) => m.PolarGrid), {
  ssr: false,
});
const PolarAngleAxis = dynamic(
  () => import('recharts').then((m) => m.PolarAngleAxis),
  { ssr: false }
);
const PolarRadiusAxis = dynamic(
  () => import('recharts').then((m) => m.PolarRadiusAxis),
  { ssr: false }
);
const Radar = dynamic(() => import('recharts').then((m) => m.Radar), {
  ssr: false,
});

interface MatchAnalysisProps {
  matchId: string;
}

const MatchAnalysis: React.FC<MatchAnalysisProps> = ({ matchId }) => {
  const [data, setData] = useState<MatchInsightsResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await getMatchInsights(matchId);
        setData(res);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [matchId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data) return null;

  // Mock performance metrics for visualization (in real implementation, this would come from the API)
  const performanceMetrics = [
    { skill: 'Accuracy', A: 85, B: 78, fullMark: 100 },
    { skill: 'Positioning', A: 82, B: 88, fullMark: 100 },
    { skill: 'Strategy', A: 90, B: 75, fullMark: 100 },
    { skill: 'Mental Game', A: 88, B: 82, fullMark: 100 },
    { skill: 'Consistency', A: 83, B: 86, fullMark: 100 },
  ];

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h4" fontWeight={700} color="primary">
            AI Match Analysis
          </Typography>
          <Box display="flex" gap={1}>
            {data.fallback && (
              <Chip label="Fallback Mode" color="warning" size="small" />
            )}
            <Chip
              label={`AI: ${data.provider.toUpperCase()}`}
              color="info"
              size="small"
            />
          </Box>
        </Box>

        {/* Match Info */}
        {data.match && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" color="text.secondary">
              {data.match.playerA?.username || 'Player A'} vs{' '}
              {data.match.playerB?.username || 'Player B'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.match.venue?.name || 'Unknown Venue'} • Round{' '}
              {data.match.round || 1}
            </Typography>
          </Box>
        )}

        {/* Score Overview */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold">
                  {data.match?.scoreA || 0}
                </Typography>
                <Typography variant="body2">
                  {data.match?.playerA?.username || 'Player A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="text.secondary">
                VS
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold">
                  {data.match?.scoreB || 0}
                </Typography>
                <Typography variant="body2">
                  {data.match?.playerB?.username || 'Player B'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Performance Radar Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight={600} mb={3}>
          Performance Comparison
        </Typography>
        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <RadarChart data={performanceMetrics}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Player A"
                dataKey="A"
                stroke="#2196f3"
                fill="#2196f3"
                fillOpacity={0.3}
              />
              <Radar
                name="Player B"
                dataKey="B"
                stroke="#f44336"
                fill="#f44336"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Analysis Sections */}
      <Grid container spacing={3}>
        {/* Key Moments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Key Moments
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {data.keyMoments.map((moment, index) => (
                  <Box component="li" key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">{moment}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Strategic Insights */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Strategic Insights
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {data.strategicInsights.map((insight, index) => (
                  <Box component="li" key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">{insight}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Player Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Player Performance
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {data.match?.playerA?.username || 'Player A'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {data.playerPerformanceA ||
                    'Performance analysis not available'}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {data.match?.playerB?.username || 'Player B'}
                </Typography>
                <Typography variant="body2">
                  {data.playerPerformanceB ||
                    'Performance analysis not available'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                AI Recommendations
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {data.recommendations.map((recommendation, index) => (
                  <Box component="li" key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">{recommendation}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Overall Assessment */}
        {data.overallAssessment && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Overall Assessment
                </Typography>
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                  {data.overallAssessment}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MatchAnalysis;
