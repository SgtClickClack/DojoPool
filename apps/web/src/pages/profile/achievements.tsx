import { apiClient } from '@/services/APIService';
import {
  CardGiftcard as GiftIcon,
  LocationOn as LocationIcon,
  Lock as LockIcon,
  SportsSoccer as MatchIcon,
  People as PeopleIcon,
  Star as StarIcon,
  ShoppingCart as TradeIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as UnlockedIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

interface AchievementProgress {
  achievementId: string;
  userId: string;
  currentProgress: number;
  maxProgress: number;
  status: 'LOCKED' | 'UNLOCKED' | 'CLAIMED';
  unlockedAt?: string;
  claimedAt?: string;
}

interface Achievement {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  iconUrl?: string;
  isHidden: boolean;
  criteriaType: string;
  criteriaValue: number;
}

interface UserStats {
  totalAchievements: number;
  unlockedAchievements: number;
  claimedRewards: number;
}

const Achievements: React.FC = () => {
  const router = useRouter();
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAchievement, setSelectedAchievement] =
    useState<AchievementProgress | null>(null);
  const [claimingReward, setClaimingReward] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimResult, setClaimResult] = useState<any>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const [achievementsResponse, statsResponse] = await Promise.all([
        apiClient.get('/achievements'),
        apiClient.get('/achievements/stats'),
      ]);

      setAchievements(achievementsResponse.data);
      setUserStats(statsResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (achievementId: string) => {
    try {
      setClaimingReward(true);
      const response = await apiClient.post(
        `/achievements/${achievementId}/claim-reward`
      );
      setClaimResult(response.data);

      // Refresh achievements data
      await loadAchievements();

      setShowClaimDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to claim reward');
    } finally {
      setClaimingReward(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'VENUE_VISITS':
        return <LocationIcon />;
      case 'MATCHES_WON':
      case 'MATCHES_PLAYED':
        return <MatchIcon />;
      case 'TERRITORY_CONTROL':
        return <TrophyIcon />;
      case 'SOCIAL_INTERACTION':
      case 'CLAN_ACTIVITY':
        return <PeopleIcon />;
      case 'TRADING':
        return <TradeIcon />;
      case 'PROGRESSION':
        return <StarIcon />;
      default:
        return <TrophyIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'VENUE_VISITS':
        return '#4CAF50';
      case 'MATCHES_WON':
      case 'MATCHES_PLAYED':
        return '#FF9800';
      case 'TERRITORY_CONTROL':
        return '#9C27B0';
      case 'SOCIAL_INTERACTION':
      case 'CLAN_ACTIVITY':
        return '#2196F3';
      case 'TRADING':
        return '#FF5722';
      case 'PROGRESSION':
        return '#FFC107';
      default:
        return '#607D8B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UNLOCKED':
        return <UnlockedIcon sx={{ color: '#4CAF50' }} />;
      case 'CLAIMED':
        return <GiftIcon sx={{ color: '#9C27B0' }} />;
      case 'LOCKED':
        return <LockIcon sx={{ color: '#757575' }} />;
      default:
        return <LockIcon sx={{ color: '#757575' }} />;
    }
  };

  const getProgressPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const filterAchievementsByStatus = (status: string) => {
    return achievements.filter((achievement) => achievement.status === status);
  };

  const filterAchievementsByCategory = (category: string) => {
    // This would need to be implemented with achievement category data
    // For now, return all achievements
    return achievements;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ color: 'primary.main', fontWeight: 'bold' }}
      >
        Achievements & Rewards
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      {userStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <TrophyIcon sx={{ fontSize: 48, mb: 2, color: '#FFD700' }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {userStats.unlockedAchievements}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Unlocked Achievements
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <GiftIcon sx={{ fontSize: 48, mb: 2, color: '#4CAF50' }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {userStats.claimedRewards}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Rewards Claimed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <StarIcon sx={{ fontSize: 48, mb: 2, color: '#2196F3' }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {userStats.totalAchievements}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Total Achievements
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Achievement Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All (${achievements.length})`} />
          <Tab
            label={`Locked (${filterAchievementsByStatus('LOCKED').length})`}
          />
          <Tab
            label={`Unlocked (${filterAchievementsByStatus('UNLOCKED').length})`}
          />
          <Tab
            label={`Claimed (${filterAchievementsByStatus('CLAIMED').length})`}
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {achievements
              .filter((achievement) => {
                if (activeTab === 0) return true; // All
                if (activeTab === 1) return achievement.status === 'LOCKED';
                if (activeTab === 2) return achievement.status === 'UNLOCKED';
                if (activeTab === 3) return achievement.status === 'CLAIMED';
                return true;
              })
              .map((achievement) => (
                <Grid
                  item
                  xs={12}
                  md={6}
                  lg={4}
                  key={achievement.achievementId}
                >
                  <Card
                    sx={{
                      height: '100%',
                      background:
                        achievement.status === 'UNLOCKED'
                          ? 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)'
                          : achievement.status === 'CLAIMED'
                            ? 'linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%)'
                            : 'linear-gradient(135deg, #424242 0%, #616161 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        transform:
                          achievement.status !== 'LOCKED'
                            ? 'translateY(-4px)'
                            : 'none',
                        transition: 'all 0.3s ease',
                      },
                    }}
                  >
                    {/* Status Badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        zIndex: 1,
                      }}
                    >
                      <Badge
                        badgeContent={getStatusIcon(achievement.status)}
                        sx={{
                          '& .MuiBadge-badge': {
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                        }}
                      />
                    </Box>

                    <CardContent sx={{ pb: 1 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar
                          sx={{
                            bgcolor: getCategoryColor('VENUE_VISITS'), // Default color
                            mr: 2,
                            width: 48,
                            height: 48,
                          }}
                        >
                          <TrophyIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 'bold', mb: 0.5 }}
                          >
                            Achievement Name
                          </Typography>
                          <Chip
                            label="Category"
                            size="small"
                            sx={{
                              background: getCategoryColor('VENUE_VISITS'),
                              color: 'white',
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                        Achievement description goes here
                      </Typography>

                      {/* Progress Bar */}
                      {achievement.status === 'LOCKED' &&
                        achievement.maxProgress > 1 && (
                          <Box sx={{ mb: 2 }}>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              mb={1}
                            >
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Progress
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {achievement.currentProgress} /{' '}
                                {achievement.maxProgress}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={getProgressPercentage(
                                achievement.currentProgress,
                                achievement.maxProgress
                              )}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                background: 'rgba(255,255,255,0.2)',
                                '& .MuiLinearProgress-bar': {
                                  background:
                                    'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                },
                              }}
                            />
                          </Box>
                        )}

                      {/* Status Information */}
                      {achievement.unlockedAt && (
                        <Typography
                          variant="body2"
                          sx={{ opacity: 0.7, fontSize: '0.75rem' }}
                        >
                          Unlocked:{' '}
                          {new Date(
                            achievement.unlockedAt
                          ).toLocaleDateString()}
                        </Typography>
                      )}

                      {achievement.claimedAt && (
                        <Typography
                          variant="body2"
                          sx={{ opacity: 0.7, fontSize: '0.75rem' }}
                        >
                          Claimed:{' '}
                          {new Date(achievement.claimedAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </CardContent>

                    <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                      {achievement.status === 'UNLOCKED' && (
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<GiftIcon />}
                          onClick={() =>
                            handleClaimReward(achievement.achievementId)
                          }
                          disabled={claimingReward}
                          sx={{
                            background:
                              'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
                            color: 'white',
                            '&:hover': {
                              background:
                                'linear-gradient(45deg, #F7931E 30%, #FF6B35 90%)',
                            },
                          }}
                        >
                          {claimingReward ? 'Claiming...' : 'Claim Reward'}
                        </Button>
                      )}

                      {achievement.status === 'CLAIMED' && (
                        <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            ✅ Reward Claimed
                          </Typography>
                        </Box>
                      )}

                      {achievement.status === 'LOCKED' && (
                        <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>
                          <Typography variant="body2" sx={{ opacity: 0.6 }}>
                            🔒 Locked
                          </Typography>
                        </Box>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {achievements.length === 0 && (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              <TrophyIcon
                sx={{ fontSize: 64, mb: 2, color: 'rgba(255,255,255,0.3)' }}
              />
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                No achievements yet
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Start playing to unlock your first achievement!
              </Typography>
            </Paper>
          )}
        </Box>
      </Paper>

      {/* Reward Claim Dialog */}
      <Dialog
        open={showClaimDialog}
        onClose={() => setShowClaimDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white',
          }}
        >
          🎉 Reward Claimed!
        </DialogTitle>
        <DialogContent sx={{ background: '#0f0f23', color: 'white' }}>
          {claimResult && (
            <Box textAlign="center">
              <GiftIcon sx={{ fontSize: 64, mb: 2, color: '#4CAF50' }} />
              <Typography variant="h6" gutterBottom>
                {claimResult.message}
              </Typography>

              {claimResult.rewardType === 'DOJO_COINS' && (
                <Typography
                  variant="body1"
                  sx={{ color: '#FFD700', fontWeight: 'bold' }}
                >
                  +{claimResult.rewardDetails.dojoCoins} DojoCoins
                </Typography>
              )}

              {claimResult.rewardType === 'AVATAR_ASSET' && (
                <Typography variant="body1" sx={{ color: '#2196F3' }}>
                  New Avatar Asset Unlocked!
                </Typography>
              )}

              {claimResult.rewardType === 'EXCLUSIVE_TITLE' && (
                <Typography variant="body1" sx={{ color: '#9C27B0' }}>
                  Title: "{claimResult.rewardDetails.title}"
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ background: '#0f0f23' }}>
          <Button
            onClick={() => setShowClaimDialog(false)}
            sx={{ color: 'white' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Achievements;
