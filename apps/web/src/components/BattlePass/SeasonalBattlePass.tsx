import { useAuth } from '@/hooks/useAuth';
import {
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  PlayArrow as PlayIcon,
  Star as StarIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

// Types for battle pass system
interface BattlePassTier {
  id: string;
  tier: number;
  requiredXP: number;
  rewards: {
    free: string[];
    premium: string[];
  };
  isUnlocked: boolean;
  isPremium: boolean;
  name: string;
  description: string;
}

interface SeasonalBattlePass {
  id: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  currentXP: number;
  totalXP: number;
  tiers: BattlePassTier[];
  isPremium: boolean;
  timeRemaining: string;
}

interface BattlePassProgressProps {
  battlePass: SeasonalBattlePass;
  onPurchasePremium?: () => void;
}

const BattlePassProgress: React.FC<BattlePassProgressProps> = ({
  battlePass,
  onPurchasePremium,
}) => {
  const theme = useTheme();
  const progress = (battlePass.currentXP / battlePass.totalXP) * 100;

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        background: battlePass.isPremium
          ? theme.cyberpunk.battlePass.premium.background
          : theme.cyberpunk.battlePass.free.background,
        border: battlePass.isPremium
          ? theme.cyberpunk.battlePass.premium.border
          : theme.cyberpunk.battlePass.free.border,
        boxShadow: battlePass.isPremium
          ? theme.cyberpunk.battlePass.premium.glow
          : theme.cyberpunk.battlePass.free.glow,
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>
            {battlePass.seasonName}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Season {new Date().getFullYear()}-
            {String(new Date().getMonth() + 1).padStart(2, '0')}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <TimerIcon sx={{ color: theme.palette.warning.main }} />
          <Typography
            variant="body2"
            sx={{ color: theme.palette.warning.main }}
          >
            {battlePass.timeRemaining}
          </Typography>
        </Box>
      </Box>

      <Box mb={3}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Season Progress
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.primary.main }}
          >
            {battlePass.currentXP.toLocaleString()} /{' '}
            {battlePass.totalXP.toLocaleString()} XP
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(progress, 100)}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: theme.cyberpunk.battlePass.progress.background,
            '& .MuiLinearProgress-bar': {
              background: theme.cyberpunk.battlePass.progress.fill,
              borderRadius: 6,
            },
          }}
        />
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Current Tier:{' '}
            {battlePass.tiers.find((t) => !t.isUnlocked)?.tier || 'MAX'}
          </Typography>
          {!battlePass.isPremium && (
            <Typography
              variant="body2"
              sx={{ color: theme.palette.warning.main, mt: 1 }}
            >
              Upgrade to Premium for exclusive rewards!
            </Typography>
          )}
        </Box>
        {!battlePass.isPremium && onPurchasePremium && (
          <Button
            variant="contained"
            startIcon={<StarIcon />}
            sx={{
              background: theme.cyberpunk.battlePass.premium.primary,
              '&:hover': {
                background: theme.cyberpunk.battlePass.premium.secondary,
                boxShadow: theme.cyberpunk.battlePass.premium.sparkle,
              },
            }}
            onClick={onPurchasePremium}
          >
            Upgrade to Premium
          </Button>
        )}
      </Box>
    </Paper>
  );
};

interface TierCardProps {
  tier: BattlePassTier;
  isPremium: boolean;
  isCurrentTier?: boolean;
}

