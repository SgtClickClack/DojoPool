import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Card, CardContent, Button, Chip, Grid, Avatar, Divider, Snackbar, Alert } from '@mui/material';
import { Group, EmojiEvents, TrendingUp, LocationOn, AccessTime, Star, Shield, Flag } from '@mui/icons-material';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import PageBackground from '../../components/common/PageBackground';
import { useClanSystem } from '../../hooks/useClanSystem';
import { Clan } from '../../services/clan/ClanSystemService';

const ClanWarsPage: React.FC = () => {
  const {
    userClan,
    clanMembers,
    activeClanWars,
    loading,
    error: clanError,
    loadUserClan,
    loadClanMembers,
    loadActiveClanWars,
    getTopClans,
    declareWar
  } = useClanSystem();

  const [rivalClans, setRivalClans] = useState<Clan[]>([]);
  const [loadingRivals, setLoadingRivals] = useState(false);
  const [declaringWar, setDeclaringWar] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await loadUserClan();
      await loadActiveClanWars();
      if (userClan) {
        await loadClanMembers();
      }
    };
    
    loadData();
  }, [loadUserClan, loadActiveClanWars, loadClanMembers, userClan]);

  // Load rival clans
  useEffect(() => {
    const loadRivals = async () => {
      setLoadingRivals(true);
      try {
        const clans = await getTopClans(10);
        // Filter out user's clan if present
        const rivals = userClan 
          ? clans.filter(clan => clan.id !== userClan.id)
          : clans;
        setRivalClans(rivals);
      } catch (err) {
        console.error('Error loading rival clans:', err);
      } finally {
        setLoadingRivals(false);
      }
    };
    
    loadRivals();
  }, [getTopClans, userClan]);

  // Handler for "Declare War" button
  const handleDeclareWar = async (clan: Clan) => {
    if (!userClan) {
      setNotification({
        open: true,
        message: 'You must be in a clan to declare war',
        severity: 'error'
      });
      return;
    }

    setDeclaringWar(true);
    
    try {
      // Create war data with appropriate values
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Start tomorrow
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7); // End 7 days after start
      
      const warData = {
        name: `${userClan.name} vs ${clan.name}`,
        description: `Epic battle between ${userClan.name} and ${clan.name} for territory dominance!`,
        startDate,
        endDate,
        rewards: {
          winner: 5000,
          loser: 500
        }
      };
      
      const result = await declareWar(clan.id, warData);
      
      if (result) {
        setNotification({
          open: true,
          message: `War declared on ${clan.name}! Prepare for battle!`,
          severity: 'success'
        });
        
        // Refresh the active wars list
        await loadActiveClanWars();
      } else {
        setNotification({
          open: true,
          message: 'Failed to declare war. Please try again.',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Error declaring war:', err);
      setNotification({
        open: true,
        message: 'An error occurred while declaring war',
        severity: 'error'
      });
    } finally {
      setDeclaringWar(false);
    }
  };
  
  // Handle closing the notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
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

          {/* My Clan Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                color: '#00ff9d',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 3,
                textAlign: 'center',
                textShadow: '0 0 10px rgba(0, 255, 157, 0.5)'
              }}
            >
              🏰 My Clan
            </Typography>

            {loading.clan ? (
              <Typography sx={{ textAlign: 'center', color: '#ccc' }}>Loading clan information...</Typography>
            ) : !userClan ? (
              <Card
                sx={{
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '2px solid #00ff9d',
                  borderRadius: 3,
                  boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                    You're not part of any clan yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
                    Join or create a clan to participate in clan wars and compete for territory control!
                  </Typography>
                </CardContent>
              </Card>
            ) : (
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      src={userClan.avatar} 
                      alt={userClan.name}
                      sx={{ width: 64, height: 64, mr: 2, border: '2px solid #00ff9d' }}
                    />
                    <Box>
                      <Typography variant="h5" sx={{ color: '#00ff9d', fontFamily: 'Orbitron, monospace' }}>
                        {userClan.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        [{userClan.tag}] • Level {userClan.level}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
                    {userClan.description}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Group sx={{ color: '#00ff9d', fontSize: 28, mb: 1 }} />
                        <Typography variant="h6" sx={{ color: '#00ff9d' }}>{userClan.memberCount}</Typography>
                        <Typography variant="body2" sx={{ color: '#ccc' }}>Members</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Flag sx={{ color: '#00ff9d', fontSize: 28, mb: 1 }} />
                        <Typography variant="h6" sx={{ color: '#00ff9d' }}>{userClan.territoryCount}</Typography>
                        <Typography variant="body2" sx={{ color: '#ccc' }}>Territories</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <EmojiEvents sx={{ color: '#00ff9d', fontSize: 28, mb: 1 }} />
                        <Typography variant="h6" sx={{ color: '#00ff9d' }}>{userClan.totalWins}</Typography>
                        <Typography variant="body2" sx={{ color: '#ccc' }}>Wins</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <TrendingUp sx={{ color: '#00ff9d', fontSize: 28, mb: 1 }} />
                        <Typography variant="h6" sx={{ color: '#00ff9d' }}>{Math.round(userClan.winRate * 100)}%</Typography>
                        <Typography variant="body2" sx={{ color: '#ccc' }}>Win Rate</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {loading.members ? (
                    <Typography sx={{ textAlign: 'center', color: '#ccc', mt: 3 }}>Loading members...</Typography>
                  ) : (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" sx={{ color: '#00a8ff', mb: 2 }}>
                        Top Members:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {clanMembers.slice(0, 5).map(member => (
                          <Chip
                            key={member.id}
                            avatar={<Avatar src={member.avatar} alt={member.username} />}
                            label={member.username}
                            sx={{
                              bgcolor: 'rgba(0, 168, 255, 0.1)',
                              color: '#00a8ff',
                              border: '1px solid #00a8ff'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>

          {/* Active Wars Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                color: '#ff6b6b',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 3,
                textAlign: 'center',
                textShadow: '0 0 10px rgba(255, 107, 107, 0.5)'
              }}
            >
              ⚔️ Active Wars
            </Typography>

            {loading.wars ? (
              <Typography sx={{ textAlign: 'center', color: '#ccc' }}>Loading wars...</Typography>
            ) : activeClanWars.length === 0 ? (
              <Card
                sx={{
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '2px solid #ff6b6b',
                  borderRadius: 3,
                  boxShadow: '0 0 30px rgba(255, 107, 107, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 2 }}>
                    No Active Wars
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
                    Your clan is not currently engaged in any wars. Challenge a rival clan to start a battle!
                  </Typography>
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
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
                        {war.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ textAlign: 'center', flex: 1 }}>
                          <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>{war.clan1Name}</Typography>
                          <Typography variant="h4" sx={{ color: '#00a8ff', fontWeight: 'bold' }}>{war.clan1Score}</Typography>
                        </Box>
                        <Box sx={{ mx: 2 }}>
                          <Typography variant="h5" sx={{ color: '#ff6b6b' }}>VS</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', flex: 1 }}>
                          <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>{war.clan2Name}</Typography>
                          <Typography variant="h4" sx={{ color: '#00a8ff', fontWeight: 'bold' }}>{war.clan2Score}</Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTime sx={{ color: '#00a8ff', fontSize: 16 }} />
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            {new Date(war.startDate).toLocaleDateString()} - {new Date(war.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Button
                          component={Link}
                          href={`/clan-wars/${war.id}`}
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

          {/* Rival Clans Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                color: '#feca57',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 3,
                textAlign: 'center',
                textShadow: '0 0 10px rgba(254, 202, 87, 0.5)'
              }}
            >
              🛡️ Rival Clans
            </Typography>

            {loadingRivals ? (
              <Typography sx={{ textAlign: 'center', color: '#ccc' }}>Loading rival clans...</Typography>
            ) : rivalClans.length === 0 ? (
              <Card
                sx={{
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '2px solid #feca57',
                  borderRadius: 3,
                  boxShadow: '0 0 30px rgba(254, 202, 87, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#feca57', mb: 2 }}>
                    No Rival Clans Found
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
                    There are no other clans available to challenge at the moment.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {rivalClans.map((clan) => (
                  <Card
                    key={clan.id}
                    sx={{
                      background: 'rgba(26, 26, 26, 0.9)',
                      border: '2px solid #feca57',
                      borderRadius: 3,
                      boxShadow: '0 0 30px rgba(254, 202, 87, 0.3)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={clan.avatar} 
                            alt={clan.name}
                            sx={{ width: 48, height: 48, mr: 2, border: '2px solid #feca57' }}
                          />
                          <Box>
                            <Typography variant="h6" sx={{ color: '#feca57', fontFamily: 'Orbitron, monospace' }}>
                              {clan.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ccc' }}>
                              [{clan.tag}] • Level {clan.level}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          onClick={() => handleDeclareWar(clan)}
                          disabled={declaringWar}
                          sx={{
                            background: 'linear-gradient(45deg, #ff6b6b 0%, #feca57 100%)',
                            color: '#000',
                            fontWeight: 'bold',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #feca57 0%, #ff6b6b 100%)',
                            },
                            '&.Mui-disabled': {
                              background: 'rgba(255, 107, 107, 0.5)',
                              color: 'rgba(0, 0, 0, 0.5)'
                            }
                          }}
                        >
                          {declaringWar ? 'Declaring War...' : 'Declare War'}
                        </Button>
                      </Box>
                      
                      <Divider sx={{ my: 2, borderColor: 'rgba(254, 202, 87, 0.3)' }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#ccc' }}>Members</Typography>
                            <Typography variant="h6" sx={{ color: '#feca57' }}>{clan.memberCount}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#ccc' }}>Territories</Typography>
                            <Typography variant="h6" sx={{ color: '#feca57' }}>{clan.territoryCount}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#ccc' }}>Wins</Typography>
                            <Typography variant="h6" sx={{ color: '#feca57' }}>{clan.totalWins}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#ccc' }}>Win Rate</Typography>
                            <Typography variant="h6" sx={{ color: '#feca57' }}>{Math.round(clan.winRate * 100)}%</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </Container>
      </PageBackground>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default ClanWarsPage;