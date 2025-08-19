import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Group,
  EmojiEvents,
  TrendingUp,
  AccessTime,
  Star,
  Shield,
  Flag,
  ArrowBack,
  EmojiFlags,
} from '@mui/icons-material';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import PageBackground from '../../components/common/PageBackground';
import { clanWarService } from '../../services/clan/ClanWarService';
import {
  type ClanWar,
  clanSystemService,
} from '../../services/clan/ClanSystemService';
import { useAuth } from '../../components/auth/AuthContext';

const ClanWarDetailPage: React.FC = () => {
  const router = useRouter();
  const { warId } = router.query;
  const { user } = useAuth();

  const [war, setWar] = useState<ClanWar | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userClan, setUserClan] = useState<any>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const loadWarDetails = async () => {
      if (!warId || typeof warId !== 'string') return;

      setLoading(true);
      setError(null);

      try {
        const warData = await clanWarService.getWarById(warId);

        if (warData) {
          setWar(warData);
          // Process participants data
          const participantsData = clanWarService.getWarParticipants(warData);
          setParticipants(participantsData);
        } else {
          setError('War not found');
        }
      } catch (err) {
        console.error('Error loading war details:', err);
        setError('Failed to load war details');
      } finally {
        setLoading(false);
      }
    };

    loadWarDetails();
  }, [warId]);

  useEffect(() => {
    const loadUserClan = async () => {
      if (user) {
        try {
          const clan = await clanSystemService.getUserClan();
          setUserClan(clan);
        } catch (err) {
          console.error('Error loading user clan:', err);
        }
      }
    };

    loadUserClan();
  }, [user]);

  const claimTerritory = async () => {
    if (!warId || typeof warId !== 'string') return;

    setClaimLoading(true);
    setClaimError(null);
    setClaimMessage(null);

    try {
      const response = await fetch(`/api/clan-wars/${warId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setClaimMessage('Territory Claimed!');
        setSnackbarOpen(true);
        // Refresh war data to reflect changes
        const updatedWar = await clanWarService.getWarById(warId);
        if (updatedWar) {
          setWar(updatedWar);
        }
        // Optionally refresh the page or redirect to show updated map
        setTimeout(() => {
          router.push('/world-hub');
        }, 2000);
      } else {
        const errorData = await response.json();
        setClaimError(errorData.message || 'Failed to claim territory');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error claiming territory:', err);
      setClaimError('An error occurred while claiming territory');
      setSnackbarOpen(true);
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageBackground variant="social">
          <Container
            maxWidth="lg"
            sx={{ py: 4, position: 'relative', zIndex: 1, textAlign: 'center' }}
          >
            <CircularProgress sx={{ color: '#00ff9d', mt: 10 }} />
            <Typography sx={{ color: '#ccc', mt: 2 }}>
              Loading war details...
            </Typography>
          </Container>
        </PageBackground>
      </Layout>
    );
  }

  if (error || !war) {
    return (
      <Layout>
        <PageBackground variant="social">
          <Container
            maxWidth="lg"
            sx={{ py: 4, position: 'relative', zIndex: 1, textAlign: 'center' }}
          >
            <Typography variant="h5" sx={{ color: '#ff6b6b', mt: 10 }}>
              {error || 'War not found'}
            </Typography>
            <Button
              component={Link}
              href="/clan-wars"
              startIcon={<ArrowBack />}
              sx={{
                mt: 3,
                color: '#00ff9d',
                borderColor: '#00ff9d',
                '&:hover': {
                  borderColor: '#00ff9d',
                  backgroundColor: 'rgba(0, 255, 157, 0.1)',
                },
              }}
              variant="outlined"
            >
              Back to Clan Wars
            </Button>
          </Container>
        </PageBackground>
      </Layout>
    );
  }

  // Calculate time remaining
  const timeRemaining = clanWarService.getTimeRemaining(war.endDate);

  return (
    <Layout>
      <PageBackground variant="social">
        <Container
          maxWidth="lg"
          sx={{ py: 4, position: 'relative', zIndex: 1 }}
        >
          {/* Back Button */}
          <Box sx={{ mb: 3 }}>
            <Button
              component={Link}
              href="/clan-wars"
              startIcon={<ArrowBack />}
              sx={{
                color: '#00ff9d',
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 157, 0.1)',
                },
              }}
            >
              Back to Clan Wars
            </Button>
          </Box>

          {/* War Header */}
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              color: '#00ff9d',
              textShadow: '0 0 20px #00ff9d',
              mb: 1,
              textAlign: 'center',
            }}
          >
            ⚔️ {war.name}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Chip
              label={war.status.toUpperCase()}
              sx={{
                backgroundColor:
                  war.status === 'active'
                    ? '#ff6b6b'
                    : war.status === 'completed'
                      ? '#00a8ff'
                      : '#feca57',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                py: 0.5,
              }}
            />
          </Box>

          {/* Competing Clans Header */}
          <Card
            sx={{
              background: 'rgba(26, 26, 26, 0.9)',
              border: '2px solid #ff6b6b',
              borderRadius: 3,
              boxShadow: '0 0 30px rgba(255, 107, 107, 0.3)',
              backdropFilter: 'blur(10px)',
              mb: 4,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#ff6b6b',
                      fontFamily: 'Orbitron, monospace',
                      mb: 1,
                    }}
                  >
                    {war.clan1Name}
                  </Typography>
                  <Shield sx={{ color: '#ff6b6b', fontSize: 48, mb: 1 }} />
                </Box>
                <Box sx={{ mx: 2 }}>
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
                    sx={{
                      color: '#ff6b6b',
                      fontFamily: 'Orbitron, monospace',
                      mb: 1,
                    }}
                  >
                    {war.clan2Name}
                  </Typography>
                  <Shield sx={{ color: '#ff6b6b', fontSize: 48, mb: 1 }} />
                </Box>
              </Box>

              <Typography
                variant="body1"
                sx={{ color: '#ccc', mt: 2, textAlign: 'center' }}
              >
                {war.description}
              </Typography>
            </CardContent>
          </Card>

          {/* War Status Panel */}
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
            📊 War Status
          </Typography>

          <Card
            sx={{
              background: 'rgba(26, 26, 26, 0.9)',
              border: '2px solid #00a8ff',
              borderRadius: 3,
              boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              mb: 4,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                    {war.clan1Name}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ color: '#00a8ff', fontWeight: 'bold' }}
                  >
                    {war.clan1Score}
                  </Typography>
                </Box>
                <Box sx={{ mx: 2, textAlign: 'center' }}>
                  <AccessTime sx={{ color: '#00a8ff', fontSize: 24, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    {timeRemaining}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                    {war.clan2Name}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ color: '#00a8ff', fontWeight: 'bold' }}
                  >
                    {war.clan2Score}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(0, 168, 255, 0.3)' }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Start Date
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#00a8ff' }}>
                      {new Date(war.startDate).toLocaleDateString()}{' '}
                      {new Date(war.startDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      End Date
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#00a8ff' }}>
                      {new Date(war.endDate).toLocaleDateString()}{' '}
                      {new Date(war.endDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                  Rewards
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Winner
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {war.rewards.winner} coins
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Loser
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ff6b6b' }}>
                      {war.rewards.loser} coins
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Claim Territory Button */}
          {(() => {
            // Check if war has ended
            const warEnded = timeRemaining === 'Ended';

            // Check if territory has not been claimed (status is not 'completed')
            const territoryNotClaimed = war.status !== 'completed';

            // Determine winning clan
            const winningClanId =
              war.clan1Score > war.clan2Score
                ? war.clan1Id
                : war.clan2Score > war.clan1Score
                  ? war.clan2Id
                  : null;

            // Check if current user is leader of winning clan
            const isWinningClanLeader =
              userClan &&
              winningClanId === userClan.id &&
              user &&
              userClan.leaderId === user.uid;

            // Show button only if all conditions are met
            const shouldShowButton =
              warEnded && territoryNotClaimed && isWinningClanLeader;

            if (!shouldShowButton) return null;

            return (
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Button
                  onClick={claimTerritory}
                  disabled={claimLoading}
                  startIcon={
                    claimLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <EmojiFlags />
                    )
                  }
                  sx={{
                    background: 'linear-gradient(45deg, #00ff9d, #00a8ff)',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    py: 1.5,
                    px: 4,
                    borderRadius: 3,
                    textTransform: 'none',
                    boxShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #00a8ff, #00ff9d)',
                      boxShadow: '0 0 30px rgba(0, 255, 157, 0.7)',
                    },
                    '&:disabled': {
                      background: 'rgba(0, 255, 157, 0.3)',
                      color: 'rgba(0, 0, 0, 0.5)',
                    },
                  }}
                >
                  {claimLoading ? 'Claiming Territory...' : 'Claim Territory'}
                </Button>
              </Box>
            );
          })()}

          {/* Participants Leaderboard */}
          <Typography
            variant="h4"
            sx={{
              color: '#feca57',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
              mb: 3,
              textAlign: 'center',
              textShadow: '0 0 10px rgba(254, 202, 87, 0.5)',
            }}
          >
            🏆 Participants Leaderboard
          </Typography>

          <Card
            sx={{
              background: 'rgba(26, 26, 26, 0.9)',
              border: '2px solid #feca57',
              borderRadius: 3,
              boxShadow: '0 0 30px rgba(254, 202, 87, 0.3)',
              backdropFilter: 'blur(10px)',
              mb: 4,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {participants.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: '#ccc', py: 3 }}>
                  No matches have been played yet
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ color: '#feca57', fontWeight: 'bold' }}
                        >
                          Rank
                        </TableCell>
                        <TableCell
                          sx={{ color: '#feca57', fontWeight: 'bold' }}
                        >
                          Player
                        </TableCell>
                        <TableCell
                          sx={{ color: '#feca57', fontWeight: 'bold' }}
                        >
                          Clan
                        </TableCell>
                        <TableCell
                          sx={{ color: '#feca57', fontWeight: 'bold' }}
                        >
                          Score
                        </TableCell>
                        <TableCell
                          sx={{ color: '#feca57', fontWeight: 'bold' }}
                        >
                          W/L
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participants.map((player, index) => (
                        <TableRow key={player.id}>
                          <TableCell sx={{ color: '#ccc' }}>
                            #{index + 1}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }} />
                              <Typography sx={{ color: '#ccc' }}>
                                {player.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              color:
                                player.clanId === war.clan1Id
                                  ? '#ff6b6b'
                                  : '#00a8ff',
                            }}
                          >
                            {player.clanName}
                          </TableCell>
                          <TableCell
                            sx={{ color: '#00ff9d', fontWeight: 'bold' }}
                          >
                            {player.score}
                          </TableCell>
                          <TableCell sx={{ color: '#ccc' }}>
                            {player.wins}/{player.matches}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Match History (if needed) */}
          {war.matches.length > 0 && (
            <>
              <Typography
                variant="h4"
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mb: 3,
                  textAlign: 'center',
                  textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                }}
              >
                📜 Match History
              </Typography>

              <Card
                sx={{
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '2px solid #00ff9d',
                  borderRadius: 3,
                  boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
                  backdropFilter: 'blur(10px)',
                  mb: 4,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{ color: '#00ff9d', fontWeight: 'bold' }}
                          >
                            Date
                          </TableCell>
                          <TableCell
                            sx={{ color: '#00ff9d', fontWeight: 'bold' }}
                          >
                            Players
                          </TableCell>
                          <TableCell
                            sx={{ color: '#00ff9d', fontWeight: 'bold' }}
                          >
                            Score
                          </TableCell>
                          <TableCell
                            sx={{ color: '#00ff9d', fontWeight: 'bold' }}
                          >
                            Territory
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {war.matches.map((match) => (
                          <TableRow key={match.id}>
                            <TableCell sx={{ color: '#ccc' }}>
                              {new Date(match.timestamp).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography
                                  sx={{
                                    color:
                                      match.player1ClanId === war.clan1Id
                                        ? '#ff6b6b'
                                        : '#00a8ff',
                                  }}
                                >
                                  {match.player1Name}
                                </Typography>
                                <Typography sx={{ color: '#ccc' }}>
                                  vs
                                </Typography>
                                <Typography
                                  sx={{
                                    color:
                                      match.player2ClanId === war.clan1Id
                                        ? '#ff6b6b'
                                        : '#00a8ff',
                                  }}
                                >
                                  {match.player2Name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: '#ccc' }}>
                              {match.score}
                            </TableCell>
                            <TableCell sx={{ color: '#ccc' }}>
                              {match.territory}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          )}
        </Container>
      </PageBackground>

      {/* Success/Error Messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={claimMessage ? 'success' : 'error'}
          sx={{
            width: '100%',
            backgroundColor: claimMessage ? '#00ff9d' : '#ff6b6b',
            color: '#000',
            fontWeight: 'bold',
            '& .MuiAlert-icon': {
              color: '#000',
            },
          }}
        >
          {claimMessage || claimError}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default ClanWarDetailPage;
