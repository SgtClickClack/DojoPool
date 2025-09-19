import ChallengeNotification from '@/components/challenge/ChallengeNotification';
import { type Challenge } from '@/services/challengeService';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { useState } from 'react';

export default function ChallengeDemoPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: 'demo1',
      challengerId: 'player1',
      challengerUsername: 'SgtClickClack',
      challengedId: 'current_user',
      challengedUsername: 'CurrentUser',
      wagerAmount: 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo2',
      challengerId: 'player2',
      challengerUsername: 'RyuKlaw',
      challengedId: 'current_user',
      challengedUsername: 'CurrentUser',
      wagerAmount: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo3',
      challengerId: 'player3',
      challengerUsername: 'ShadowStriker',
      challengedId: 'current_user',
      challengedUsername: 'CurrentUser',
      wagerAmount: 500,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const handleChallengeAccepted = (challenge: Challenge) => {
    setChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
    console.log('Challenge accepted:', challenge);
  };

  const handleChallengeDeclined = (challenge: Challenge) => {
    setChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
    console.log('Challenge declined:', challenge);
  };

  const addRandomChallenge = () => {
    const wagerAmounts = [0, 50, 100, 200, 500];
    const usernames = [
      'PoolMaster',
      'CueArtist',
      'BreakKing',
      'SafetyFirst',
      'BankShot',
    ];

    const newChallenge: Challenge = {
      id: `demo_${Date.now()}`,
      challengerId: `player_${Date.now()}`,
      challengerUsername:
        usernames[Math.floor(Math.random() * usernames.length)],
      challengedId: 'current_user',
      challengedUsername: 'CurrentUser',
      wagerAmount:
        wagerAmounts[Math.floor(Math.random() * wagerAmounts.length)],
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    setChallenges((prev) => [newChallenge, ...prev]);
  };

  const clearAllChallenges = () => {
    setChallenges([]);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        🎯 Challenge Notification Demo
      </Typography>

      <Typography
        variant="h6"
        color="text.secondary"
        align="center"
        sx={{ mb: 4 }}
      >
        This page demonstrates the challenge notification system with wager
        support
      </Typography>

      {/* Demo Controls */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Demo Controls
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            color="primary"
            onClick={addRandomChallenge}
          >
            Add Random Challenge
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={clearAllChallenges}
          >
            Clear All Challenges
          </Button>
        </Box>
      </Paper>

      {/* Challenge Notifications */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
        }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            Incoming Challenges ({challenges.length})
          </Typography>

          {challenges.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No pending challenges
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use the demo controls above to add some challenge notifications
              </Typography>
            </Paper>
          ) : (
            challenges.map((challenge) => (
              <ChallengeNotification
                key={challenge.id}
                challenge={challenge}
                onChallengeAccepted={handleChallengeAccepted}
                onChallengeDeclined={handleChallengeDeclined}
              />
            ))
          )}
        </Box>

        {/* Demo Information */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>

              <Typography variant="body2" paragraph>
                <strong>Friendly Matches:</strong> No wager involved, just for
                fun and ranking.
              </Typography>

              <Typography variant="body2" paragraph>
                <strong>Wager Matches:</strong> Both players bet DojoCoins.
                Winner takes the pot.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Challenge Flow:
              </Typography>
              <Box component="ol" sx={{ m: 0, pl: '1.2rem' }}>
                <li>Player sends challenge with optional wager</li>
                <li>Challenged player receives notification</li>
                <li>If wager involved, confirmation dialog appears</li>
                <li>Upon acceptance, match is created</li>
                <li>Winner receives DojoCoins</li>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}
