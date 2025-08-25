import { Diamond, Star } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useTournamentRewards } from '../hooks/useTournamentRewards';

interface TournamentRewardsProps {
  tournamentId: string;
}

const TournamentRewards: React.FC<TournamentRewardsProps> = ({
  tournamentId,
}) => {
  const navigate = useNavigate();
  const { tournament, loading, error } = useTournament(tournamentId);
  const {
    rewards,
    claimReward,
    loading: rewardsLoading,
    error: rewardsError,
  } = useTournamentRewards(tournamentId);
  const [tab, setTab] = React.useState(0);
  const [selectedReward, setSelectedReward] = React.useState<string | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      await claimReward(rewardId);
      setDialogOpen(true);
    } catch (err) {
      console.error('Failed to claim reward:', err);
    }
  };

  if (loading || rewardsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || rewardsError) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error || rewardsError}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Tournament Rewards
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournament Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trophy color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {rewards.availableRewards.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available Rewards
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Medal color="success" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {rewards.claimedRewards.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Claimed Rewards
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Diamond color="info" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {rewards.totalValue}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Star color="warning" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {rewards.ranking}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your Rank
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ p: 2 }}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<Trophy />} label="Available Rewards" />
          <Tab icon={<Medal />} label="Claimed Rewards" />
          <Tab icon={<Diamond />} label="Leaderboard" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {tab === 0 && (
          <Grid container spacing={3}>
            {rewards.availableRewards.map((reward) => (
              <Grid item xs={12} sm={6} md={4} key={reward.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">{reward.name}</Typography>
                      <Typography
                        variant="h6"
                        color={
                          reward.rarity === 'legendary'
                            ? 'error'
                            : reward.rarity === 'epic'
                              ? 'warning'
                              : 'primary'
                        }
                      >
                        {reward.rarity}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      {reward.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Value: {reward.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Required Score: {reward.requiredScore}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Available Until:{' '}
                        {new Date(reward.expiryDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleClaimReward(reward.id)}
                    disabled={
                      reward.claimed ||
                      new Date(reward.expiryDate) < new Date() ||
                      rewards.userScore < reward.requiredScore
                    }
                  >
                    {reward.claimed ? 'Claimed' : 'Claim Reward'}
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 1 && (
          <Grid container spacing={3}>
            {rewards.claimedRewards.map((reward) => (
              <Grid item xs={12} sm={6} md={4} key={reward.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">{reward.name}</Typography>
                      <Typography
                        variant="h6"
                        color={
                          reward.rarity === 'legendary'
                            ? 'error'
                            : reward.rarity === 'epic'
                              ? 'warning'
                              : 'primary'
                        }
                      >
                        {reward.rarity}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      {reward.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Value: {reward.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Claimed On:{' '}
                        {new Date(reward.claimedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    disabled
                  >
                    Claimed
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 2 && (
          <Grid container spacing={3}>
            {rewards.leaderboard.map((player, index) => (
              <Grid item xs={12} sm={6} md={4} key={player.userId}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">{player.username}</Typography>
                      <Typography
                        variant="h6"
                        color={
                          index === 0
                            ? 'error'
                            : index === 1
                              ? 'warning'
                              : 'primary'
                        }
                      >
                        #{index + 1}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      Score: {player.score}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Total Value: {player.totalValue}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Rewards: {player.rewards.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Team: {player.teamName}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Reward Claimed Successfully</DialogTitle>
        <DialogContent>
          <Typography>
            You have successfully claimed your reward! It will be added to your
            profile shortly.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentRewards;
