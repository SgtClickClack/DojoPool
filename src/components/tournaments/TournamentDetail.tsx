import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Alert, Grid, Divider, List, ListItem, ListItemText, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, TextField, Card, Chip } from '@mui/material';
import { EmojiEvents, People, Schedule, LocationOn, AttachMoney, SportsEsports, CheckCircle, Cancel, Warning } from '@mui/icons-material';
// Import the API function to get a single tournament
import { getTournament } from '@/frontend/api/tournaments'; 
import { getVenue } from '@/dojopool/frontend/api/venues'; // Adjusted path
import { joinTournament } from '@/frontend/api/tournaments'; // Import join function
// Import types
import { Tournament, Participant, TournamentStatus, Match } from '@/types/tournament'; // Import Match
import { Venue } from '@/dojopool/frontend/types/venue'; // Adjusted path
// Auth Hook
<<<<<<< Updated upstream
import { useAuth } from '@/components/auth/AuthContext'; 
=======
import { useAuth } from '../auth/AuthContext';
>>>>>>> Stashed changes
import { SocketIOService } from '@/services/network/WebSocketService'; // Fixed import path
import { submitMatchResult } from '@/services/tournament/tournament';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import VideoHighlights from '@/frontend/components/VideoHighlights';

// Define registration steps
enum RegistrationStep {
  IDLE = 'idle',
  CONFIRM_DETAILS = 'confirm-details',
  CONFIRM_RULES = 'confirm-rules',
  PAYMENT = 'payment',
  REGISTERING = 'registering',
  COMPLETED = 'completed',
  ERROR = 'error',
}

// Simple Participants List Component
interface ParticipantsListProps {
  participants?: Participant[]; // Make optional as it might not load immediately
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ participants }) => {
    if (!participants || participants.length === 0) {
        return <Typography sx={{ color: '#888', fontStyle: 'italic' }}>No participants registered yet.</Typography>;
    }

    return (
        <List dense sx={{ background: 'rgba(10, 10, 10, 0.8)', borderRadius: 1, p: 1 }}>
            {participants.map(p => (
                <ListItem key={p.id} sx={{ 
                    border: '1px solid rgba(0, 255, 157, 0.2)', 
                    borderRadius: 1, 
                    mb: 1,
                    background: 'rgba(0, 255, 157, 0.05)',
                    '&:hover': {
                        background: 'rgba(0, 255, 157, 0.1)',
                        borderColor: 'rgba(0, 255, 157, 0.4)',
                    }
                }}>
                    <Avatar sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 1.5,
                        background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
                        color: '#000',
                        fontWeight: 'bold'
                    }}>
                        {p.username.charAt(0).toUpperCase()}
                    </Avatar> 
                    <ListItemText 
                        primary={p.username} 
                        secondary={`Status: ${p.status}`}
                        primaryTypographyProps={{
                            sx: { 
                                color: '#fff', 
                                fontWeight: 600,
                                textShadow: '0 0 5px rgba(0, 255, 157, 0.5)'
                            }
                        }}
                        secondaryTypographyProps={{
                            sx: { color: '#888' }
                        }}
                    />
                </ListItem>
            ))}
        </List>
    );
};

// Move BracketSection definition above TournamentDetail to avoid redeclaration and linter errors
interface BracketSectionProps {
  matches?: Match[];
  participants?: Participant[];
  isAdmin?: boolean;
  onReportResult?: (match: Match) => void;
}

