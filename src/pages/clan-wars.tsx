import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Card, CardContent, Button, Chip } from '@mui/material';
import { Group, EmojiEvents, TrendingUp, LocationOn, AccessTime, Star } from '@mui/icons-material';
import Layout from '../components/layout/Layout';
import PageBackground from '../components/common/PageBackground';
import { useClanSystem } from '../hooks/useClanSystem';

const ClanWarsPage: React.FC = () => {
  const {
    userClan,
    activeClanWars,
    loading,
    declareWar,
    acceptWar,
    submitWarMatch
  } = useClanSystem();

  const [showDeclareWar, setShowDeclareWar] = useState(false);
  const [warForm, setWarForm] = useState({
    targetClanId: '',
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    rewards: {
      winner: 1000,
      loser: 100
    }
  });

  // Mock data for demonstration
  const mockClans = [
    { id: '1', name: 'Phoenix Warriors', tag: 'PHX', members: 15, territories: 3, rating: 1850 },
    { id: '2', name: 'Shadow Clan', tag: 'SHD', members: 12, territories: 2, rating: 1720 },
    { id: '3', name: 'Dragon Slayers', tag: 'DRG', members: 18, territories: 4, rating: 1920 },
    { id: '4', name: 'Elite Pool Masters', tag: 'EPM', members: 8, territories: 1, rating: 1650 }
  ];

  const handleDeclareWar = async () => {
    if (warForm.targetClanId && warForm.name) {
      const success = await declareWar(warForm.targetClanId, warForm);
      if (success) {
        setShowDeclareWar(false);
        setWarForm({
          targetClanId: '',
          name: '',
          description: '',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          rewards: { winner: 1000, loser: 100 }
        });
      }
    }
  };

  return (
    <Layout>
      <PageBackground variant="social">
        <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              color: '#00ff9d',
              textShadow: '0 0 20px #00ff9d',
              mb: 2,
              textAlign: 'center'
            }}
          >
            ⚔️ Clan Wars
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: '#00a8ff',
              textAlign: 'center',
              mb: 4,
              fontFamily: 'Orbitron, monospace',
              textShadow: '0 0 10px rgba(0, 168, 255, 0.5)'
            }}
          >
            Battle for territory control and clan supremacy
          </Typography>

          {/* User Clan Status */}
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
                <Typography variant="h5" sx={{ color: '#00ff9d', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                  🏰 Your Clan: {userClan?.name || 'Phoenix Warriors'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>{userClan?.members?.length || 15}</Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Members</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>{userClan?.territories?.length || 3}</Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Territories</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>{userClan?.rating || 1850}</Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Rating</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>{activeClanWars.length}</Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Active Wars</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Active Wars */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                color: '#00a8ff',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 3,
                textAlign: 'center',
                textShadow: '0 0 10px rgba(0, 168, 255, 0.5)'
              }}
            >
              ⚔️ Active Clan Wars
            </Typography>

            {loading.wars ? (
              <Typography sx={{ textAlign: 'center', color: '#ccc' }}>Loading wars...</Typography>
            ) : activeClanWars.length === 0 ? (
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
                  <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                    No Active Wars
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
                    Declare war on another clan to start a battle for territory control!
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setShowDeclareWar(true)}
                    sx={{
                      background: 'linear-gradient(45deg, #ff6b6b 0%, #feca57 100%)',
                      color: '#000',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      px: 4,
                      py: 2,
                      borderRadius: 3,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #feca57 0%, #ff6b6b 100%)',
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    Declare War
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {activeClanWars.map((war) => (
                  <Card
                    key={war.id}
                    sx={{
                      background: 'rgba(26, 26, 26, 0.9)',
                      border: '2px solid #ff6b6b',
                      borderRadius: 3,
                      boxShadow: '0 0 30px rgba(255, 107, 107, 0.3)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#ff6b6b', fontFamily: 'Orbitron, monospace' }}>
                          {war.name}
                        </Typography>
                        <Chip
                          label={war.status.toUpperCase()}
                          sx={{
                            backgroundColor: war.status === 'active' ? '#ff6b6b' : '#00a8ff',
                            color: '#000',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                        {war.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <AccessTime sx={{ color: '#00a8ff', fontSize: 16 }} />
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            {new Date(war.startDate).toLocaleDateString()} - {new Date(war.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#00ff9d',
                            color: '#00ff9d',
                            '&:hover': {
                              borderColor: '#00ff9d',
                              backgroundColor: 'rgba(0, 255, 157, 0.1)',
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default ClanWarsPage; 