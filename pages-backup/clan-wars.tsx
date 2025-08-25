import { AccessTime, Group } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import PageBackground from '../src/components/Common/PageBackground';
import Layout from '../src/components/Layout/Layout';
import { useClanSystem } from '../src/hooks/useClanSystem';
import styles from './clan-wars.module.css';

const ClanWarsPage: React.FC = () => {
  const {
    userClan,
    activeClanWars,
    loading,
    declareWar,
    acceptWar,
    submitWarMatch,
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
      loser: 100,
    },
  });

  // Mock data for demonstration
  const mockClans = [
    {
      id: '1',
      name: 'Phoenix Warriors',
      tag: 'PHX',
      members: 15,
      territories: 3,
      rating: 1850,
    },
    {
      id: '2',
      name: 'Shadow Clan',
      tag: 'SHD',
      members: 12,
      territories: 2,
      rating: 1720,
    },
    {
      id: '3',
      name: 'Dragon Slayers',
      tag: 'DRG',
      members: 18,
      territories: 4,
      rating: 1920,
    },
    {
      id: '4',
      name: 'Elite Pool Masters',
      tag: 'EPM',
      members: 8,
      territories: 1,
      rating: 1650,
    },
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
          rewards: { winner: 1000, loser: 100 },
        });
      }
    }
  };

  return (
    <Layout>
      <PageBackground variant="social">
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
            ⚔️ Clan Wars
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
                <Typography
                  variant="h5"
                  sx={{
                    color: '#00ff9d',
                    mb: 2,
                    fontFamily: 'Orbitron, monospace',
                  }}
                >
                  🏰 Your Clan: {userClan?.name || 'Phoenix Warriors'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {userClan?.members?.length || 15}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Members
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {userClan?.territories?.length || 3}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Territories
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {userClan?.rating || 1850}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Rating
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {activeClanWars.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Active Wars
                    </Typography>
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
                textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
              }}
            >
              ⚔️ Active Clan Wars
            </Typography>

            {loading.wars ? (
              <Typography sx={{ textAlign: 'center', color: '#ccc' }}>
                Loading wars...
              </Typography>
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
                    Declare war on another clan to start a battle for territory
                    control!
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setShowDeclareWar(true)}
                    sx={{
                      background:
                        'linear-gradient(45deg, #ff6b6b 0%, #feca57 100%)',
                      color: '#000',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      px: 4,
                      py: 2,
                      borderRadius: 3,
                      '&:hover': {
                        background:
                          'linear-gradient(45deg, #feca57 0%, #ff6b6b 100%)',
                        transform: 'translateY(-2px)',
                      },
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
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: '#ff6b6b',
                            fontFamily: 'Orbitron, monospace',
                          }}
                        >
                          {war.name}
                        </Typography>
                        <Chip
                          label={war.status.toUpperCase()}
                          sx={{
                            backgroundColor:
                              war.status === 'active'
                                ? '#00ff9d'
                                : war.status === 'preparing'
                                  ? '#feca57'
                                  : '#00a8ff',
                            color: '#000',
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>

                      <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
                        {war.description}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ textAlign: 'center', flex: 1 }}>
                          <Typography
                            variant="h5"
                            sx={{ color: '#00ff9d', fontWeight: 'bold' }}
                          >
                            {war.clan1Name}
                          </Typography>
                          <Typography
                            variant="h3"
                            sx={{ color: '#00ff9d', fontWeight: 'bold' }}
                          >
                            {war.clan1Score}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center', mx: 2 }}>
                          <Typography
                            variant="h4"
                            sx={{ color: '#ff6b6b', fontWeight: 'bold' }}
                          >
                            VS
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center', flex: 1 }}>
                          <Typography
                            variant="h5"
                            sx={{ color: '#ff6b6b', fontWeight: 'bold' }}
                          >
                            {war.clan2Name}
                          </Typography>
                          <Typography
                            variant="h3"
                            sx={{ color: '#ff6b6b', fontWeight: 'bold' }}
                          >
                            {war.clan2Score}
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
                            sx={{
                              fontSize: 16,
                              mr: 0.5,
                              verticalAlign: 'middle',
                            }}
                          />
                          {new Date(war.startDate).toLocaleDateString()} -{' '}
                          {new Date(war.endDate).toLocaleDateString()}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#00ff9d' }}>
                            Winner: {war.rewards.winner} coins
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            Loser: {war.rewards.loser} coins
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          {/* Available Clans to Declare War On */}
          <Box sx={{ mb: 4 }}>
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
              🏰 Available Clans
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'center',
              }}
            >
              {mockClans
                .filter((clan) => clan.id !== userClan?.id)
                .map((clan) => (
                  <Paper
                    key={clan.id}
                    sx={{
                      p: 3,
                      background: 'rgba(26, 26, 26, 0.9)',
                      border: '2px solid #00a8ff',
                      borderRadius: 3,
                      boxShadow: '0 0 20px rgba(0, 168, 255, 0.3)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      minWidth: '250px',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 0 30px rgba(0, 168, 255, 0.5)',
                      },
                    }}
                    onClick={() => {
                      setWarForm((prev) => ({
                        ...prev,
                        targetClanId: clan.id,
                      }));
                      setShowDeclareWar(true);
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Group sx={{ color: '#00a8ff', mr: 1, fontSize: 24 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#00a8ff',
                          fontFamily: 'Orbitron, monospace',
                          fontWeight: 600,
                          textShadow: '0 0 10px rgba(0, 168, 255, 0.3)',
                        }}
                      >
                        {clan.name} [{clan.tag}]
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#ccc' }}>
                          Members
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#00a8ff' }}>
                          {clan.members}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#ccc' }}>
                          Territories
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#00a8ff' }}>
                          {clan.territories}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#ccc' }}>
                          Rating
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#00a8ff' }}>
                          {clan.rating}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        background:
                          'linear-gradient(45deg, #ff6b6b 0%, #feca57 100%)',
                        color: '#000',
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 600,
                        '&:hover': {
                          background:
                            'linear-gradient(45deg, #feca57 0%, #ff6b6b 100%)',
                        },
                      }}
                    >
                      Declare War
                    </Button>
                  </Paper>
                ))}
            </Box>
          </Box>

          {/* Declare War Dialog */}
          {showDeclareWar && (
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <Paper
                sx={{
                  p: 4,
                  background: 'rgba(26, 26, 26, 0.95)',
                  border: '2px solid #ff6b6b',
                  borderRadius: 3,
                  boxShadow: '0 0 50px rgba(255, 107, 107, 0.5)',
                  backdropFilter: 'blur(20px)',
                  maxWidth: '500px',
                  width: '90%',
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: '#ff6b6b',
                    mb: 3,
                    fontFamily: 'Orbitron, monospace',
                    textAlign: 'center',
                  }}
                >
                  ⚔️ Declare War
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    War Name
                  </Typography>
                  <input
                    type="text"
                    value={warForm.name}
                    onChange={(e) =>
                      setWarForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className={styles.warInput}
                    placeholder="Enter war name..."
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Description
                  </Typography>
                  <textarea
                    value={warForm.description}
                    onChange={(e) =>
                      setWarForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className={styles.warTextarea}
                    placeholder="Enter war description..."
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleDeclareWar}
                    className={styles.declareWarButton}
                  >
                    Declare War
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowDeclareWar(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default ClanWarsPage;
