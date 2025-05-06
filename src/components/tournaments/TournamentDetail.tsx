import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Alert, Grid, Divider, List, ListItem, ListItemText, Avatar, Button } from '@mui/material';
// Import the API function to get a single tournament
import { getTournament } from '@/frontend/api/tournaments'; 
import { getVenue } from '@/dojopool/frontend/api/venues'; // Adjusted path
import { joinTournament } from '@/frontend/api/tournaments'; // Import join function
// Import types
import { Tournament, Participant, TournamentStatus } from '@/types/tournament'; // Reverted: No Round/Match 
import { Venue } from '@/dojopool/frontend/types/venue'; // Adjusted path
// Auth Hook
import { useAuth } from '@/frontend/contexts/AuthContext'; 

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
  const [venueError, setVenueError] = useState<string | null>(null);

  // State for registration action
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

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
          setVenueError(null);
          try {
            const venueData = await getVenue(Number(data.venueId));
            setVenue(venueData);
          } catch (venueErr) {
            setVenueError('Failed to load venue details.');
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
  }, [id]); // Re-run effect if id changes

  const handleRegister = async () => {
    if (!id || !user) return; // Check if user object exists

    setIsRegistering(true);
    setRegisterError(null);
    try {
      await joinTournament(id);
      // Show success feedback (Snackbar ideally, but alert for test compatibility)
      alert('Successfully registered!');
      // Optionally refresh tournament data to reflect new participant count/status
    } catch (err) {
      console.error("Registration error:", err);
      const message = err instanceof Error ? err.message : "Failed to register.";
      setRegisterError(message);
      // Show error feedback (Snackbar ideally, but alert for test compatibility)
      alert(`Registration failed: ${message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  // Function to render action buttons based on status
  const renderActionButtons = () => {
    if (!tournament || authLoading) return null; // Don't render buttons if auth is loading

    const isUserAuthenticated = user !== null; // Check if user object is not null

    // Basic registration logic
    const canRegister = 
        (tournament.status === TournamentStatus.OPEN || tournament.status === TournamentStatus.UPCOMING) &&
        isUserAuthenticated && // Use the derived boolean
        tournament.participants < tournament.maxParticipants;
        // TODO: Add check if user is already registered

    return (
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        {canRegister && (
           <Button 
             variant="contained" 
             color="primary"
             onClick={handleRegister}
             disabled={isRegistering}
           >
             {isRegistering ? <CircularProgress size={24} /> : 'Register Now'}
           </Button>
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
    <Paper sx={{ p: 3, m: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          {tournament?.name}
        </Typography>
        {/* Render Action Buttons */} 
        {!loading && renderActionButtons()}
      </Box>
      
      {registerError && (
        <Alert severity="error" sx={{ mb: 2 }}>{registerError}</Alert>
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
            <strong>Venue:</strong> {venueLoading ? 'Loading...' : venueError ? '(Failed to load venue details.)' : venue ? venue.name : '(Details TBD)'}
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
      
      {/* Placeholder for Bracket */}
      <Box>
        <Typography variant="h6" gutterBottom>Bracket</Typography>
        <Typography color="textSecondary">Bracket display component TBD.</Typography>
      </Box>

    </Paper>
  );
};

export default TournamentDetail; 