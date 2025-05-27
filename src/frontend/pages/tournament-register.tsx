import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  SelectChangeEvent, // Added for Select onChange type
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament'; // Assuming this fetches tournament details
import { useUser } from '@/frontend/hooks/useUser';       // Updated import path
import { Close as CloseIcon } from '@mui/icons-material';
// import TournamentPayment from '../components/TournamentPayment'; // Not used directly in this component

// It's good practice to define constants for default values or frequently used strings
const DEFAULT_DIVISION = 'open';
const MIN_TEAM_MEMBERS = 1;

interface TeamMember {
  id: string; // Or number, depending on how you identify members
  name: string;
}

interface FormData {
  teamName: string;
  teamMembers: TeamMember[]; // Changed to array of objects for potential future use (e.g., member IDs)
  division: string;
}

interface TournamentRegisterProps {
  tournamentId: string;
}

const TournamentRegister: React.FC<TournamentRegisterProps> = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { tournament, loading: tournamentLoading, error: tournamentError } = useTournament(tournamentId);
  const { user, updateUser } = useUser(); // Assuming user might have an ID, email etc.

  const [formData, setFormData] = useState<FormData>({
    teamName: '',
    teamMembers: [],
    division: DEFAULT_DIVISION,
  });
  const [newMemberName, setNewMemberName] = useState('');
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Populate division from tournament data once loaded
  useEffect(() => {
    if (tournament?.divisions && tournament.divisions.length > 0) {
      // Set default division to the first available if current formData.division is not in the list
      // or if you want to ensure it's always a valid one from the tournament
      if (!tournament.divisions.includes(formData.division)) {
        setFormData(prev => ({ ...prev, division: tournament.divisions![0] }));
      }
    } else if (tournament) { // Tournament loaded but no divisions
        setFormData(prev => ({ ...prev, division: DEFAULT_DIVISION })); // Fallback or handle as error
    }
  }, [tournament, formData.division]); // formData.division in deps to re-evaluate if it changes externally

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAddMember = useCallback(() => {
    const trimmedName = newMemberName.trim();
    if (trimmedName) {
      // Optional: Check for duplicate member names
      if (formData.teamMembers.some(member => member.name.toLowerCase() === trimmedName.toLowerCase())) {
        setRegistrationError('This member name has already been added.');
        return;
      }
      setFormData(prev => ({
        ...prev,
        teamMembers: [...prev.teamMembers, { id: Date.now().toString(), name: trimmedName }], // Simple ID for client-side
      }));
      setNewMemberName('');
      setRegistrationError(null); // Clear previous error
    } else {
        setRegistrationError('Member name cannot be empty.');
    }
  }, [newMemberName, formData.teamMembers]);

  const handleRemoveMember = useCallback((memberIdToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter(member => member.id !== memberIdToRemove),
    }));
  }, []);

  const validateForm = (): boolean => {
    if (!formData.teamName.trim()) {
      setRegistrationError('Team name is required.');
      return false;
    }
    if (formData.teamMembers.length < MIN_TEAM_MEMBERS) {
      setRegistrationError(`At least ${MIN_TEAM_MEMBERS} team member(s) are required.`);
      return false;
    }
    if (!tournament?.divisions?.includes(formData.division)) {
      setRegistrationError('Invalid division selected. Please choose a valid division.');
      return false;
    }
    if (tournament && new Date() > new Date(tournament.registrationDeadline)) {
      setRegistrationError('Registration deadline has passed.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!tournament || !user) { // Ensure user context is also loaded/available if needed for registration logic
        setRegistrationError('User or tournament data is not available.');
        return;
    }

    setRegistrationError(null); // Clear previous errors
    if (!validateForm()) {
      return;
    }

    setProcessing(true);

    try {
      // Simulate registration API call
      console.log('Registering with data:', {
        tournamentId: tournament.id, // Assuming tournament has an 'id'
        userId: user.id, // Assuming user has an 'id'
        teamName: formData.teamName,
        teamMembers: formData.teamMembers.map(m => m.name), // Send only names or full objects as needed
        division: formData.division,
      });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      // IMPORTANT: For production, team ID should ideally be generated by the backend.
      // The frontend update is optimistic or based on backend response.
      const newTeam = {
        id: `team_${Date.now().toString()}`, // Temporary client-side ID
        name: formData.teamName,
        members: formData.teamMembers.map(m => m.name), // Storing names, adjust if member objects needed
        division: formData.division,
        tournamentId,
      };

      // Update user's context (assuming updateUser handles immutability)
      // This logic might be more complex depending on your user object structure
      updateUser({
        ...user,
        tournaments: [...(user.tournaments || []), tournamentId], // Ensure user.tournaments is an array
        teams: [...(user.teams || []), newTeam], // Ensure user.teams is an array
      });

      navigate(`/tournaments/${tournamentId}/payment`);
    } catch (err) {
      // The error from validateForm is already set. This catch is for API call errors.
      setRegistrationError(err instanceof Error ? err.message : 'Failed to register for tournament. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return "Invalid Date";
    }
  };


  if (tournamentLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, flexDirection: 'column' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Loading tournament details...</Typography>
      </Container>
    );
  }

  if (tournamentError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', py: 4 }}>
        <Alert severity="error" sx={{width: '100%'}}>
          Failed to load tournament details: {tournamentError.message}
        </Alert>
      </Container>
    );
  }

  if (!tournament) {
    return (
       <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', py: 4 }}>
        <Alert severity="warning" sx={{width: '100%'}}>Tournament data not found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Register for: {tournament.name}
          </Typography>
        </Grid>

        {/* Tournament Details Card */}
        <Grid item xs={12} md={5}> {/* Adjusted grid size for potentially better layout */}
          <Card sx={{ p: { xs: 1, sm: 2 } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tournament Information
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong> {tournament.type?.replace('_', ' ') || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Registration Deadline:</strong> {formatDate(tournament.registrationDeadline)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Entry Fee:</strong> {tournament.entryFee ?? 'N/A'} Dojo Coins
              </Typography>
              {tournament.divisions && tournament.divisions.length > 0 && (
                <Typography variant="body1" gutterBottom>
                  <strong>Available Divisions:</strong> {tournament.divisions.join(', ')}
                </Typography>
              )}
              {/* Add more details as needed, e.g., tournament.description */}
            </CardContent>
          </Card>
        </Grid>

        {/* Registration Form Card */}
        <Grid item xs={12} md={7}> {/* Adjusted grid size */}
          <Card sx={{ p: { xs: 1, sm: 2 } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Registration
              </Typography>

              {registrationError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRegistrationError(null)}>
                  {registrationError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Team Name"
                    name="teamName" // Added name attribute for generic handler
                    value={formData.teamName}
                    onChange={handleInputChange}
                    disabled={processing}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{mt:1}}>Team Members ({formData.teamMembers.length})</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TextField
                      fullWidth
                      label="Add Team Member Name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember(); }}}
                      disabled={processing}
                      helperText="Press Enter or click 'Add Member'"
                      sx={{flexGrow: 1}}
                    />
                    <Button variant="outlined" onClick={handleAddMember} disabled={processing || !newMemberName.trim()} sx={{height: '56px' /* Align with TextField */}}>
                      Add Member
                    </Button>
                  </Box>
                  {formData.teamMembers.length > 0 && (
                    <List dense sx={{ mt: 1, maxHeight: 200, overflow: 'auto', border: '1px solid #ccc', borderRadius: '4px', p:1 }}>
                      {formData.teamMembers.map((member) => (
                        <ListItem
                          key={member.id}
                          secondaryAction={
                            <IconButton edge="end" aria-label="delete member" onClick={() => handleRemoveMember(member.id)} disabled={processing}>
                              <CloseIcon />
                            </IconButton>
                          }
                          sx={{borderBottom: '1px solid #eee', '&:last-child': {borderBottom: 'none'}}}
                        >
                          <ListItemText primary={member.name} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth disabled={processing} required>
                    <InputLabel id="division-select-label">Division</InputLabel>
                    <Select
                      labelId="division-select-label"
                      name="division" // Added name attribute
                      value={formData.division}
                      label="Division"
                      onChange={handleInputChange}
                    >
                      {tournament.divisions && tournament.divisions.length > 0 ? (
                        tournament.divisions.map((division) => (
                          <MenuItem key={division} value={division}>
                            {division.charAt(0).toUpperCase() + division.slice(1)} {/* Capitalize for display */}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value={DEFAULT_DIVISION} disabled>
                          {DEFAULT_DIVISION.charAt(0).toUpperCase() + DEFAULT_DIVISION.slice(1)} (default)
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sx={{mt: 2}}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleRegister}
                    disabled={processing || tournamentLoading} // Also disable if tournament data is still loading
                  >
                    {processing ? <CircularProgress size={24} color="inherit" /> : `Register & Proceed to Payment`}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

// This wrapper component is good for isolating useParams from the main component logic.
const TournamentRegisterPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();

  if (!tournamentId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Tournament ID is missing. Please check the URL.</Alert>
      </Container>
    );
  }

  return <TournamentRegister tournamentId={tournamentId} />;
};

export default TournamentRegisterPage;