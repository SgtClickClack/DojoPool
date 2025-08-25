import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { MatchResultDialog } from '../components/Tournament/MatchResultDialog';
import { MatchAnalysisPanel } from '../components/match/MatchAnalysisPanel';
import type { MatchWithAnalysis } from '../types/match';

// Sample match data for demonstration
const sampleMatch: MatchWithAnalysis = {
  id: 'demo-match-1',
  tournamentId: 'demo-tournament-1',
  venueId: 'demo-venue-1',
  playerAId: 'player-a',
  playerBId: 'player-b',
  winnerId: 'player-a',
  loserId: 'player-b',
  scoreA: 9,
  scoreB: 6,
  round: 1,
  status: 'COMPLETED',
  startedAt: new Date('2024-12-19T10:00:00Z'),
  endedAt: new Date('2024-12-19T11:30:00Z'),
  tableId: 'table-1',
  aiAnalysisJson: JSON.stringify({
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
  }),
  createdAt: new Date('2024-12-19T09:00:00Z'),
  updatedAt: new Date('2024-12-19T11:30:00Z'),
  playerA: {
    id: 'player-a',
    username: 'PoolMaster',
  },
  playerB: {
    id: 'player-b',
    username: 'CueArtist',
  },
  venue: {
    id: 'demo-venue-1',
    name: 'The Golden Cue',
  },
  tournament: {
    id: 'demo-tournament-1',
    name: 'Winter Championship 2024',
  },
};

export default function MatchDemoPage() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Match Result & AI Analysis Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        This page demonstrates the complete match result display with AI-powered
        analysis integration.
      </Typography>

      <Grid container spacing={4}>
        {/* Match Summary Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Match Summary
              </Typography>

              <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                {/* Player A */}
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1 }}>
                      P
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {sampleMatch.playerA?.username}
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {sampleMatch.scoreA}
                    </Typography>
                    <Chip label="Winner" color="success" size="small" />
                  </Box>
                </Grid>

                {/* VS */}
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="text.secondary">
                      VS
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Round {sampleMatch.round}
                    </Typography>
                    <Chip
                      label={sampleMatch.status}
                      color="success"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>

                {/* Player B */}
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1 }}>
                      C
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {sampleMatch.playerB?.username}
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {sampleMatch.scoreB}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Venue:</strong> {sampleMatch.venue?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Tournament:</strong> {sampleMatch.tournament?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Started:</strong>{' '}
                    {sampleMatch.startedAt?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Ended:</strong>{' '}
                    {sampleMatch.endedAt?.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => setShowDialog(true)}
                  size="large"
                >
                  View Full Match Result
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Analysis Preview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                AI Analysis Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The AI analysis provides insights into key moments, strategic
                decisions, and improvement recommendations.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip label="Key Moments" color="primary" variant="outlined" />
                <Chip
                  label="Strategic Insights"
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  label="Player Performance"
                  color="info"
                  variant="outlined"
                />
                <Chip label="Coach's Tips" color="success" variant="outlined" />
              </Box>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Sample Insight:</strong> "Player A showed excellent
                defensive play and composure under pressure, while Player B
                struggled with long shots in key moments."
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Click "View Full Match Result" to see the complete AI analysis
                with detailed breakdowns and recommendations.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Analysis Panel */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Complete AI Analysis
        </Typography>
        <MatchAnalysisPanel
          aiAnalysisJson={sampleMatch.aiAnalysisJson}
          isLoading={false}
        />
      </Box>

      {/* Match Result Dialog */}
      <MatchResultDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        match={sampleMatch}
      />
    </Container>
  );
}
