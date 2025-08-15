import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Divider,
} from "@mui/material";
import {
  TrendingUp,
  EmojiEvents,
  LocationOn,
  AccountBalanceWallet,
  Star,
  Timeline,
} from "@mui/icons-material";
import Layout from "../layout/Layout";
import MapView from "../../frontend/components/MapView";
import WalletBalanceView from "../../frontend/components/wallet/WalletBalanceView";
import RewardsDisplayPanel from "../../frontend/components/rewards/RewardsDisplayPanel";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const gameFlowSteps = [
    {
      title: "Onboarding",
      description: "Complete your profile setup",
      path: "/onboarding",
      color: "#00ff9d",
      icon: "🎯",
      gradient: "linear-gradient(135deg, #00ff9d 0%, #00cc7e 100%)"
    },
    {
      title: "Avatar & Wallet",
      description: "Customize your digital identity",
      path: "/avatar",
      color: "#00a8ff",
      icon: "👤",
      gradient: "linear-gradient(135deg, #00a8ff 0%, #0088cc 100%)"
    },
    {
      title: "Venue Check-in",
      description: "Find and join a Dojo",
      path: "/venue",
      color: "#ff6b6b",
      icon: "🏢",
      gradient: "linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)"
    },
    {
      title: "Tournaments",
      description: "Compete in tournaments",
      path: "/tournaments",
      color: "#feca57",
      icon: "🏆",
      gradient: "linear-gradient(135deg, #feca57 0%, #ff9f43 100%)"
    },
    {
      title: "Social",
      description: "Connect with community",
      path: "/social",
      color: "#ff9ff3",
      icon: "💬",
      gradient: "linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%)"
    }
  ];

  const stats = [
    {
      label: "Total Games",
      value: "0",
      helpText: "Games played this month",
      color: "#00ff9d",
      icon: <TrendingUp />,
      trend: "+0%"
    },
    {
      label: "Win Rate",
      value: "0%",
      helpText: "Last 30 days",
      color: "#00a8ff",
      icon: <EmojiEvents />,
      trend: "+0%"
    },
    {
      label: "Skill Level",
      value: "Beginner",
      helpText: "Current ranking",
      color: "#ff6b6b",
      icon: <Star />,
      trend: "New"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: "game",
      title: "Welcome to DojoPool!",
      description: "Complete your first game to start earning rewards",
      timestamp: "Just now",
      icon: "🎮"
    }
  ];

  return (
    <Layout>
      <Box sx={{ 
        p: { xs: 2, md: 4 },
        background: "linear-gradient(135deg, rgba(0,255,157,0.05) 0%, rgba(0,168,255,0.05) 100%)",
        minHeight: "100vh"
      }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #00ff9d, #00a8ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(0,255,157,0.5)',
              mb: 2
            }}
          >
            Welcome to DojoPool
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#ccc',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 400
            }}
          >
            Your gaming journey starts here
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Orbitron, monospace',
              color: '#00a8ff',
              mb: 3,
              fontWeight: 600
            }}
          >
            Your Stats
          </Typography>
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(42,42,42,0.9) 100%)',
                    border: `1px solid ${stat.color}40`,
                    borderRadius: 3,
                    boxShadow: `0 8px 32px ${stat.color}20`,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${stat.color}40`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: `${stat.color}20`,
                          color: stat.color,
                          mr: 2,
                          width: 48,
                          height: 48
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="h4"
                          sx={{
                            color: stat.color,
                            fontFamily: 'Orbitron, monospace',
                            fontWeight: 700,
                            mb: 0.5
                          }}
                        >
                          {stat.value}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#ccc',
                            fontFamily: 'Orbitron, monospace',
                            fontWeight: 500
                          }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                      <Chip
                        label={stat.trend}
                        size="small"
                        sx={{
                          bgcolor: `${stat.color}20`,
                          color: stat.color,
                          fontFamily: 'Orbitron, monospace',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#999',
                        fontFamily: 'Orbitron, monospace'
                      }}
                    >
                      {stat.helpText}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Game Flow Navigation */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Orbitron, monospace',
              color: '#00a8ff',
              mb: 3,
              fontWeight: 600
            }}
          >
            Get Started
          </Typography>
          <Grid container spacing={3}>
            {gameFlowSteps.map((step, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(42,42,42,0.9) 100%)',
                    border: `1px solid ${step.color}40`,
                    borderRadius: 3,
                    boxShadow: `0 8px 32px ${step.color}20`,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${step.color}40`,
                    }
                  }}
                  onClick={() => navigate(step.path)}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: step.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: '2rem',
                        boxShadow: `0 4px 20px ${step.color}40`
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: step.color,
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 600,
                        mb: 1
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#ccc',
                        fontFamily: 'Orbitron, monospace',
                        fontSize: '0.9rem'
                      }}
                    >
                      {step.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Wallet and Rewards */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Orbitron, monospace',
              color: '#00a8ff',
              mb: 3,
              fontWeight: 600
            }}
          >
            Wallet & Rewards
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(42,42,42,0.9) 100%)',
                  border: '1px solid #00ff9d40',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px #00ff9d20',
                  backdropFilter: 'blur(10px)',
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountBalanceWallet sx={{ color: '#00ff9d', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ color: '#00ff9d', fontFamily: 'Orbitron, monospace', fontWeight: 600 }}>
                      Wallet
                    </Typography>
                  </Box>
                  <WalletBalanceView />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(42,42,42,0.9) 100%)',
                  border: '1px solid #00a8ff40',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px #00a8ff20',
                  backdropFilter: 'blur(10px)',
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmojiEvents sx={{ color: '#00a8ff', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ color: '#00a8ff', fontFamily: 'Orbitron, monospace', fontWeight: 600 }}>
                      Rewards
                    </Typography>
                  </Box>
                  <RewardsDisplayPanel />
                </CardContent>
              </Card>
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
              fontWeight: 600
            }}
          >
            Recent Activity
          </Typography>
          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(42,42,42,0.9) 100%)',
              border: '1px solid #00ff9d40',
              borderRadius: 3,
              boxShadow: '0 8px 32px #00ff9d20',
              backdropFilter: 'blur(10px)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {recentActivity.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Timeline sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#ccc',
                      fontFamily: 'Orbitron, monospace',
                      fontStyle: 'italic'
                    }}
                  >
                    No recent activity to display.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#999',
                      fontFamily: 'Orbitron, monospace',
                      mt: 1
                    }}
                  >
                    Start playing to see your activity here!
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {recentActivity.map((activity, index) => (
                    <Box key={activity.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                        <Avatar sx={{ bgcolor: '#00ff9d20', color: '#00ff9d', mr: 2 }}>
                          {activity.icon}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              color: '#fff',
                              fontFamily: 'Orbitron, monospace',
                              fontWeight: 600
                            }}
                          >
                            {activity.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#ccc',
                              fontFamily: 'Orbitron, monospace'
                            }}
                          >
                            {activity.description}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#999',
                            fontFamily: 'Orbitron, monospace'
                          }}
                        >
                          {activity.timestamp}
                        </Typography>
                      </Box>
                      {index < recentActivity.length - 1 && <Divider sx={{ borderColor: '#333' }} />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Find a Dojo */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Orbitron, monospace',
              color: '#00a8ff',
              mb: 3,
              fontWeight: 600
            }}
          >
            Find a Dojo
          </Typography>
          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(42,42,42,0.9) 100%)',
              border: '1px solid #00ff9d40',
              borderRadius: 3,
              boxShadow: '0 8px 32px #00ff9d20',
              backdropFilter: 'blur(10px)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ color: '#00ff9d', mr: 2, fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#00ff9d', fontFamily: 'Orbitron, monospace', fontWeight: 600 }}>
                  Nearby Venues
                </Typography>
              </Box>
              <Box sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                border: '1px solid #333'
              }}>
                <MapView />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Layout>
  );
};

export default Dashboard; 