const BracketSection: React.FC<BracketSectionProps> = ({ matches, participants, isAdmin = false, onReportResult }) => {
  const cyberCardStyle = {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid #00ff9d',
    borderRadius: '15px',
    padding: '1.5rem',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.4s ease',
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px' as const,
    boxShadow: '0 0 30px rgba(0, 255, 157, 0.1), inset 0 0 30px rgba(0, 255, 157, 0.05)',
    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
    '&:hover': {
      transform: 'translateY(-5px) scale(1.02)',
      borderColor: '#00a8ff',
      boxShadow: '0 15px 40px rgba(0, 168, 255, 0.3), inset 0 0 40px rgba(0, 168, 255, 0.2)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent, rgba(0, 255, 157, 0.1), transparent)',
      transform: 'translateZ(-1px)',
    }
  };

  const neonTextStyle = {
    color: '#fff',
    textShadow: '0 0 10px rgba(0, 255, 157, 0.8), 0 0 20px rgba(0, 255, 157, 0.4), 0 0 30px rgba(0, 255, 157, 0.2)',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  };

  const cyberButtonStyle = {
    background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    padding: '8px 16px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontSize: '0.8rem',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
      background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: '0.5s',
    },
    '&:hover::before': {
      left: '100%',
    }
  };

  if (matches && matches.length > 0) {
    // Group matches by round
    const roundsMap = new Map<number, Match[]>();
    matches.forEach((match) => {
      if (!roundsMap.has(match.round)) {
        roundsMap.set(match.round, []);
      }
      roundsMap.get(match.round)!.push(match);
    });
    const rounds = Array.from(roundsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, ms]) => ms);

    return (
      <Box>
        <Typography variant="h5" sx={{ ...neonTextStyle, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents sx={{ color: '#00ff9d' }} />
          Tournament Bracket
        </Typography>
        <Grid container spacing={3}>
          {rounds.map((roundMatches, roundIdx) => (
            <Grid item key={roundIdx} xs={12} md={6} lg={4}>
              <Card sx={cyberCardStyle}>
                <Typography variant="h6" align="center" sx={{ 
                  ...neonTextStyle,
                  fontSize: '1.1rem',
                  mb: 2,
                  color: roundIdx === rounds.length - 1 ? '#ffff00' : '#00a8ff'
                }}>
                  {roundIdx === rounds.length - 1 ? '🏆 FINAL' : `ROUND ${roundIdx + 1}`}
                </Typography>
                {roundMatches.map((match) => (
                  <Box key={match.id} sx={{ 
                    mb: 2, 
                    p: 2, 
                    border: '1px solid rgba(0, 255, 157, 0.3)', 
                    borderRadius: 2,
                    background: 'rgba(0, 255, 157, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(0, 255, 157, 0.6)',
                      background: 'rgba(0, 255, 157, 0.1)',
                    }
                  }}>
                    <Typography sx={{ 
                      fontWeight: 'bold',
                      color: '#fff',
                      textShadow: '0 0 5px rgba(0, 255, 157, 0.5)',
                      mb: 1
                    }}>
                      {match.participant1?.username || 'TBD'} vs {match.participant2?.username || 'TBD'}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#888',
                      display: 'block',
                      mb: 1
                    }}>
                      Status: {match.status} {match.score ? `| Score: ${match.score}` : ''}
                    </Typography>
                    {isAdmin && (match.status === 'pending' || match.status === 'in_progress') && (
                      <Button 
                        size="small" 
                        sx={cyberButtonStyle}
                        onClick={() => onReportResult && onReportResult(match)}
                      >
                        Report Result
                      </Button>
                    )}
                  </Box>
                ))}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  // Fallback: participant-based bracket (legacy)
  if (!participants || participants.length < 2) {
    return (
      <Card sx={cyberCardStyle}>
        <Typography sx={{ color: '#888', textAlign: 'center', py: 4 }}>
          Bracket will be generated when enough participants have registered.
        </Typography>
      </Card>
    );
  }
  // ... existing participant-based bracket logic ...
  function generateBracket(participants: Participant[]): Participant[][] {
    const rounds: Participant[][] = [];
    let currentRound = participants.slice();
    while (currentRound.length > 1) {
      rounds.push(currentRound);
      const nextRound: Participant[] = [];
      for (let i = 0; i < currentRound.length; i += 2) {
        nextRound.push({
          id: `winner-${rounds.length}-${i/2}`,
          username: 'TBD',
          status: 'pending',
        } as Participant);
      }
      currentRound = nextRound;
    }
    if (currentRound.length === 1) {
      rounds.push(currentRound);
    }
    return rounds;
  }
  const rounds = generateBracket(participants);
  return (
    <Box>
      <Typography variant="h5" sx={{ ...neonTextStyle, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmojiEvents sx={{ color: '#00ff9d' }} />
        Single Elimination Bracket
      </Typography>
      <Grid container spacing={3}>
        {rounds.map((round, roundIdx) => (
          <Grid item key={roundIdx} xs={12} md={6} lg={4}>
            <Card sx={cyberCardStyle}>
              <Typography variant="h6" align="center" sx={{ 
                ...neonTextStyle,
                fontSize: '1.1rem',
                mb: 2,
                color: roundIdx === 0 ? '#00ff9d' : roundIdx === rounds.length - 1 ? '#ffff00' : '#00a8ff'
              }}>
                {roundIdx === 0
                  ? 'ROUND 1'
                  : roundIdx === rounds.length - 1
                  ? '🏆 FINAL'
                  : `ROUND ${roundIdx + 1}`}
              </Typography>
              {round.map((p, matchIdx) => {
                if (roundIdx === 0) {
                  const p2 = round[matchIdx + 1];
                  if (matchIdx % 2 === 0) {
                    return (
                      <Box key={p.id} sx={{ 
                        mb: 2,
                        p: 2,
                        border: '1px solid rgba(0, 255, 157, 0.3)',
                        borderRadius: 2,
                        background: 'rgba(0, 255, 157, 0.05)',
                        textAlign: 'center'
                      }}>
                        <Typography sx={{ 
                          color: '#fff',
                          fontWeight: 'bold',
                          textShadow: '0 0 5px rgba(0, 255, 157, 0.5)',
                          mb: 1
                        }}>
                          {p.username || 'TBD'}
                        </Typography>
                        <Typography sx={{ 
                          color: '#00ff9d',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          mb: 1
                        }}>
                          VS
                        </Typography>
                        <Typography sx={{ 
                          color: '#fff',
                          fontWeight: 'bold',
                          textShadow: '0 0 5px rgba(0, 255, 157, 0.5)'
                        }}>
                          {p2?.username || 'TBD'}
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                } else {
                  return (
                    <Box key={p.id} sx={{ 
                      mb: 2,
                      p: 2,
                      border: '1px solid rgba(0, 168, 255, 0.3)',
                      borderRadius: 2,
                      background: 'rgba(0, 168, 255, 0.05)',
                      textAlign: 'center'
                    }}>
                      <Typography sx={{ 
                        color: '#fff',
                        fontWeight: 'bold',
                        textShadow: '0 0 5px rgba(0, 168, 255, 0.5)'
                      }}>
                        {p.username || 'TBD'}
                      </Typography>
                    </Box>
                  );
                }
              })}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const TournamentDetail: React.FC = () => {
  // Get tournament ID from URL parameters
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth(); // Get user object and auth loading state
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for venue details
  const [venue, setVenue] = useState<Venue | null>(null);
  const [venueLoading, setVenueLoading] = useState<boolean>(false);

  // State for registration action and step
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>(RegistrationStep.IDLE);

  // State for result reporting modal
  const [reportingMatch, setReportingMatch] = useState<Match | null>(null);
  const [winnerId, setWinnerId] = useState<string>('');
  const [score, setScore] = useState<string>('');
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Cyberpunk styling
  const cyberCardStyle = {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid #00ff9d',
    borderRadius: '15px',
    padding: '2rem',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.4s ease',
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px' as const,
    boxShadow: '0 0 30px rgba(0, 255, 157, 0.1), inset 0 0 30px rgba(0, 255, 157, 0.05)',
    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
    '&:hover': {
      transform: 'translateY(-10px) scale(1.02)',
      borderColor: '#00a8ff',
      boxShadow: '0 15px 40px rgba(0, 168, 255, 0.3), inset 0 0 40px rgba(0, 168, 255, 0.2)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent, rgba(0, 255, 157, 0.1), transparent)',
      transform: 'translateZ(-1px)',
    }
  };

  const neonTextStyle = {
    color: '#fff',
    textShadow: '0 0 10px rgba(0, 255, 157, 0.8), 0 0 20px rgba(0, 255, 157, 0.4), 0 0 30px rgba(0, 255, 157, 0.2)',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  };

  const cyberButtonStyle = {
    background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    padding: '12px 24px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
      background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: '0.5s',
    },
    '&:hover::before': {
      left: '100%',
    }
  };

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.OPEN: return '#00ff9d';
      case TournamentStatus.ACTIVE: return '#00a8ff';
      case TournamentStatus.FULL: return '#ff00ff';
      case TournamentStatus.COMPLETED: return '#ffff00';
      case TournamentStatus.CANCELLED: return '#ff4444';
      default: return '#888888';
    }
  };

  useEffect(() => {
    if (!id) {
        setError("Tournament ID not found in URL.");
        setLoading(false);
        return;
    }

    const fetchTournamentDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const tournamentData = await getTournament(id);
            setTournament(tournamentData);

            // Fetch venue details if venue ID is available
            if (tournamentData.venueId) {
                setVenueLoading(true);
                try {
                    const venueData = await getVenue(Number(tournamentData.venueId));
                    setVenue(venueData);
                } catch (venueError) {
                    console.error('Failed to fetch venue details:', venueError);
                    // Don't fail the whole component if venue fetch fails
                } finally {
                    setVenueLoading(false);
                }
            }
        } catch (err) {
            console.error('Failed to fetch tournament details:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    fetchTournamentDetails();

    // Real-time: subscribe to tournament updates
    const socket = SocketIOService;
    const handleTournamentUpdate = (notification: unknown) => {
        console.log('Tournament update received:', notification);
        // Refresh tournament data
        fetchTournamentDetails();
    };
    const unsubscribe = socket.subscribe('tournament_updates', handleTournamentUpdate);

    return () => {
        // Cleanup subscription
        unsubscribe();
    };
  }, [id]);

  const handleRegister = async () => {
    if (!tournament || !user) return;
    
    try {
        setIsRegistering(true);
        setRegisterError(null);
        setRegistrationStep(RegistrationStep.REGISTERING);
        
        await joinTournament(tournament.id);
        
        setRegistrationStep(RegistrationStep.COMPLETED);
        setSnackbar({
            open: true,
            message: 'Successfully registered for tournament!',
            severity: 'success',
        });
        
        // Refresh tournament data to show updated participant count
        // You might want to refetch tournament data here
    } catch (err) {
        console.error('Registration failed:', err);
        setRegisterError(err instanceof Error ? err.message : 'Registration failed');
        setRegistrationStep(RegistrationStep.ERROR);
        setSnackbar({
            open: true,
            message: 'Registration failed. Please try again.',
            severity: 'error',
        });
    } finally {
        setIsRegistering(false);
    }
  };

  const renderActionButtons = () => {
    if (!tournament || !user) return null;

    const isRegistered = tournament.participantsList?.some(p => p.id === user.uid);
    const isAdmin = false; // TODO: Replace with real admin check

    if (isRegistered) {
        return (
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip 
                    label="Registered" 
                    color="success" 
                    icon={<CheckCircle />}
                    sx={{
                        background: 'rgba(0, 255, 157, 0.2)',
                        border: '1px solid #00ff9d',
                        color: '#00ff9d',
                        textShadow: '0 0 5px #00ff9d',
                        fontWeight: 600,
                    }}
                />
                {isAdmin && (
                    <Button 
                        variant="outlined" 
                        sx={{
                            borderColor: '#00a8ff',
                            color: '#00a8ff',
                            '&:hover': {
                                borderColor: '#00ff9d',
                                color: '#00ff9d',
                                boxShadow: '0 0 10px rgba(0, 168, 255, 0.3)',
                            }
                        }}
                    >
                        Manage Tournament
                    </Button>
                )}
            </Box>
        );
    }

    if (tournament.status === TournamentStatus.OPEN && tournament.participants < tournament.maxParticipants) {
        return (
            <Button 
                variant="contained" 
                onClick={() => setRegistrationStep(RegistrationStep.CONFIRM_DETAILS)}
                sx={cyberButtonStyle}
                startIcon={<EmojiEvents />}
            >
                Register Now
            </Button>
        );
    }

    if (tournament.status === TournamentStatus.FULL) {
        return (
            <Chip 
                label="Tournament Full" 
                color="warning" 
                icon={<Warning />}
                sx={{
                    background: 'rgba(255, 0, 255, 0.2)',
                    border: '1px solid #ff00ff',
                    color: '#ff00ff',
                    textShadow: '0 0 5px #ff00ff',
                    fontWeight: 600,
                }}
            />
        );
    }

    if (tournament.status === TournamentStatus.CLOSED || tournament.status === TournamentStatus.COMPLETED) {
        return (
            <Chip 
                label={tournament.status === TournamentStatus.COMPLETED ? 'Completed' : 'Registration Closed'} 
                color="default" 
                icon={<Cancel />}
                sx={{
                    background: 'rgba(136, 136, 136, 0.2)',
                    border: '1px solid #888888',
                    color: '#888888',
                    textShadow: '0 0 5px #888888',
                    fontWeight: 600,
                }}
            />
        );
    }

    return null;
  };

  const handleReportResult = async () => {
    if (!reportingMatch || !winnerId) return;

    try {
        setReporting(true);
        setReportError(null);
        
        await submitMatchResult(reportingMatch.id, winnerId, score);
        
        setSnackbar({
            open: true,
            message: 'Match result reported successfully!',
            severity: 'success',
        });
        
        setReportingMatch(null);
        setWinnerId('');
        setScore('');
        
        // Refresh tournament data
        // You might want to refetch tournament data here
    } catch (err) {
        console.error('Failed to report result:', err);
        setReportError(err instanceof Error ? err.message : 'Failed to report result');
        setSnackbar({
            open: true,
            message: 'Failed to report result. Please try again.',
            severity: 'error',
        });
    } finally {
        setReporting(false);
    }
  };

  if (authLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          borderRadius: 2,
          border: '1px solid rgba(0, 255, 157, 0.2)',
          boxShadow: '0 0 20px rgba(0, 255, 157, 0.1)'
        }}
      >
        <CircularProgress 
          sx={{ 
            color: '#00ff9d',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          borderRadius: 2,
          border: '1px solid rgba(0, 255, 157, 0.2)',
          boxShadow: '0 0 20px rgba(0, 255, 157, 0.1)'
        }}
      >
        <CircularProgress 
          sx={{ 
            color: '#00ff9d',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
      </Box>
    );
  }

  if (error || !tournament) {
    return (
      <Alert severity="error" sx={{ 
        background: 'rgba(255, 68, 68, 0.1)',
        border: '1px solid #ff4444',
        color: '#ff4444',
        '& .MuiAlert-icon': { color: '#ff4444' }
      }}>
        {error || 'Tournament not found'}
      </Alert>
    );
  }

  return (
    <>
      <Box 
        sx={{ 
          p: 3,
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          minHeight: '100vh',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(transparent 95%, rgba(0,255,157,0.2) 95%),
              linear-gradient(90deg, transparent 95%, rgba(0,255,157,0.2) 95%)
            `,
            backgroundSize: '50px 50px',
            opacity: 0.15,
            pointerEvents: 'none',
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Card sx={cyberCardStyle}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h3" sx={{ ...neonTextStyle, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmojiEvents sx={{ fontSize: '2.5rem', color: '#00ff9d' }} />
                  {tournament.name}
                </Typography>
                <Chip 
                  label={tournament.status} 
                  sx={{
                    background: `rgba(${tournament.status === TournamentStatus.OPEN ? '0, 255, 157' : tournament.status === TournamentStatus.ACTIVE ? '0, 168, 255' : tournament.status === TournamentStatus.FULL ? '255, 0, 255' : tournament.status === TournamentStatus.COMPLETED ? '255, 255, 0' : tournament.status === TournamentStatus.CANCELLED ? '255, 68, 68' : '136, 136, 136'}, 0.2)`,
                    border: `1px solid ${getStatusColor(tournament.status)}`,
                    color: getStatusColor(tournament.status),
                    textShadow: `0 0 5px ${getStatusColor(tournament.status)}`,
                    fontWeight: 600,
                    letterSpacing: '1px',
                  }}
                />
              </Box>
              {/* Render Action Buttons */} 
              {!loading && registrationStep === RegistrationStep.IDLE && renderActionButtons()}
            </Box>
            
            {/* Render content based on registration step */}
            {registrationStep === RegistrationStep.CONFIRM_DETAILS && (
              <Card sx={{ ...cyberCardStyle, mb: 3, background: 'rgba(0, 168, 255, 0.1)' }}>
                <Typography variant="h5" sx={{ ...neonTextStyle, mb: 2, color: '#00a8ff' }}>
                  Confirm Registration Details
                </Typography>
                <Typography sx={{ mb: 3, color: '#fff' }}>
                  Please confirm your details before proceeding to the rules.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button sx={cyberButtonStyle} onClick={() => setRegistrationStep(RegistrationStep.CONFIRM_RULES)}>
                    Next
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setRegistrationStep(RegistrationStep.IDLE)}
                    sx={{
                      borderColor: '#888',
                      color: '#888',
                      '&:hover': {
                        borderColor: '#fff',
                        color: '#fff',
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Card>
            )}
            
            {registrationStep === RegistrationStep.CONFIRM_RULES && (
              <Card sx={{ ...cyberCardStyle, mb: 3, background: 'rgba(0, 168, 255, 0.1)' }}>
                <Typography variant="h5" sx={{ ...neonTextStyle, mb: 2, color: '#00a8ff' }}>
                  Tournament Rules
                </Typography>
                <Typography sx={{ mb: 3, color: '#fff' }}>
                  Please review and accept the tournament rules to continue.
                </Typography>
                <Box sx={{ 
                  maxHeight: 200, 
                  overflow: 'auto', 
                  mb: 3,
                  p: 2,
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(0, 255, 157, 0.3)',
                  borderRadius: 1
                }}>
                  <Typography sx={{ whiteSpace: 'pre-wrap', color: '#fff' }}>
                    {tournament.rules || 'No rules provided.'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button sx={cyberButtonStyle} onClick={() => setRegistrationStep(RegistrationStep.PAYMENT)}>
                    Accept & Continue
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setRegistrationStep(RegistrationStep.CONFIRM_DETAILS)}
                    sx={{
                      borderColor: '#888',
                      color: '#888',
                      '&:hover': {
                        borderColor: '#fff',
                        color: '#fff',
                      }
                    }}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setRegistrationStep(RegistrationStep.IDLE)}
                    sx={{
                      borderColor: '#888',
                      color: '#888',
                      '&:hover': {
                        borderColor: '#fff',
                        color: '#fff',
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Card>
            )}
            
            {registrationStep === RegistrationStep.PAYMENT && (
              <Card sx={{ ...cyberCardStyle, mb: 3, background: 'rgba(0, 168, 255, 0.1)' }}>
                <Typography variant="h5" sx={{ ...neonTextStyle, mb: 2, color: '#00a8ff' }}>
                  Payment
                </Typography>
                <Typography sx={{ mb: 3, color: '#fff' }}>
                  Pay the entry fee to complete your registration.
                </Typography>
                {tournament.entryFee !== undefined ? (
                  <Typography sx={{ mb: 3, color: '#00ff9d', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Entry Fee: <strong>{tournament.entryFee} {tournament.currency || 'coins'}</strong>
                  </Typography>
                ) : (
                  <Typography sx={{ mb: 3, color: '#00ff9d' }}>
                    No entry fee required.
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    sx={cyberButtonStyle} 
                    onClick={handleRegister} 
                    disabled={isRegistering}
                    startIcon={isRegistering ? <CircularProgress size={20} sx={{ color: '#000' }} /> : null}
                  >
                    {isRegistering ? 'Processing...' : 'Pay & Register'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setRegistrationStep(RegistrationStep.CONFIRM_RULES)} 
                    disabled={isRegistering}
                    sx={{
                      borderColor: '#888',
                      color: '#888',
                      '&:hover': {
                        borderColor: '#fff',
                        color: '#fff',
                      }
                    }}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setRegistrationStep(RegistrationStep.IDLE)} 
                    disabled={isRegistering}
                    sx={{
                      borderColor: '#888',
                      color: '#888',
                      '&:hover': {
                        borderColor: '#fff',
                        color: '#fff',
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Card>
            )}

            {registrationStep === RegistrationStep.COMPLETED && (
              <Alert severity="success" sx={{ 
                mb: 3,
                background: 'rgba(0, 255, 157, 0.1)',
                border: '1px solid #00ff9d',
                color: '#00ff9d',
                '& .MuiAlert-icon': { color: '#00ff9d' }
              }}>
                Registration successful!
              </Alert>
            )}

            {registrationStep === RegistrationStep.ERROR && registerError && (
               <Alert severity="error" sx={{ 
                 mb: 3,
                 background: 'rgba(255, 68, 68, 0.1)',
                 border: '1px solid #ff4444',
                 color: '#ff4444',
                 '& .MuiAlert-icon': { color: '#ff4444' }
               }}>
                 {registerError}
               </Alert>
            )}

            <Grid container spacing={3}>
              {/* Left Column: Core Details */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...cyberCardStyle, background: 'rgba(0, 255, 157, 0.05)' }}>
                  <Typography variant="h5" sx={{ ...neonTextStyle, mb: 3, color: '#00ff9d', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SportsEsports sx={{ color: '#00ff9d' }} />
                    Tournament Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Status" size="small" sx={{ background: 'rgba(0, 168, 255, 0.2)', color: '#00a8ff', border: '1px solid #00a8ff' }} />
                      <Typography sx={{ color: '#fff', fontWeight: 600 }}>{tournament.status}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Format" size="small" sx={{ background: 'rgba(0, 168, 255, 0.2)', color: '#00a8ff', border: '1px solid #00a8ff' }} />
                      <Typography sx={{ color: '#fff', fontWeight: 600 }}>{tournament.format}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ color: '#00ff9d' }} />
                      <Typography sx={{ color: '#fff' }}>
                        Starts: {new Date(tournament.startDate).toLocaleString()}
                      </Typography>
                    </Box>
                    {tournament.endDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule sx={{ color: '#00ff9d' }} />
                        <Typography sx={{ color: '#fff' }}>
                          Ends: {new Date(tournament.endDate).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People sx={{ color: '#00ff9d' }} />
                      <Typography sx={{ color: '#fff' }}>
                        Players: {tournament.participants} / {tournament.maxParticipants}
                      </Typography>
                    </Box>
                    {tournament.entryFee !== undefined && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney sx={{ color: '#00ff9d' }} />
                        <Typography sx={{ color: '#fff' }}>
                          Entry Fee: {tournament.entryFee} {tournament.currency || 'coins'}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn sx={{ color: '#00ff9d' }} />
                      <Typography sx={{ color: '#fff' }}>
                        Venue: {venueLoading ? 'Loading...' : venue ? venue.name : '(Details TBD)'}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* Right Column: Description & Rules */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...cyberCardStyle, background: 'rgba(0, 168, 255, 0.05)' }}>
                  {tournament.description && (
                    <Box mb={3}>
                      <Typography variant="h5" sx={{ ...neonTextStyle, mb: 2, color: '#00a8ff' }}>
                        Description
                      </Typography>
                      <Typography sx={{ whiteSpace: 'pre-wrap', color: '#fff' }}>
                        {tournament.description}
                      </Typography> 
                    </Box>
                  )}
                  {tournament.rules && (
                     <Box>
                      <Typography variant="h5" sx={{ ...neonTextStyle, mb: 2, color: '#00a8ff' }}>
                        Rules
                      </Typography>
                      <Typography sx={{ whiteSpace: 'pre-wrap', color: '#fff' }}>
                        {tournament.rules}
                      </Typography> 
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Participants List Section */}
            <Card sx={{ ...cyberCardStyle, mb: 3 }}>
              <Typography variant="h5" sx={{ ...neonTextStyle, mb: 3, color: '#00ff9d', display: 'flex', alignItems: 'center', gap: 1 }}>
                <People sx={{ color: '#00ff9d' }} />
                Participants ({tournament?.participantsList?.length || 0})
              </Typography>
              <ParticipantsList participants={tournament?.participantsList} />
            </Card>

            <Divider sx={{ my: 4, borderColor: 'rgba(0, 255, 157, 0.3)' }} />
            
            {/* Bracket Section */}
            <Card sx={{ ...cyberCardStyle, mb: 3 }}>
              <BracketSection
                matches={tournament.matches}
                participants={tournament.participantsList}
                isAdmin={Boolean(false)} // TODO: Replace with real admin check
                onReportResult={(match) => {
                  setReportingMatch(match);
                  setWinnerId('');
                  setScore('');
                }}
              />
            </Card>

            <Divider sx={{ my: 4, borderColor: 'rgba(0, 255, 157, 0.3)' }} />
            
            {/* Video Highlights Section */}
            <Card sx={{ ...cyberCardStyle }}>
              <Typography variant="h5" sx={{ ...neonTextStyle, mb: 3, color: '#00ff9d' }}>
                Video Highlights
              </Typography>
              <VideoHighlights tournamentId={tournament.id} />
            </Card>
          </Card>
        </Box>
      </Box>

      {/* Result Reporting Modal */}
      <Dialog 
        open={!!reportingMatch} 
        onClose={() => setReportingMatch(null)}
        PaperProps={{
          sx: {
            background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid #00ff9d',
            borderRadius: '15px',
            color: '#fff',
          }
        }}
      >
        <DialogTitle sx={{ ...neonTextStyle, color: '#00ff9d' }}>
          Report Match Result
        </DialogTitle>
        <DialogContent>
          <Select
            fullWidth
            value={winnerId || ""}
            onChange={e => setWinnerId(e.target.value as string)}
            displayEmpty
            sx={{ 
              mb: 2,
              color: '#fff',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00ff9d',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00a8ff',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00ff9d',
              },
            }}
          >
            <MenuItem value="" disabled sx={{ color: '#888' }}>Select Winner</MenuItem>
            {reportingMatch?.participant1 && (
              <MenuItem value={reportingMatch.participant1.id} sx={{ color: '#fff' }}>
                {reportingMatch.participant1.username}
              </MenuItem>
            )}
            {reportingMatch?.participant2 && (
              <MenuItem value={reportingMatch.participant2.id} sx={{ color: '#fff' }}>
                {reportingMatch.participant2.username}
              </MenuItem>
            )}
          </Select>
          <TextField
            fullWidth
            label="Score (optional)"
            value={score}
            onChange={e => setScore(e.target.value)}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': {
                  borderColor: '#00ff9d',
                },
                '&:hover fieldset': {
                  borderColor: '#00a8ff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00ff9d',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#00ff9d',
                '&.Mui-focused': {
                  color: '#00a8ff',
                },
              },
            }}
          />
          {reportError && (
            <Alert severity="error" sx={{ 
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid #ff4444',
              color: '#ff4444',
              '& .MuiAlert-icon': { color: '#ff4444' }
            }}>
              {reportError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReportingMatch(null)} 
            disabled={!!reporting}
            sx={{
              color: '#888',
              '&:hover': {
                color: '#fff',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReportResult} 
            disabled={Boolean(!winnerId || reporting)} 
            sx={cyberButtonStyle}
          >
            {reporting ? 'Reporting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for user feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{ 
            width: '100%',
            background: snackbar.severity === 'success' ? 'rgba(0, 255, 157, 0.9)' : 'rgba(255, 68, 68, 0.9)',
            color: '#000',
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default TournamentDetail; 