const TierCard: React.FC<TierCardProps> = ({
  tier,
  isPremium,
  isCurrentTier,
}) => {
  const theme = useTheme();

  const getTierColor = () => {
    if (tier.isUnlocked) return theme.cyberpunk.battlePass.tier.unlocked;
    if (tier.isPremium) return theme.cyberpunk.battlePass.tier.premium;
    if (isCurrentTier) return theme.cyberpunk.battlePass.tier.current;
    return theme.cyberpunk.battlePass.tier.locked;
  };

  return (
    <Card
      sx={{
        height: '100%',
        background: isPremium
          ? theme.cyberpunk.gradients.card
          : theme.cyberpunk.battlePass.free.background,
        border: tier.isPremium
          ? theme.cyberpunk.battlePass.premium.border
          : theme.cyberpunk.battlePass.free.border,
        opacity: tier.isUnlocked ? 1 : tier.isPremium ? 0.8 : 0.6,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.cyberpunk.shadows.elevated,
        },
      }}
    >
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
            Tier {tier.tier}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {tier.isUnlocked ? (
              <CheckCircleIcon
                sx={{ color: theme.cyberpunk.battlePass.tier.unlocked }}
              />
            ) : tier.isPremium ? (
              <StarIcon
                sx={{ color: theme.cyberpunk.battlePass.tier.premium }}
              />
            ) : (
              <LockIcon
                sx={{ color: theme.cyberpunk.battlePass.tier.locked }}
              />
            )}
            {isCurrentTier && (
              <Chip
                label="Current"
                size="small"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                }}
              />
            )}
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, mb: 2 }}
        >
          {tier.name}
        </Typography>

        <Box mb={2}>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.primary.main, mb: 1 }}
          >
            {tier.requiredXP.toLocaleString()} XP Required
          </Typography>
          {tier.description && (
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              {tier.description}
            </Typography>
          )}
        </Box>

        <Box>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mb: 1 }}
          >
            Free Rewards:
          </Typography>
          {tier.rewards.free.map((reward, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: theme.palette.text.primary }}
            >
              • {reward}
            </Typography>
          ))}

          {tier.rewards.premium.length > 0 && (
            <>
              <Typography
                variant="body2"
                sx={{
                  color: theme.cyberpunk.battlePass.tier.premium,
                  mt: 2,
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                Premium Rewards:
              </Typography>
              {tier.rewards.premium.map((reward, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    color: tier.isPremium
                      ? theme.palette.text.primary
                      : theme.palette.text.secondary,
                    opacity: tier.isPremium ? 1 : 0.6,
                  }}
                >
                  ★ {reward}
                </Typography>
              ))}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const SeasonalBattlePass: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [battlePass, setBattlePass] = useState<SeasonalBattlePass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    const loadBattlePass = async () => {
      try {
        setLoading(true);

        // Mock battle pass data
        const mockBattlePass: SeasonalBattlePass = {
          id: 'season-2024-09',
          seasonName: 'Neon Nights Championship',
          startDate: '2024-09-01',
          endDate: '2024-09-30',
          currentXP: 2500,
          totalXP: 5000,
          isPremium: false,
          timeRemaining: '12 days 4 hours',
          tiers: [
            {
              id: 'tier-1',
              tier: 1,
              requiredXP: 100,
              isUnlocked: true,
              isPremium: false,
              name: 'Rookie',
              description: 'Welcome to the battle pass!',
              rewards: {
                free: ['100 DojoCoins', 'Basic Avatar Frame'],
                premium: ['200 DojoCoins', 'Premium Avatar Frame'],
              },
            },
            {
              id: 'tier-2',
              tier: 2,
              requiredXP: 300,
              isUnlocked: true,
              isPremium: false,
              name: 'Apprentice',
              description: 'Getting started!',
              rewards: {
                free: ['150 DojoCoins', 'Tournament Entry Pass'],
                premium: ['300 DojoCoins', 'Premium Tournament Entry'],
              },
            },
            {
              id: 'tier-3',
              tier: 3,
              requiredXP: 600,
              isUnlocked: false,
              isPremium: false,
              name: 'Warrior',
              description: 'Proving your skills',
              rewards: {
                free: ['200 DojoCoins', 'Rare Cue Skin'],
                premium: ['400 DojoCoins', 'Legendary Cue Skin'],
              },
            },
            {
              id: 'tier-4',
              tier: 4,
              requiredXP: 1000,
              isUnlocked: false,
              isPremium: true,
              name: 'Champion',
              description: 'Elite player status',
              rewards: {
                free: ['300 DojoCoins', 'Exclusive Emote'],
                premium: [
                  '600 DojoCoins',
                  'Champion Title',
                  'VIP Tournament Access',
                ],
              },
            },
            {
              id: 'tier-5',
              tier: 5,
              requiredXP: 1500,
              isUnlocked: false,
              isPremium: true,
              name: 'Legend',
              description: 'Legendary status achieved',
              rewards: {
                free: ['500 DojoCoins', 'Legendary Avatar'],
                premium: [
                  '1000 DojoCoins',
                  'Exclusive Tournament',
                  'Custom Title',
                ],
              },
            },
          ],
        };

        setBattlePass(mockBattlePass);
      } catch (err) {
        setError('Failed to load battle pass data');
      } finally {
        setLoading(false);
      }
    };

    loadBattlePass();
  }, []);

  const handlePurchasePremium = () => {
    // Handle premium purchase logic
    console.log('Purchase premium battle pass');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!battlePass) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">No active season available.</Alert>
      </Container>
    );
  }

  const currentTier = battlePass.tiers.find((t) => !t.isUnlocked);
  const unlockedTiers = battlePass.tiers.filter((t) => t.isUnlocked);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Seasonal Battle Pass
        </Typography>
        <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
          Earn XP through tournaments and unlock exclusive rewards
        </Typography>
      </Box>

      {/* Battle Pass Progress */}
      <BattlePassProgress
        battlePass={battlePass}
        onPurchasePremium={handlePurchasePremium}
      />

      {/* Tabs for different views */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Tiers" />
          <Tab label="Unlocked" />
          <Tab label="Premium Only" />
        </Tabs>

        <Box p={3}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {battlePass.tiers.map((tier) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={tier.id}>
                  <TierCard
                    tier={tier}
                    isPremium={battlePass.isPremium}
                    isCurrentTier={tier === currentTier}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              {unlockedTiers.map((tier) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={tier.id}>
                  <TierCard
                    tier={tier}
                    isPremium={battlePass.isPremium}
                    isCurrentTier={false}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              {battlePass.tiers
                .filter((tier) => tier.isPremium)
                .map((tier) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={tier.id}>
                    <TierCard
                      tier={tier}
                      isPremium={battlePass.isPremium}
                      isCurrentTier={tier === currentTier}
                    />
                  </Grid>
                ))}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* XP Sources Info */}
      <Paper sx={{ p: 3, background: theme.cyberpunk.gradients.card }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: theme.palette.primary.main }}
        >
          How to Earn XP
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <PlayIcon sx={{ color: theme.palette.success.main }} />
              <Box>
                <Typography variant="body1">Tournament Wins</Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  50-200 XP per win
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <TrophyIcon sx={{ color: theme.palette.warning.main }} />
              <Box>
                <Typography variant="body1">
                  Tournament Participation
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  25-100 XP per tournament
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <StarIcon sx={{ color: theme.palette.info.main }} />
              <Box>
                <Typography variant="body1">Daily Challenges</Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  10-50 XP per challenge
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default SeasonalBattlePass;
