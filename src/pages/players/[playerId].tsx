import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useChallenge } from '../../contexts/ChallengeContext';
import { useNotifications } from '../../hooks/[NOTIFY]useNotifications';
import { useFriendship } from '../../hooks/useFriendship';
import { sendChallenge } from '../../services/APIService';

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
  const { playerId } = router.query;
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [challengeSent, setChallengeSent] = useState(false);
  const { addNotification } = useNotifications();
  const { challenges } = useChallenge();

  // Mock current user ID - in real app, get from auth context
  const currentUserId = 'current-user';

  // Check friendship status
  const {
    isFriend,
    hasPendingRequest,
    canSendRequest,
    loading: friendshipLoading,
  } = useFriendship(currentUserId, playerId as string);

  // Mock player data - in real app, fetch from API
  useEffect(() => {
    if (playerId) {
      // Simulate API call
      setTimeout(() => {
        setPlayer({
          id: playerId as string,
          username: `Player_${playerId}`,
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${playerId}`,
          skillRating: Math.floor(Math.random() * 1000) + 500,
          clanTitle: 'Crimson Monkey',
          stats: {
            wins: Math.floor(Math.random() * 50) + 10,
            losses: Math.floor(Math.random() * 30) + 5,
          },
          achievements: [
            { id: '1', name: 'First Win', description: 'Win your first match' },
            {
              id: '2',
              name: 'Territory Master',
              description: 'Control 5 territories',
            },
          ],
        });
        setLoading(false);
      }, 500);
    }
  }, [playerId]);

  const handleChallenge = async () => {
    if (!player) return;

    try {
      await sendChallenge(player.id, 100); // Default stake of 100 coins
      setChallengeSent(true);
      addNotification({
        type: 'success',
        title: 'Challenge Sent!',
        message: `Challenge sent to ${player.username}`,
      });
    } catch (error) {
      console.error('Error sending challenge:', error);
      addNotification({
        type: 'error',
        title: 'Challenge Failed',
        message: 'Failed to send challenge. Please try again.',
      });
    }
  };

  const hasPendingChallenge = challenges.some(
    (challenge) =>
      (challenge.challengerId === currentUserId &&
        challenge.defenderId === playerId) ||
      (challenge.defenderId === currentUserId &&
        challenge.challengerId === playerId)
  );

  if (loading || friendshipLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading player profile...</Typography>
      </Container>
    );
  }

  if (!player) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Player not found</Alert>
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

                {/* Challenge Button - Only visible for friends */}
                {isFriend && (
                  <Box>
                    {challengeSent ? (
                      <Chip label="Challenge Sent" color="info" />
                    ) : hasPendingChallenge ? (
                      <Chip label="Challenge Pending" color="warning" />
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleChallenge}
                        disabled={challengeSent}
                      >
                        🎯 Challenge Player
                      </Button>
                    )}
                  </Box>
                )}

                {/* Friendship Status Display */}
                {!isFriend && (
                  <Box>
                    {hasPendingRequest ? (
                      <Chip
                        label="Friend Request Pending"
                        color="warning"
                        variant="outlined"
                      />
                    ) : canSendRequest ? (
                      <Button
                        variant="outlined"
                        color="primary"
                        size="large"
                        onClick={() => {
                          addNotification({
                            type: 'info',
                            title: 'Friend Request Required',
                            message:
                              'You must be friends with this player to challenge them.',
                          });
                        }}
                      >
                        👥 Send Friend Request
                      </Button>
                    ) : (
                      <Chip
                        label="Not Friends"
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </Box>
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

        {/* Challenge History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Challenges
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {challenges.length === 0 ? (
                <Typography color="text.secondary">
                  No recent challenges
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {challenges.slice(0, 5).map((challenge) => (
                    <Box
                      key={challenge.id}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      p={1}
                      bgcolor="background.paper"
                      borderRadius={1}
                    >
                      <Typography>
                        {challenge.challengerId === currentUserId
                          ? 'You'
                          : 'Opponent'}{' '}
                        vs{' '}
                        {challenge.defenderId === currentUserId
                          ? 'You'
                          : 'Opponent'}
                      </Typography>
                      <Chip
                        label={challenge.status}
                        color={
                          challenge.status === 'ACCEPTED'
                            ? 'success'
                            : challenge.status === 'DECLINED'
                            ? 'error'
                            : 'warning'
                        }
                        size="small"
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PlayerProfilePage;
