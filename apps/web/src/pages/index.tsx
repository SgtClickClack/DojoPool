import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';

const Main: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [gameData, setGameData] = useState<any>(null);

  useEffect(() => {
    // Test backend connection
    fetch('/api/health')
      .then((response) => response.json())
      .then((data) => {
        setBackendStatus('Connected');
        console.log('Backend health:', data);
      })
      .catch((error) => {
        setBackendStatus('Disconnected');
        console.error('Backend error:', error);
      });

    // Get game data
    fetch('/api/game-status')
      .then((response) => response.json())
      .then((data) => {
        setGameData(data);
        console.log('Game data:', data);
      })
      .catch((error) => {
        console.error('Game data error:', error);
      });
  }, []);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              mb: 2,
              background: 'linear-gradient(45deg, #00ff9d, #00a8ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              fontFamily: 'Orbitron, monospace',
            }}
          >
            🎱 DojoPool Platform
          </Typography>
          <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
            Pokémon Meets Pool - The Ultimate Gaming Experience
          </Typography>

          {/* Backend Status */}
          <Alert
            severity={backendStatus === 'Connected' ? 'success' : 'error'}
            sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}
          >
            Backend Status: {backendStatus}
          </Alert>
        </Box>

        {/* Game Data Display */}
        {gameData && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background: 'rgba(0,255,157,0.1)',
                  border: '1px solid rgba(0,255,157,0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: '#00ff9d' }}
                  >
                    Player Stats
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Level: {gameData.player.level}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    XP: {gameData.player.xp}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Clan: {gameData.player.clan}
                  </Typography>
                  <Typography variant="body2">
                    Achievements: {gameData.player.achievements}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background: 'rgba(0,255,157,0.1)',
                  border: '1px solid rgba(0,255,157,0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: '#00ff9d' }}
                  >
                    Territory Control
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Owned: {gameData.territory.owned}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Total: {gameData.territory.total}
                  </Typography>
                  <Typography variant="body2">
                    Objective: {gameData.territory.currentObjective}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Feature Navigation */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                background: 'rgba(0,255,157,0.1)',
                border: '1px solid rgba(0,255,157,0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,255,157,0.3)',
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#00ff9d' }}>
                  🗺️ World Map
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Explore territories, find dojos, and discover new challenges
                  in the DojoPool world.
                </Typography>
                <Link href="/world-map" passHref>
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#00ff9d',
                      borderColor: '#00ff9d',
                      '&:hover': {
                        borderColor: '#00a8ff',
                        color: '#00a8ff',
                      },
                    }}
                  >
                    Explore World
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                background: 'rgba(0,255,157,0.1)',
                border: '1px solid rgba(0,255,157,0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,255,157,0.3)',
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#00ff9d' }}>
                  ⚔️ Clan Wars
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Battle for territory control, form alliances, and dominate the
                  DojoPool landscape.
                </Typography>
                <Link href="/clan-wars" passHref>
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#00ff9d',
                      borderColor: '#00ff9d',
                      '&:hover': {
                        borderColor: '#00a8ff',
                        color: '#00a8ff',
                      },
                    }}
                  >
                    Join Battle
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                background: 'rgba(0,255,157,0.1)',
                border: '1px solid rgba(0,255,157,0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,255,157,0.3)',
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#00ff9d' }}>
                  🏆 Tournaments
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Compete in tournaments, win prizes, and climb the
                  leaderboards.
                </Typography>
                <Link href="/tournaments" passHref>
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#00ff9d',
                      borderColor: '#00ff9d',
                      '&:hover': {
                        borderColor: '#00a8ff',
                        color: '#00a8ff',
                      },
                    }}
                  >
                    View Tournaments
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                background: 'rgba(0,255,157,0.1)',
                border: '1px solid rgba(0,255,157,0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,255,157,0.3)',
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#00ff9d' }}>
                  🤖 AI Commentary
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Experience AI-powered match commentary and real-time analysis.
                </Typography>
                <Link href="/ai-commentary" passHref>
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#00ff9d',
                      borderColor: '#00ff9d',
                      '&:hover': {
                        borderColor: '#00a8ff',
                        color: '#00a8ff',
                      },
                    }}
                  >
                    Try AI Commentary
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Additional Features */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: 'rgba(0,255,157,0.1)',
                border: '1px solid rgba(0,255,157,0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#00ff9d' }}>
                  🎮 Game Mechanics
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Advanced challenge system, territory control, and player
                  progression.
                </Typography>
                <Link href="/game-mechanics" passHref>
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#00ff9d',
                      borderColor: '#00ff9d',
                      '&:hover': {
                        borderColor: '#00a8ff',
                        color: '#00a8ff',
                      },
                    }}
                  >
                    Explore Mechanics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: 'rgba(0,255,157,0.1)',
                border: '1px solid rgba(0,255,157,0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#00ff9d' }}>
                  👤 Avatar Progression
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Level up your avatar, unlock achievements, and evolve your
                  character.
                </Typography>
                <Link href="/avatar-progression" passHref>
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#00ff9d',
                      borderColor: '#00ff9d',
                      '&:hover': {
                        borderColor: '#00a8ff',
                        color: '#00a8ff',
                      },
                    }}
                  >
                    View Avatar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: 'rgba(0,255,157,0.1)',
                border: '1px solid rgba(0,255,157,0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#00ff9d' }}>
                  📊 Analytics Dashboard
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Player statistics, performance tracking, tournament history,
                  and match analytics.
                </Typography>
                <Link href="/analytics" passHref>
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#00ff9d',
                      borderColor: '#00ff9d',
                      '&:hover': {
                        borderColor: '#00a8ff',
                        color: '#00a8ff',
                      },
                    }}
                  >
                    View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Main;
