import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { useRouter } from "next/router";
import Layout from "../src/components/layout/Layout";
import MapView from "../src/frontend/components/MapView";
import WalletBalanceView from "../src/frontend/components/wallet/WalletBalanceView";
import RewardsDisplayPanel from "../src/frontend/components/rewards/RewardsDisplayPanel";
import PageBackground from "../src/components/common/PageBackground";

const DashboardPage: React.FC = () => {
  const router = useRouter();

  const gameFlowSteps = [
    {
      title: "Onboarding",
      description: "Complete your profile setup",
      path: "/onboarding",
      color: "#00ff9d",
      icon: "🎯"
    },
    {
      title: "Avatar & Wallet",
      description: "Customize your digital identity",
      path: "/avatar",
      color: "#00a8ff",
      icon: "👤"
    },
    {
      title: "Venue Check-in",
      description: "Find and join a Dojo",
      path: "/venue",
      color: "#ff6b6b",
      icon: "🏢"
    },
    {
      title: "Tournaments",
      description: "Compete in tournaments",
      path: "/tournaments",
      color: "#feca57",
      icon: "🏆"
    },
    {
      title: "Social",
      description: "Connect with community",
      path: "/social",
      color: "#ff9ff3",
      icon: "💬"
    }
  ];

  const stats = [
    {
      label: "Total Games",
      value: "0",
      helpText: "Games played this month",
      color: "#00ff9d"
    },
    {
      label: "Win Rate",
      value: "0%",
      helpText: "Last 30 days",
      color: "#00a8ff"
    },
    {
      label: "Skill Level",
      value: "Beginner",
      helpText: "Current ranking",
      color: "#ff6b6b"
    }
  ];

  return (
    <Layout>
      <PageBackground variant="dashboard">
        <Box sx={{ p: { xs: 2, md: 4 }, position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              color: '#00ff9d',
              textShadow: '0 0 20px #00ff9d',
              mb: 4,
              textAlign: 'center'
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
                textAlign: 'center'
              }}
            >
              Game Flow
            </Typography>
            <Grid container spacing={2}>
              {gameFlowSteps.map((step, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(20,20,20,0.7)',
                      border: `2px solid ${step.color}`,
                      borderRadius: 2,
                      boxShadow: `0 0 20px ${step.color}40`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: `0 0 30px ${step.color}80`,
                      }
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
                          textShadow: `0 0 10px ${step.color}`
                        }}
                      >
                        {step.title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#ccc',
                        fontSize: '0.8rem'
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
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
                textAlign: 'center'
              }}
            >
              Your Stats
            </Typography>
            <Grid container spacing={3}>
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(20,20,20,0.7)',
                      border: `2px solid ${stat.color}`,
                      borderRadius: 2,
                      boxShadow: `0 0 20px ${stat.color}40`,
                      textAlign: 'center'
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        color: stat.color,
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 700,
                        textShadow: `0 0 10px ${stat.color}`,
                        mb: 1
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
                        mb: 1
                      }}
                    >
                      {stat.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#ccc',
                        fontSize: '0.8rem'
                      }}
                    >
                      {stat.helpText}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Map and Wallet Section */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Card
                sx={{
                  background: 'rgba(20,20,20,0.7)',
                  border: '2px solid #00ff9d',
                  borderRadius: 3,
                  boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#00ff9d',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      mb: 2,
                      textShadow: '0 0 10px rgba(0, 255, 157, 0.5)'
                    }}
                  >
                    Venue Map
                  </Typography>
                  <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden' }}>
                    <MapView />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  background: 'rgba(20,20,20,0.7)',
                  border: '2px solid #00a8ff',
                  borderRadius: 3,
                  boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                  mb: 3
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#00a8ff',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      mb: 2,
                      textShadow: '0 0 10px rgba(0, 168, 255, 0.5)'
                    }}
                  >
                    Wallet Balance
                  </Typography>
                  <WalletBalanceView />
                </CardContent>
              </Card>
              
              <Card
                sx={{
                  background: 'rgba(20,20,20,0.7)',
                  border: '2px solid #ff6b6b',
                  borderRadius: 3,
                  boxShadow: '0 0 30px rgba(255, 107, 107, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#ff6b6b',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      mb: 2,
                      textShadow: '0 0 10px rgba(255, 107, 107, 0.5)'
                    }}
                  >
                    Rewards
                  </Typography>
                  <RewardsDisplayPanel />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </PageBackground>
    </Layout>
  );
};

export default DashboardPage; 