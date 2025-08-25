import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useChallenge } from '../contexts/ChallengeContext';
import { useNotifications } from '../hooks/[NOTIFY]useNotifications';
import { sendChallenge } from '../services/APIService';

const ChallengeDemoPage: React.FC = () => {
  const [defenderId, setDefenderId] = useState('user2');
  const [stakeCoins, setStakeCoins] = useState(100);
  const [loading, setLoading] = useState(false);
  const { challenges, addChallenge } = useChallenge();
  const { addNotification } = useNotifications();

  const handleSendChallenge = async () => {
    if (!defenderId.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a defender ID',
      });
      return;
    }

    setLoading(true);
    try {
      const challenge = await sendChallenge(defenderId, stakeCoins);

      // Add to local state
      addChallenge({
        id: challenge.id,
        challengerId: 'current-user',
        defenderId: challenge.defenderId,
        status: challenge.status,
        stakeCoins: challenge.stakeCoins,
        createdAt: challenge.createdAt,
        updatedAt: challenge.updatedAt,
      });

      addNotification({
        type: 'success',
        title: 'Challenge Sent!',
        message: `Challenge sent to ${defenderId} for ${stakeCoins} coins`,
      });

      setDefenderId('');
      setStakeCoins(100);
    } catch (error) {
      console.error('Error sending challenge:', error);
      addNotification({
        type: 'error',
        title: 'Challenge Failed',
        message: 'Failed to send challenge. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
        return 'success';
      case 'DECLINED':
        return 'error';
      case 'EXPIRED':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Challenge System Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Test the real-time player challenge system. Send challenges and see
        real-time updates.
      </Typography>

      <Grid container spacing={4}>
        {/* Challenge Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Send a Challenge
              </Typography>
              <Stack spacing={3}>
                <TextField
                  label="Defender ID"
                  value={defenderId}
                  onChange={(e) => setDefenderId(e.target.value)}
                  placeholder="Enter player ID to challenge"
                  fullWidth
                />
                <TextField
                  label="Stake Coins"
                  type="number"
                  value={stakeCoins}
                  onChange={(e) => setStakeCoins(Number(e.target.value))}
                  fullWidth
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendChallenge}
                  disabled={loading}
                  size="large"
                >
                  {loading ? 'Sending...' : '🎯 Send Challenge'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Challenge Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Challenge Status
              </Typography>
              <Stack spacing={2}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Total Challenges:</Typography>
                  <Chip label={challenges.length} color="primary" />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Pending:</Typography>
                  <Chip
                    label={
                      challenges.filter((c) => c.status === 'PENDING').length
                    }
                    color="warning"
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Accepted:</Typography>
                  <Chip
                    label={
                      challenges.filter((c) => c.status === 'ACCEPTED').length
                    }
                    color="success"
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Declined:</Typography>
                  <Chip
                    label={
                      challenges.filter((c) => c.status === 'DECLINED').length
                    }
                    color="error"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Challenge List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Challenges
              </Typography>
              {challenges.length === 0 ? (
                <Alert severity="info">
                  No challenges yet. Send your first challenge above!
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {challenges.map((challenge) => (
                    <Box
                      key={challenge.id}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      p={2}
                      bgcolor="background.paper"
                      borderRadius={1}
                      border="1px solid"
                      borderColor="divider"
                    >
                      <Box>
                        <Typography variant="subtitle2">
                          {challenge.challengerId === 'current-user'
                            ? 'You'
                            : challenge.challengerId}{' '}
                          vs{' '}
                          {challenge.defenderId === 'current-user'
                            ? 'You'
                            : challenge.defenderId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stakes: {challenge.stakeCoins} coins • Created:{' '}
                          {new Date(challenge.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={challenge.status}
                        color={getStatusColor(challenge.status) as any}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Instructions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How to Test
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                1. Send a challenge to another user (e.g., "user2")
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                2. The challenge will be sent to the backend and stored
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                3. In a real scenario, the challenged user would receive a
                real-time notification
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                4. The challenged user can accept or decline the challenge
              </Typography>
              <Typography variant="body2" color="text.secondary">
                5. Both users will see real-time updates to the challenge status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChallengeDemoPage;
