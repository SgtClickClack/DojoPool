import { ActivityFeed } from '@/components/ActivityFeed';
import BattlePassWidget from '@/components/BattlePass/BattlePassWidget';
import DojoCoinWallet from '@/components/Economy/DojoCoinWallet';
import { useDevice, useOrientation } from '@/hooks/useDevice';
import {
  Group as ClanIcon,
  Close as CloseIcon,
  ShoppingCart as MarketplaceIcon,
  Menu as MenuIcon,
  Notifications as NotificationIcon,
  PlayArrow as PlayIcon,
  Star as StarIcon,
  Timeline as TournamentIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Paper,
  SwipeableDrawer,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

interface MobileDashboardProps {
  stats: any;
  user: any;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ stats, user }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const orientation = useOrientation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState<
    'overview' | 'activity' | 'battlepass'
  >('overview');

  // Quick action buttons for mobile
  const quickActions = [
    {
      icon: PlayIcon,
      label: 'Find Match',
      action: () => console.log('Find match'),
      color: theme.palette.primary.main,
    },
    {
      icon: ClanIcon,
      label: 'Clan',
      action: () => console.log('View clan'),
      color: theme.palette.secondary.main,
    },
    {
      icon: TournamentIcon,
      label: 'Tournaments',
      action: () => console.log('View tournaments'),
      color: theme.palette.success.main,
    },
    {
      icon: MarketplaceIcon,
      label: 'Market',
      action: () => console.log('View marketplace'),
      color: theme.palette.warning.main,
    },
  ];

  if (!isMobile) {
    return null; // This component is only for mobile
  }

  const isPortrait = orientation === 'portrait';

  return (
    <Container maxWidth="sm" sx={{ pb: isPortrait ? 12 : 8 }}>
      {/* Mobile Header with Menu Toggle */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: theme.cyberpunk.gradients.card,
          borderBottom: `1px solid ${theme.palette.primary.main}`,
          p: 2,
          mb: 2,
          borderRadius: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}
            >
              Welcome back, {user?.username || 'Player'}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Your DojoPool Dashboard
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              sx={{ color: theme.palette.primary.main }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <IconButton sx={{ color: theme.palette.primary.main }}>
              <Badge badgeContent={3} color="error">
                <NotificationIcon />
              </Badge>
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* View Toggle for Portrait Mode */}
      {isPortrait && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              background: theme.cyberpunk.gradients.card,
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: 2,
              p: 1,
            }}
          >
            {[
              { key: 'overview', label: 'Overview', icon: TrendingUpIcon },
              { key: 'activity', label: 'Activity', icon: TrophyIcon },
              { key: 'battlepass', label: 'Battle Pass', icon: StarIcon },
            ].map((view) => {
              const IconComponent = view.icon;
              return (
                <Box
                  key={view.key}
                  onClick={() => setActiveView(view.key as any)}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    backgroundColor:
                      activeView === view.key
                        ? `${theme.palette.primary.main}20`
                        : 'transparent',
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}10`,
                    },
                  }}
                >
                  <IconComponent
                    sx={{
                      fontSize: 20,
                      color:
                        activeView === view.key
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                      mb: 0.5,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        activeView === view.key
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                      fontSize: '0.7rem',
                      fontWeight: activeView === view.key ? 'bold' : 'normal',
                    }}
                  >
                    {view.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Overview View */}
      {(activeView === 'overview' || !isPortrait) && (
        <>
          {/* Key Metrics Cards - Mobile Optimized */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Card
                sx={{
                  background: theme.cyberpunk.gradients.card,
                  border: `1px solid ${theme.palette.primary.main}`,
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.cyberpunk.shadows.elevated,
                  },
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <TrendingUpIcon
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: 28,
                      mb: 1,
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 'bold',
                    }}
                  >
                    {stats?.matches?.winRate || 0}%
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Win Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card
                sx={{
                  background: theme.cyberpunk.gradients.card,
                  border: `1px solid ${theme.palette.success.main}`,
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.cyberpunk.shadows.elevated,
                  },
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <TrophyIcon
                    sx={{
                      color: theme.palette.success.main,
                      fontSize: 28,
                      mb: 1,
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.palette.success.main,
                      fontWeight: 'bold',
                    }}
                  >
                    {stats?.matches?.total || 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Games Played
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card
                sx={{
                  background: theme.cyberpunk.gradients.card,
                  border: `1px solid ${theme.palette.warning.main}`,
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.cyberpunk.shadows.elevated,
                  },
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <StarIcon
                    sx={{
                      color: theme.palette.warning.main,
                      fontSize: 28,
                      mb: 1,
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.palette.warning.main,
                      fontWeight: 'bold',
                    }}
                  >
                    2,450
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Battle Pass XP
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card
                sx={{
                  background: theme.cyberpunk.gradients.card,
                  border: `1px solid ${theme.palette.info.main}`,
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.cyberpunk.shadows.elevated,
                  },
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <ClanIcon
                    sx={{ color: theme.palette.info.main, fontSize: 28, mb: 1 }}
                  />
                  <Typography
                    variant="h5"
                    sx={{ color: theme.palette.info.main, fontWeight: 'bold' }}
                  >
                    {stats?.clan?.points || 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Clan Points
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              background: theme.cyberpunk.gradients.card,
              border: `1px solid ${theme.palette.primary.main}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.primary.main,
                mb: 2,
                fontWeight: 'bold',
              }}
            >
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Grid item xs={6} key={index}>
                    <Box
                      onClick={action.action}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        backgroundColor: `${action.color}20`,
                        border: `1px solid ${action.color}50`,
                        '&:hover': {
                          backgroundColor: `${action.color}30`,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <IconComponent
                        sx={{ color: action.color, fontSize: 32, mb: 1 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}
                      >
                        {action.label}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>

          {/* Battle Pass Widget */}
          <Box sx={{ mb: 3 }}>
            <BattlePassWidget compact />
          </Box>

          {/* DojoCoin Wallet */}
          <DojoCoinWallet showPurchaseButton={false} />
        </>
      )}

      {/* Activity View */}
      {activeView === 'activity' && isPortrait && (
        <Paper
          sx={{
            p: 2,
            background: theme.cyberpunk.gradients.card,
            border: `1px solid ${theme.palette.primary.main}`,
            maxHeight: '60vh',
            overflow: 'auto',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.primary.main,
              mb: 2,
              fontWeight: 'bold',
            }}
          >
            Recent Activity
          </Typography>
          <ActivityFeed filter="global" />
        </Paper>
      )}

      {/* Battle Pass View */}
      {activeView === 'battlepass' && isPortrait && <BattlePassWidget />}

      {/* Landscape Layout (when not portrait) */}
      {!isPortrait && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3,
                background: theme.cyberpunk.gradients.card,
                border: `1px solid ${theme.palette.primary.main}`,
                height: 300,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.primary.main,
                  mb: 2,
                  fontWeight: 'bold',
                }}
              >
                Activity Feed
              </Typography>
              <ActivityFeed filter="global" />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <BattlePassWidget compact />
              <DojoCoinWallet showPurchaseButton={false} />
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Mobile Drawer Menu */}
      <SwipeableDrawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        sx={{
          '& .MuiDrawer-paper': {
            background: theme.cyberpunk.gradients.card,
            borderLeft: `1px solid ${theme.palette.primary.main}`,
            width: 280,
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.primary.main}30`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}
            >
              Menu
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon sx={{ color: theme.palette.primary.main }} />
            </IconButton>
          </Box>
        </Box>

        {/* Menu items would go here */}
        <Box sx={{ p: 2 }}>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Mobile menu items coming soon...
          </Typography>
        </Box>
      </SwipeableDrawer>
    </Container>
  );
};

export default MobileDashboard;
