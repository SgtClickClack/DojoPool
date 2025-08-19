import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
} from '@mui/material';
import {
  EmojiEvents,
  Group,
  AccessTime,
  LocationOn,
  Star,
  TrendingUp,
  PlayArrow,
} from '@mui/icons-material';
import Layout from '../src/components/layout/Layout';
import PageBackground from '../src/components/common/PageBackground';

const TournamentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'upcoming' | 'active' | 'completed' | 'create'
  >('upcoming');

  // Mock tournament data
  const [tournaments] = useState([
    {
      id: '1',
      name: 'Phoenix Rising Championship',
      venue: 'The Jade Tiger',
      format: 'Single Elimination',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'upcoming',
      participants: 24,
      maxParticipants: 32,
      entryFee: 50,
      prizePool: 2500,
      description:
        'The ultimate test of skill and strategy. Only the best will rise to claim the Phoenix Crown.',
      requirements: {
        minRating: 1500,
        minMatches: 10,
      },
    },
    {
      id: '2',
      name: 'Clan Wars Tournament',
      venue: 'Pool Masters Arena',
      format: 'Swiss System',
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'upcoming',
      participants: 16,
      maxParticipants: 16,
      entryFee: 25,
      prizePool: 1200,
      description:
        'Clan-based tournament where teams compete for glory and territory control.',
      requirements: {
        clanMembership: true,
        minRating: 1200,
      },
    },
    {
      id: '3',
      name: 'Elite Pool Masters',
      venue: 'Elite Pool Club',
      format: 'Double Elimination',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'active',
      participants: 8,
      maxParticipants: 8,
      entryFee: 100,
      prizePool: 5000,
      description:
        'High-stakes tournament for elite players only. Massive prize pool awaits the champion.',
      requirements: {
        minRating: 1800,
        minMatches: 50,
      },
    },
    {
      id: '4',
      name: 'Spring Championship',
      venue: 'Downtown Dojo',
      format: 'Round Robin',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'completed',
      participants: 12,
      maxParticipants: 12,
      entryFee: 30,
      prizePool: 800,
      description:
        'Seasonal championship that tested the mettle of all participants.',
      requirements: {
        minRating: 1000,
      },
      winner: 'ShadowStriker',
      runnerUp: 'PoolMaster2024',
    },
  ]);

  const [userStats] = useState({
    tournamentsPlayed: 8,
    tournamentsWon: 3,
    totalPrizeMoney: 2400,
    currentRating: 1850,
    bestFinish: 'Champion',
    averageFinish: 'Top 4',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#00a8ff';
      case 'active':
        return '#00ff9d';
      case 'completed':
        return '#ff6b6b';
      default:
        return '#ccc';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <AccessTime />;
      case 'active':
        return <PlayArrow />;
      case 'completed':
        return <EmojiEvents />;
      default:
        return <AccessTime />;
    }
  };

  const renderTournamentCard = (tournament: any) => (
    <Card
      key={tournament.id}
      sx={{
        background: 'rgba(26, 26, 26, 0.9)',
        border: `2px solid ${getStatusColor(tournament.status)}`,
        borderRadius: 3,
        boxShadow: `0 0 30px ${getStatusColor(tournament.status)}40`,
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0 0 40px ${getStatusColor(tournament.status)}60`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                color: getStatusColor(tournament.status),
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 1,
              }}
            >
              {tournament.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
              <LocationOn
                sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
              />
              {tournament.venue}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              {tournament.description}
            </Typography>
          </Box>
          <Chip
            icon={getStatusIcon(tournament.status)}
            label={tournament.status.toUpperCase()}
            sx={{
              backgroundColor: getStatusColor(tournament.status),
              color: '#000',
              fontWeight: 'bold',
              ml: 2,
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ color: getStatusColor(tournament.status) }}
            >
              {tournament.format}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Format
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ color: getStatusColor(tournament.status) }}
            >
              {tournament.participants}/{tournament.maxParticipants}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Players
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ color: getStatusColor(tournament.status) }}
            >
              ${tournament.entryFee}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Entry Fee
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ color: getStatusColor(tournament.status) }}
            >
              ${tournament.prizePool}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Prize Pool
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            <AccessTime
              sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
            />
            {new Date(tournament.startDate).toLocaleDateString()} -{' '}
            {new Date(tournament.endDate).toLocaleDateString()}
          </Typography>

          {tournament.status === 'upcoming' && (
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                color: '#000',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                '&:hover': {
                  background:
                    'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                },
              }}
            >
              Register
            </Button>
          )}

          {tournament.status === 'active' && (
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #00ff9d 0%, #feca57 100%)',
                color: '#000',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                '&:hover': {
                  background:
                    'linear-gradient(45deg, #feca57 0%, #00ff9d 100%)',
                },
              }}
            >
              Join Match
            </Button>
          )}

          {tournament.status === 'completed' && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: '#00ff9d' }}>
                Winner: {tournament.winner}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                Runner-up: {tournament.runnerUp}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <PageBackground variant="tournament">
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
            🏆 Tournaments
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
            Compete for glory, prizes, and territory control
          </Typography>

          {/* User Tournament Stats */}
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
                    mb: 2,
                    fontFamily: 'Orbitron, monospace',
                  }}
                >
                  🏆 Your Tournament Stats
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {userStats.tournamentsPlayed}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Tournaments
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {userStats.tournamentsWon}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Wins
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      ${userStats.totalPrizeMoney}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Prize Money
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {userStats.currentRating}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Rating
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {userStats.bestFinish}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Best Finish
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {userStats.averageFinish}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Avg Finish
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Tab Navigation */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {[
                { key: 'upcoming', label: 'Upcoming', icon: <AccessTime /> },
                { key: 'active', label: 'Active', icon: <PlayArrow /> },
                { key: 'completed', label: 'Completed', icon: <EmojiEvents /> },
                { key: 'create', label: 'Create', icon: <Star /> },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'contained' : 'outlined'}
                  onClick={() => setActiveTab(tab.key as any)}
                  startIcon={tab.icon}
                  sx={{
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 600,
                    ...(activeTab === tab.key
                      ? {
                          background:
                            'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                          color: '#000',
                          '&:hover': {
                            background:
                              'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                          },
                        }
                      : {
                          border: '2px solid #00a8ff',
                          color: '#00a8ff',
                          '&:hover': {
                            border: '2px solid #00ff9d',
                            color: '#00ff9d',
                          },
                        }),
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Tournament Content */}
          <Box>
            {activeTab === 'upcoming' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {tournaments
                  .filter((t) => t.status === 'upcoming')
                  .map(renderTournamentCard)}
              </Box>
            )}

            {activeTab === 'active' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {tournaments
                  .filter((t) => t.status === 'active')
                  .map(renderTournamentCard)}
              </Box>
            )}

            {activeTab === 'completed' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {tournaments
                  .filter((t) => t.status === 'completed')
                  .map(renderTournamentCard)}
              </Box>
            )}

            {activeTab === 'create' && (
              <Card
                sx={{
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '2px solid #00a8ff',
                  borderRadius: 3,
                  boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#00a8ff',
                      mb: 2,
                      fontFamily: 'Orbitron, monospace',
                    }}
                  >
                    🏆 Create Tournament
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ccc', mb: 4 }}>
                    Create your own tournament and invite players to compete for
                    glory and prizes.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      background:
                        'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                      color: '#000',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      px: 4,
                      py: 2,
                      borderRadius: 3,
                      '&:hover': {
                        background:
                          'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Create Tournament
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default TournamentsPage;
