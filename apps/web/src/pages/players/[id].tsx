import ChallengeModal from '@/components/challenge/ChallengeModal';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/APIService';
import { Challenge } from '@/services/challengeService';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import useSWR from 'swr';

interface PlayerProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  skillRating: number;
  clanTitle?: string;
  stats: {
    wins: number;
    losses: number;
  };
  achievements: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

const PlayerProfilePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  type NotificationState = {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  };
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const fetcher = (url: string) =>
    api.get(url).then((res) => res.data as PlayerProfile);

  const {
    data: player,
    error,
    isLoading,
  } = useSWR<PlayerProfile>(() => (id ? `/v1/users/${id}` : null), fetcher);

  const handleChallengeClick = () => {
    if (!user) {
      setNotification({
        open: true,
        message: 'You must be logged in to challenge players',
        severity: 'error',
      });
      return;
    }

    if (user.id === player?.id) {
      setNotification({
        open: true,
        message: 'You cannot challenge yourself',
        severity: 'error',
      });
      return;
    }

    setChallengeModalOpen(true);
  };

  const handleChallengeSent = (challenge: Challenge) => {
    const wagerText = challenge.wagerAmount
      ? ` for ${challenge.wagerAmount} DojoCoins`
      : '';

    setNotification({
      open: true,
      message: `Challenge sent to ${player?.username}${wagerText}!`,
      severity: 'success',
    });
  };

  const handleCloseNotification = () => {
    setNotification((prev: NotificationState) => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading player profile...</Typography>
      </Container>
    );
  }

  if (error || !player) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">Failed to load player profile</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Player Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar src={player.avatarUrl} sx={{ width: 80, height: 80 }} />
                <Box flex={1}>
                  <Typography variant="h4" gutterBottom>
                    {player.username}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                      label={`Rating: ${player.skillRating}`}
                      color="primary"
                    />
                    {player.clanTitle && (
                      <Chip label={player.clanTitle} variant="outlined" />
                    )}
                  </Stack>
                </Box>

                {/* Challenge Button */}
                {user && user.id !== player.id && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleChallengeClick}
                    sx={{ minWidth: 140 }}
                  >
                    🎯 Challenge Player
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Player Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Wins:</Typography>
                  <Typography variant="h6" color="success.main">
                    {player.stats.wins}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Losses:</Typography>
                  <Typography variant="h6" color="error.main">
                    {player.stats.losses}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Win Rate:</Typography>
                  <Typography variant="h6">
                    {Math.round(
                      (player.stats.wins /
                        (player.stats.wins + player.stats.losses)) *
                        100
                    )}
                    %
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Achievements
              </Typography>
              <Stack spacing={1}>
                {player.achievements.map((achievement) => (
                  <Chip
                    key={achievement.id}
                    label={achievement.name}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Challenge Modal */}
      <ChallengeModal
        open={challengeModalOpen}
        onClose={() => setChallengeModalOpen(false)}
        challengedPlayerId={player.id}
        challengedPlayerName={player.username}
        onChallengeSent={handleChallengeSent}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PlayerProfilePage;
