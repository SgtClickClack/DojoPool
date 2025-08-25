import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { MatchAnalysisPanel } from '../components/match/MatchAnalysisPanel';

// Sample AI analysis data for testing
const sampleAnalysisData = {
  keyMoments: [
    'Player A made a crucial bank shot in the 8th frame',
    'Player B missed an easy 9-ball in the 12th frame',
    'Player A executed a perfect safety shot in the 15th frame',
  ],
  strategicInsights: [
    'Player A showed excellent defensive play',
    'Player B struggled with long shots under pressure',
    'The match was decided by safety shot execution',
  ],
  playerPerformance: {
    playerA:
      'Demonstrated consistent shot-making and excellent safety play. Showed composure under pressure.',
    playerB:
      'Strong offensive game but struggled with defensive shots. Made some unforced errors in key moments.',
  },
  overallAssessment:
    "A high-quality match that showcased both players' strengths. Player A's superior safety game and composure under pressure were the deciding factors.",
  recommendations: [
    'Player B should practice defensive shots and safety play',
    'Player A could work on offensive shot selection to close out frames faster',
    'Both players should focus on maintaining consistency throughout long matches',
  ],
};

export default function MatchAnalysisTestPage() {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleShowAnalysis = () => {
    setShowAnalysis(true);
  };

  const handleSimulateLoading = () => {
    setIsLoading(true);
    setShowAnalysis(false);
    setTimeout(() => {
      setIsLoading(false);
      setShowAnalysis(true);
    }, 3000);
  };

  const handleReset = () => {
    setShowAnalysis(false);
    setIsLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Match Analysis Panel Test
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        This page demonstrates the MatchAnalysisPanel component with different
        states and sample data.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Controls
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleShowAnalysis}
                  disabled={showAnalysis || isLoading}
                >
                  Show Analysis
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleSimulateLoading}
                  disabled={isLoading}
                >
                  Simulate Loading
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sample Match Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Player A vs Player B
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Score: 9 - 6
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Analysis Panel */}
      <MatchAnalysisPanel
        aiAnalysisJson={
          showAnalysis ? JSON.stringify(sampleAnalysisData) : null
        }
        isLoading={isLoading}
      />

      {showAnalysis && (
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Raw Analysis Data
              </Typography>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: '16px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                }}
              >
                {JSON.stringify(sampleAnalysisData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
}
