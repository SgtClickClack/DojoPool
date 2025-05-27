import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Alert, Grid, Divider, List, ListItem, ListItemText, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, TextField } from '@mui/material';
// Import the API function to get a single tournament
import { getTournament } from '@/frontend/api/tournaments'; 
import { getVenue } from '@/dojopool/frontend/api/venues'; // Adjusted path
import { joinTournament } from '@/frontend/api/tournaments'; // Import join function
// Import types
import { Tournament, Participant, TournamentStatus, Match } from '@/types/tournament'; // Import Match
import { Venue } from '@/dojopool/frontend/types/venue'; // Adjusted path
// Auth Hook
import { useAuth } from '@/frontend/contexts/AuthContext'; 
import { SocketIOService } from '@/services/WebSocketService'; // Add import
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
        return <Typography color="textSecondary">No participants registered yet.</Typography>;
    }

    return (
        <List dense> {/* dense for tighter spacing */}
            {participants.map(p => (
                <ListItem key={p.id}>
                    {/* TODO: Add avatar based on user ID if available */}
                    <Avatar sx={{ width: 24, height: 24, mr: 1.5 }}>{p.username.charAt(0)}</Avatar> 
                    <ListItemText primary={p.username} secondary={`Status: ${p.status}`} />
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
        <Typography variant="subtitle1" gutterBottom>Bracket</Typography>
        <Grid container spacing={2}>
          {rounds.map((roundMatches, roundIdx) => (
            <Grid item key={roundIdx} xs>
              <Paper sx={{ p: 1, mb: 2 }} elevation={2}>
                <Typography variant="body2" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {roundIdx === rounds.length - 1 ? 'Final' : `Round ${roundIdx + 1}`}
                </Typography>
                {roundMatches.map((match) => (
                  <Box key={match.id} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>
                      {match.participant1?.username || 'TBD'} vs {match.participant2?.username || 'TBD'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Status: {match.status} {match.score ? `| Score: ${match.score}` : ''}
                    </Typography>
                    {isAdmin && (match.status === 'pending' || match.status === 'in_progress') && (
                      <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => onReportResult && onReportResult(match)}>
                        Report Result
                      </Button>
                    )}
                  </Box>
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  // Fallback: participant-based bracket (legacy)
  if (!participants || participants.length < 2) {
    return <Typography color="textSecondary">Bracket will be generated when enough participants have registered.</Typography>;
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
      <Typography variant="subtitle1" gutterBottom>Single Elimination Bracket</Typography>
      <Grid container spacing={2}>
        {rounds.map((round, roundIdx) => (
          <Grid item key={roundIdx} xs>
            <Paper sx={{ p: 1, mb: 2 }} elevation={2}>
              <Typography variant="body2" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>
                {roundIdx === 0
                  ? 'Round 1'
                  : roundIdx === rounds.length - 1
                  ? 'Final'
                  : `Round ${roundIdx + 1}`}
              </Typography>
              {round.map((p, matchIdx) => {
                if (roundIdx === 0) {
                  const p2 = round[matchIdx + 1];
                  if (matchIdx % 2 === 0) {
                    return (
                      <Box key={p.id} sx={{ mb: 2 }}>
                        <Typography sx={{ minWidth: 120 }}>{p.username || 'TBD'}</Typography>
                        <Typography sx={{ mx: 1, display: 'inline' }}>vs</Typography>
                        <Typography sx={{ minWidth: 120, display: 'inline' }}>{p2?.username || 'TBD'}</Typography>
                      </Box>
                    );
                  }
                  return null;
                } else {
                  return (
                    <Box key={p.id} sx={{ mb: 2 }}>
                      <Typography sx={{ minWidth: 120 }}>{p.username || 'TBD'}</Typography>
                    </Box>
                  );
                }
              })}
            </Paper>
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

  useEffect(() => {
    if (!id) {
        setError("Tournament ID not found in URL.");
        setLoading(false);
        return;
    }

    const fetchTournamentDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTournament(id);
        setTournament(data);
        // Fetch venue details if venueId exists
        if (data.venueId) {
          setVenueLoading(true);
          try {
            const venueData = await getVenue(Number(data.venueId));
            setVenue(venueData);
          } catch {
            setError('Failed to load venue details.');
            setVenue(null);
          } finally {
            setVenueLoading(false);
          }
        } else {
          setVenue(null);
        }
      } catch (err) {
        console.error("Error fetching tournament details:", err);
        const message = err instanceof Error ? err.message : "Failed to load tournament details.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentDetails();

    // --- Real-time updates: join room and subscribe to updates ---
    const socket = SocketIOService.getInstance();
    socket.connect();
    // Join the tournament room for real-time updates
    socket.send && socket.send('join_tournament', { tournament_id: id });
    // Subscribe to tournament_update events
    const handleTournamentUpdate = (notification: unknown) => {
      if (
        notification &&
        typeof notification === 'object' &&
        'tournament_id' in notification &&
        (notification as { tournament_id?: string }).tournament_id === id
      ) {
        // Optionally: check update_type for more granular control
        fetchTournamentDetails();
      }
    };
    socket.on('tournament_update', handleTournamentUpdate);

    return () => {
      // Leave the tournament room and clean up listener
      socket.send && socket.send('leave_tournament', { tournament_id: id });
      socket.off('tournament_update', handleTournamentUpdate);
    };
  }, [id]);

  const handleRegister = async () => {
    if (!id || !user) return;
    setIsRegistering(true);
    setRegisterError(null);
    try {
      await joinTournament(id);
      setSnackbar({ open: true, message: 'Successfully registered!', severity: 'success' });
      setRegistrationStep(RegistrationStep.COMPLETED);
    } catch (err) {
      console.error('Registration error:', err);
      const message = err instanceof Error ? err.message : 'Failed to register.';
      setRegisterError(message);
      setSnackbar({ open: true, message: `Registration failed: ${message}`, severity: 'error' });
      setRegistrationStep(RegistrationStep.ERROR);
    } finally {
      setIsRegistering(false);
    }
  };

  // Function to render action buttons based on status
  const renderActionButtons = () => {
    if (!tournament || authLoading) return null;
    const isUserAuthenticated = user !== null;
    const isAlreadyRegistered = isUserAuthenticated && tournament.participantsList?.some(p => p.id === user.id);
    const canRegister =
      (tournament.status === TournamentStatus.OPEN || tournament.status === TournamentStatus.UPCOMING) &&
      isUserAuthenticated &&
      !isAlreadyRegistered &&
      tournament.participants < tournament.maxParticipants;
    return (
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        {canRegister && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setRegistrationStep(RegistrationStep.CONFIRM_DETAILS)}
            disabled={isRegistering}
          >
            {isRegistering ? <CircularProgress size={24} /> : 'Register Now'}
          </Button>
        )}
        {isAlreadyRegistered && (
          <Button variant="outlined" color="success" disabled>Already Registered</Button>
        )}
        {!isUserAuthenticated && (
          <Button variant="contained" color="primary" disabled>Login to Register</Button>
        )}
        {tournament.status === TournamentStatus.FULL && (
          <Button variant="outlined" disabled>Registration Full</Button>
        )}
        {tournament.status === TournamentStatus.CLOSED && (
          <Button variant="outlined" disabled>Registration Closed</Button>
        )}
        {tournament.status === TournamentStatus.ACTIVE && (
          <Button variant="outlined" disabled>Tournament In Progress</Button>
        )}
        {tournament.status === TournamentStatus.COMPLETED && (
          <Button variant="outlined" disabled>Tournament Completed</Button>
        )}
        {tournament.status === TournamentStatus.CANCELLED && (
          <Button variant="outlined" color="error" disabled>Tournament Cancelled</Button>
        )}
        {/* TODO: Add View Bracket button (conditionally) */}
        {/* TODO: Add Unregister button if user is registered */}
      </Box>
    );
  };

  // TODO: Replace with proper user typing when available
  const isAdmin = (typeof user === 'object' && user !== null && 'role' in user && (user as { role?: string }).role === 'admin') ||
    (tournament?.organizerId && typeof user === 'object' && user !== null && 'id' in user && (user as { id?: string }).id === tournament.organizerId);

  // Handler for reporting result
  const handleReportResult = async () => {
    if (!reportingMatch || !winnerId || !tournament) return;
    setReporting(true);
    setReportError(null);
    try {
      await submitMatchResult(
        tournament.id,
        reportingMatch.id,
        {
          status: 'completed',
          winner_id: winnerId,
          score: score || undefined,
        }
      );
      setSnackbar({ open: true, message: 'Result reported successfully!', severity: 'success' });
      setReportingMatch(null);
      setWinnerId('');
      setScore('');
    } catch (err: unknown) {
      let message = 'Failed to report result.';
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      }
      setReportError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
         <Alert severity="error">{error}</Alert>
      </Box>
     
    );
  }

  if (!tournament) {
    return (
       <Box sx={{ p: 3 }}>
         <Alert severity="warning">Tournament not found.</Alert>
       </Box>
    );
  }

  // Basic structure to display tournament details
  return (
    <>
      <Paper sx={{ p: 3, m: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            {tournament?.name}
          </Typography>
          {/* Render Action Buttons */} 
          {!loading && registrationStep === RegistrationStep.IDLE && renderActionButtons()} {/* Only show buttons if idle */}
        </Box>
        
        {/* Render content based on registration step */}
        {registrationStep === RegistrationStep.CONFIRM_DETAILS && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Confirm Registration Details</Typography>
            <Typography sx={{ mb: 2 }}>Please confirm your details before proceeding to the rules.</Typography>
            {/* TODO: Show user details here if available */}
            <Button variant="contained" onClick={() => setRegistrationStep(RegistrationStep.CONFIRM_RULES)} sx={{ mr: 1 }}>
              Next
            </Button>
            <Button variant="outlined" onClick={() => setRegistrationStep(RegistrationStep.IDLE)}>
              Cancel
            </Button>
          </Box>
        )}
        {registrationStep === RegistrationStep.CONFIRM_RULES && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Tournament Rules</Typography>
            <Typography sx={{ mb: 2 }}>Please review and accept the tournament rules to continue.</Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{tournament.rules || 'No rules provided.'}</Typography>
            </Box>
            <Button variant="contained" onClick={() => setRegistrationStep(RegistrationStep.PAYMENT)} sx={{ mr: 1 }}>
              Accept & Continue
            </Button>
            <Button variant="outlined" onClick={() => setRegistrationStep(RegistrationStep.CONFIRM_DETAILS)}>
              Back
            </Button>
            <Button variant="outlined" onClick={() => setRegistrationStep(RegistrationStep.IDLE)} sx={{ ml: 1 }}>
              Cancel
            </Button>
          </Box>
        )}
        {registrationStep === RegistrationStep.PAYMENT && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Payment</Typography>
            <Typography sx={{ mb: 2 }}>Pay the entry fee to complete your registration.</Typography>
            {/* TODO: Integrate with payment system if available */}
            {tournament.entryFee !== undefined ? (
              <Typography sx={{ mb: 2 }}>
                Entry Fee: <strong>{tournament.entryFee} {tournament.currency || ''}</strong>
              </Typography>
            ) : (
              <Typography sx={{ mb: 2 }}>No entry fee required.</Typography>
            )}
            <Button variant="contained" onClick={handleRegister} disabled={isRegistering} sx={{ mr: 1 }}>
              {isRegistering ? <CircularProgress size={24} /> : 'Pay & Register'}
            </Button>
            <Button variant="outlined" onClick={() => setRegistrationStep(RegistrationStep.CONFIRM_RULES)} disabled={isRegistering}>
              Back
            </Button>
            <Button variant="outlined" onClick={() => setRegistrationStep(RegistrationStep.IDLE)} disabled={isRegistering} sx={{ ml: 1 }}>
              Cancel
            </Button>
          </Box>
        )}

        {registrationStep === RegistrationStep.COMPLETED && (
          <Alert severity="success" sx={{ my: 2 }}>
            Registration successful!
          </Alert>
        )}

        {registrationStep === RegistrationStep.ERROR && registerError && (
           <Alert severity="error" sx={{ my: 2 }}>{registerError}</Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Core Details */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Details</Typography>
            <Typography><strong>Status:</strong> {tournament.status}</Typography>
            <Typography><strong>Format:</strong> {tournament.format}</Typography>
            <Typography><strong>Starts:</strong> {new Date(tournament.startDate).toLocaleString()}</Typography>
            {tournament.endDate && (
              <Typography><strong>Ends:</strong> {new Date(tournament.endDate).toLocaleString()}</Typography>
            )}
            <Typography><strong>Players:</strong> {tournament.participants} / {tournament.maxParticipants}</Typography>
            {tournament.entryFee !== undefined && (
              <Typography><strong>Entry Fee:</strong> {tournament.entryFee} {tournament.currency || ''}</Typography>
            )}
            {/* Venue line for test compatibility */}
            <Typography>
              <strong>Venue:</strong> {venueLoading ? 'Loading...' : venue ? venue.name : '(Details TBD)'}
            </Typography>
          </Grid>

          {/* Right Column: Description & Rules */}
          <Grid item xs={12} md={6}>
            {tournament.description && (
              <Box mb={2}>
                <Typography variant="h6" gutterBottom>Description</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{tournament.description}</Typography> 
              </Box>
            )}
            {tournament.rules && (
               <Box>
                <Typography variant="h6" gutterBottom>Rules</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{tournament.rules}</Typography> 
              </Box>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Participants List Section */}
        <Box>
          <Typography variant="h6" gutterBottom>Participants ({tournament?.participantsList?.length || 0})</Typography>
          <ParticipantsList participants={tournament?.participantsList} />
        </Box>

        <Divider sx={{ my: 3 }} />
        
        {/* Bracket Section */}
        <Box>
          <Typography variant="h6" gutterBottom>Bracket</Typography>
          <BracketSection
            matches={tournament.matches}
            participants={tournament.participantsList}
            isAdmin={Boolean(isAdmin)}
            onReportResult={(match) => {
              setReportingMatch(match);
              setWinnerId('');
              setScore('');
            }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />
        {/* Video Highlights Section */}
        <Box>
          <Typography variant="h6" gutterBottom>Video Highlights</Typography>
          <VideoHighlights tournamentId={tournament.id} />
        </Box>

      </Paper>
      {/* Result Reporting Modal */}
      <Dialog open={!!reportingMatch} onClose={() => setReportingMatch(null)}>
        <DialogTitle>Report Match Result</DialogTitle>
        <DialogContent>
          <Select
            fullWidth
            value={winnerId || ""}
            onChange={e => setWinnerId(e.target.value as string)}
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>Select Winner</MenuItem>
            {reportingMatch?.participant1 && (
              <MenuItem value={reportingMatch.participant1.id}>{reportingMatch.participant1.username}</MenuItem>
            )}
            {reportingMatch?.participant2 && (
              <MenuItem value={reportingMatch.participant2.id}>{reportingMatch.participant2.username}</MenuItem>
            )}
          </Select>
          <TextField
            fullWidth
            label="Score (optional)"
            value={score}
            onChange={e => setScore(e.target.value)}
            sx={{ mb: 2 }}
          />
          {reportError && <Alert severity="error">{reportError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportingMatch(null)} disabled={!!reporting}>Cancel</Button>
          <Button onClick={handleReportResult} disabled={Boolean(!winnerId || reporting)} variant="contained">{reporting ? 'Reporting...' : 'Submit'}</Button>
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default TournamentDetail; 