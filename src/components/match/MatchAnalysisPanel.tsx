import {
  Assessment as AssessmentIcon,
  SportsEsports as KeyShotIcon,
  Person as PlayerIcon,
  TrendingUp as StrategyIcon,
  Lightbulb as TipIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Typography,
} from '@mui/material';
import React from 'react';

interface MatchAnalysis {
  keyMoments: string[];
  strategicInsights: string[];
  playerPerformance: {
    playerA: string;
    playerB: string;
  };
  overallAssessment: string;
  recommendations: string[];
}

interface MatchAnalysisPanelProps {
  aiAnalysisJson: string | null | undefined;
  isLoading?: boolean;
}

export const MatchAnalysisPanel: React.FC<MatchAnalysisPanelProps> = ({
  aiAnalysisJson,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Generating AI Analysis...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Our AI coach is analyzing your match performance
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!aiAnalysisJson) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            AI Analysis Not Available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Analysis will be generated after match completion
          </Typography>
        </CardContent>
      </Card>
    );
  }

  let analysis: MatchAnalysis;
  try {
    analysis = JSON.parse(aiAnalysisJson);
  } catch (error) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Alert severity="error">
            Failed to parse AI analysis data. Please try again later.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography
          variant="h5"
          component="h3"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <AssessmentIcon color="primary" />
          AI Match Analysis
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Key Moments Section */}
        {analysis.keyMoments && analysis.keyMoments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
            >
              <KeyShotIcon color="primary" />
              Key Moments
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {analysis.keyMoments.map((moment, index) => (
                <Chip
                  key={index}
                  label={moment}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Strategic Insights Section */}
        {analysis.strategicInsights &&
          analysis.strategicInsights.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <StrategyIcon color="primary" />
                Strategic Insights
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {analysis.strategicInsights.map((insight, index) => (
                  <Chip
                    key={index}
                    label={insight}
                    variant="outlined"
                    color="secondary"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}

        {/* Player Performance Section */}
        {analysis.playerPerformance && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
            >
              <PlayerIcon color="primary" />
              Player Performance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {analysis.playerPerformance.playerA && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Player A
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analysis.playerPerformance.playerA}
                  </Typography>
                </Box>
              )}
              {analysis.playerPerformance.playerB && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Player B
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analysis.playerPerformance.playerB}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Overall Assessment Section */}
        {analysis.overallAssessment && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
            >
              <AssessmentIcon color="primary" />
              Overall Assessment
            </Typography>
            <Typography variant="body1" color="text.primary">
              {analysis.overallAssessment}
            </Typography>
          </Box>
        )}

        {/* Recommendations Section */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <Box>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
            >
              <TipIcon color="primary" />
              Coach's Tips
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {analysis.recommendations.map((recommendation, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    {recommendation}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
