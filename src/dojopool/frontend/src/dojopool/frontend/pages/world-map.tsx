import { Business, Group, LocationOn, TrendingUp } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import WorldHub from '../../../../../apps/web/src/components/world/WorldHub';
import PageBackground from '../src/components/common/PageBackground';
import Layout from '../src/components/layout/Layout';

const WorldMapPage: React.FC = () => {
  const [playerStats] = useState({
    level: 15,
    experience: 1250,
    experienceToNext: 2000,
    totalGames: 47,
    wins: 32,
    losses: 15,
    winRate: 68.1,
    currentStreak: 5,
    bestStreak: 8,
    achievements: 12,
    clanRank: 'Elite Member',
    venueMastery: 3,
    storyProgress: 45,
  });

  const [territories] = useState([
    {
      id: 1,
      name: 'Downtown Dojo',
      status: 'controlled',
      controller: 'Phoenix Warriors',
      influence: 85,
      players: 12,
      distance: '0.2 km',
      color: '#00ff9d',
    },
    {
      id: 2,
      name: 'Pool Masters Arena',
      status: 'rival',
      controller: 'Shadow Clan',
      influence: 72,
      players: 8,
      distance: '0.8 km',
      color: '#ff6b6b',
    },
    {
      id: 3,
      name: 'Elite Pool Club',
      status: 'neutral',
      controller: 'None',
      influence: 45,
      players: 15,
      distance: '1.2 km',
      color: '#00a8ff',
    },
    {
      id: 4,
      name: 'Championship Hall',
      status: 'controlled',
      controller: 'Phoenix Warriors',
      influence: 93,
      players: 6,
      distance: '2.1 km',
      color: '#00ff9d',
    },
  ]);

  const [currentObjectives] = useState([
    {
      id: '1',
      title: 'The Rival Challenge',
      description:
        'Face off against your rival "ShadowStriker" at Downtown Dojo. This grudge match will determine who advances to the Regional Championship.',
      type: 'main',
      progress: 0,
      maxProgress: 1,
      reward: 'Regional Championship Entry + 500 XP',
      location: 'Downtown Dojo',
      isActive: true,
    },
    {
      id: '2',
      title: 'Clan Territory Expansion',
      description:
        'Help your clan "Phoenix Warriors" expand their territory by winning 3 matches at rival-controlled venues.',
      type: 'social',
      progress: 1,
      maxProgress: 3,
      reward: 'Clan Prestige + Special Avatar Item',
      isActive: true,
    },
  ]);

  return (
    <Layout>
      <PageBackground variant="map">
        <Container
          maxWidth="lg"
          sx={{ py: 4, position: 'relative', zIndex: 1 }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              color: '#00ff9d',
              textShadow: '0 0 20px #00ff9d',
              mb: 2,
              textAlign: 'center',
            }}
          >
            🗺️ World Map
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: '#00a8ff',
              textAlign: 'center',
              mb: 4,
              fontFamily: 'Orbitron, monospace',
              textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
            }}
          >
            Explore Dojos, claim territories, and expand your influence
          </Typography>

          {/* Player Stats */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            <Card
              sx={{
                background: 'rgba(26, 26, 26, 0.9)',
                border: '2px solid #00ff9d',
                borderRadius: 3,
                boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
                backdropFilter: 'blur(10px)',
                flex: 1,
                minWidth: '300px',
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00ff9d',
                    mb: 2,
                    fontFamily: 'Orbitron, monospace',
                  }}
                >
                  🎯 Your Stats
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ textAlign: 'center', minWidth: '80px' }}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Level
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {playerStats.level}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: '80px' }}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Win Rate
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {playerStats.winRate}%
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: '80px' }}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Streak
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {playerStats.currentStreak}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: '80px' }}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Clan Rank
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {playerStats.clanRank}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              sx={{
                background: 'rgba(26, 26, 26, 0.9)',
                border: '2px solid #00a8ff',
                borderRadius: 3,
                boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                flex: 1,
                minWidth: '300px',
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00a8ff',
                    mb: 2,
                    fontFamily: 'Orbitron, monospace',
                  }}
                >
                  📖 Current Objectives
                </Typography>
                {currentObjectives.map((objective) => (
                  <Box key={objective.id} sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: '#00a8ff', mb: 1 }}
                    >
                      {objective.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#ccc', mb: 1, fontSize: '0.8rem' }}
                    >
                      {objective.description}
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        backgroundColor: 'rgba(0, 168, 255, 0.2)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${
                            (objective.progress / objective.maxProgress) * 100
                          }%`,
                          height: '100%',
                          backgroundColor: '#00a8ff',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#00a8ff', mt: 0.5, display: 'block' }}
                    >
                      {objective.progress}/{objective.maxProgress} -{' '}
                      {objective.reward}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>

          {/* Interactive Map */}
          <Box sx={{ mb: 4 }}>
            <Card
              sx={{
                background: 'rgba(26, 26, 26, 0.9)',
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
                    textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                  }}
                >
                  Interactive Territory Map
                </Typography>
                <Box sx={{ height: 500, borderRadius: 2, overflow: 'hidden' }}>
                  <WorldHub />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Territory List */}
          <Typography
            variant="h4"
            sx={{
              color: '#00a8ff',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
              mb: 3,
              textAlign: 'center',
              textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
            }}
          >
            Territory Control
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              justifyContent: 'center',
            }}
          >
            {territories.map((territory) => (
              <Paper
                key={territory.id}
                sx={{
                  p: 3,
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: `2px solid ${territory.color}`,
                  borderRadius: 3,
                  boxShadow: `0 0 20px ${territory.color}40`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  minWidth: '250px',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 0 30px ${territory.color}80`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn
                    sx={{ color: territory.color, mr: 1, fontSize: 24 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      color: territory.color,
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      textShadow: `0 0 10px ${territory.color}40`,
                    }}
                  >
                    {territory.name}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 0.5,
                    mb: 2,
                    borderRadius: 1,
                    backgroundColor:
                      territory.status === 'controlled'
                        ? '#00ff9d'
                        : territory.status === 'rival'
                          ? '#ff6b6b'
                          : '#00a8ff',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                  }}
                >
                  {territory.status.toUpperCase()}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Group
                    sx={{ color: territory.color, fontSize: 16, mr: 0.5 }}
                  />
                  <Typography variant="body2" sx={{ color: '#fff', mr: 2 }}>
                    {territory.controller}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp
                    sx={{ color: territory.color, fontSize: 16, mr: 0.5 }}
                  />
                  <Typography variant="body2" sx={{ color: '#fff', mr: 2 }}>
                    {territory.influence}% influence
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    {territory.distance}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Business
                      sx={{ color: territory.color, fontSize: 16, mr: 0.5 }}
                    />
                    <Typography variant="body2" sx={{ color: territory.color }}>
                      {territory.players} players
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default WorldMapPage;
