import { Box, Grid, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React from 'react';
import WorldHub from '../../../apps/web/src/components/world/WorldHub';
import Layout from '../../components/layout/Layout';
import RewardsDisplayPanel from '../../frontend/components/rewards/RewardsDisplayPanel';
import WalletBalanceView from '../../frontend/components/wallet/WalletBalanceView';

const DashboardPage: React.FC = () => {
  const router = useRouter();

  const gameFlowSteps = [
    {
      title: 'Onboarding',
      description: 'Complete your profile setup',
      path: '/onboarding',
      color: '#00ff9d',
      icon: '🎯',
    },
    {
      title: 'Avatar & Wallet',
      description: 'Customize your digital identity',
      path: '/avatar',
      color: '#00a8ff',
      icon: '👤',
    },
    {
      title: 'Venue Check-in',
      description: 'Find and join a Dojo',
      path: '/venue',
      color: '#ff6b6b',
      icon: '🏢',
    },
    {
      title: 'Tournaments',
      description: 'Compete in tournaments',
      path: '/tournaments',
      color: '#feca57',
      icon: '🏆',
    },
    {
      title: 'Social',
      description: 'Connect with community',
      path: '/social',
      color: '#ff9ff3',
      icon: '💬',
    },
  ];

  const stats = [
    {
      label: 'Total Games',
      value: '0',
      helpText: 'Games played this month',
      color: '#00ff9d',
    },
    {
      label: 'Win Rate',
      value: '0%',
      helpText: 'Last 30 days',
      color: '#00a8ff',
    },
    {
      label: 'Skill Level',
      value: 'Beginner',
      helpText: 'Current ranking',
      color: '#ff6b6b',
    },
  ];

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontFamily: 'Orbitron, monospace',
            fontWeight: 700,
            color: '#00ff9d',
            textShadow: '0 0 20px #00ff9d',
            mb: 4,
            textAlign: 'center',
          }}
        >
          Dashboard
        </Typography>

        {/* Game Flow Navigation */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Orbitron, monospace',
              color: '#00a8ff',
              mb: 3,
              textAlign: 'center',
            }}
          >
            Game Flow
          </Typography>
          <Grid container spacing={2}>
            {gameFlowSteps.map((step, index) => (
              <Grid key={index}>
                <Paper
                  sx={{
                    p: 3,
                    background: `linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)`,
                    border: `2px solid ${step.color}`,
                    borderRadius: 2,
                    boxShadow: `0 0 20px ${step.color}40`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: `0 0 30px ${step.color}80`,
                    },
                  }}
                  onClick={() => router.push(step.path)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: '2rem', mr: 2 }}>
                      {step.icon}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: step.color,
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 600,
                        textShadow: `0 0 10px ${step.color}`,
                      }}
                    >
                      {step.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ccc',
                      fontSize: '0.9rem',
                    }}
                  >
                    {step.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
            {/* New Feature Navigation Buttons */}
            <Grid>
              <Paper
                sx={{
                  p: 3,
                  background:
                    'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                  border: '2px solid #ffb300',
                  borderRadius: 2,
                  boxShadow: '0 0 20px #ffb30040',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 0 30px #ffb30080',
                  },
                }}
                onClick={() => router.push('/avatar-progression-test')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontSize: '2rem', mr: 2 }}>🧬</Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#ffb300',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      textShadow: '0 0 10px #ffb300',
                    }}
                  >
                    Avatar Progression Test
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#ccc', fontSize: '0.9rem' }}
                >
                  Test narrative-driven avatar progression and evolution.
                </Typography>
              </Paper>
            </Grid>
            <Grid>
              <Paper
                sx={{
                  p: 3,
                  background:
                    'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                  border: '2px solid #00e676',
                  borderRadius: 2,
                  boxShadow: '0 0 20px #00e67640',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 0 30px #00e67680',
                  },
                }}
                onClick={() => router.push('/world-map')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontSize: '2rem', mr: 2 }}>🗺️</Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#00e676',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      textShadow: '0 0 10px #00e676',
                    }}
                  >
                    World Map
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#ccc', fontSize: '0.9rem' }}
                >
                  View live Dojo status and territory control.
                </Typography>
              </Paper>
            </Grid>
            <Grid>
              <Paper
                sx={{
                  p: 3,
                  background:
                    'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                  border: '2px solid #00bcd4',
                  borderRadius: 2,
                  boxShadow: '0 0 20px #00bcd440',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 0 30px #00bcd480',
                  },
                }}
                onClick={() => router.push('/ai-commentary')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontSize: '2rem', mr: 2 }}>🤖</Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#00bcd4',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      textShadow: '0 0 10px #00bcd4',
                    }}
                  >
                    AI Commentary
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#ccc', fontSize: '0.9rem' }}
                >
                  Experience Pool God/Fluke God match commentary.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Stats */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Orbitron, monospace',
              color: '#00a8ff',
              mb: 3,
              textAlign: 'center',
            }}
          >
            Your Stats
          </Typography>
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid key={index}>
                <Paper
                  sx={{
                    p: 3,
                    background: `linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)`,
                    border: `2px solid ${stat.color}`,
                    borderRadius: 2,
                    boxShadow: `0 0 20px ${stat.color}40`,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      color: stat.color,
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 700,
                      textShadow: `0 0 10px ${stat.color}`,
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#fff',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ccc',
                      fontSize: '0.9rem',
                    }}
                  >
                    {stat.helpText}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Wallet and Rewards */}
        <Box sx={{ mb: 6 }}>
          <Grid container spacing={3}>
            <Grid>
              <WalletBalanceView />
            </Grid>
            <Grid>
              <RewardsDisplayPanel />
            </Grid>
          </Grid>
        </Box>

        {/* Recent Activity */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Orbitron, monospace',
              color: '#00a8ff',
              mb: 3,
              textAlign: 'center',
            }}
          >
            Recent Activity
          </Typography>
          <Paper
            sx={{
              p: 3,
              background: `linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)`,
              border: '2px solid #00ff9d',
              borderRadius: 2,
              boxShadow: '0 0 20px #00ff9d40',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: '#ccc',
                fontStyle: 'italic',
              }}
            >
              No recent activity to display.
            </Typography>
          </Paper>
        </Box>

        {/* Find a Dojo */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Orbitron, monospace',
              color: '#00a8ff',
              mb: 3,
              textAlign: 'center',
            }}
          >
            Find a Dojo
          </Typography>
          <Paper
            sx={{
              p: 3,
              background: `linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)`,
              border: '2px solid #00ff9d',
              borderRadius: 2,
              boxShadow: '0 0 20px #00ff9d40',
            }}
          >
            <WorldHub />
          </Paper>
        </Box>
      </Box>
    </Layout>
  );
};

export default DashboardPage;
