import React from 'react';
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
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useUser } from '../hooks/useUser';
import TournamentPayment from '../components/TournamentPayment';

interface TournamentRegisterProps {
  tournamentId: string;
}

const TournamentRegister: React.FC<TournamentRegisterProps> = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { tournament, loading, error } = useTournament(tournamentId);
  const { user, updateUser } = useUser();
  const [formData, setFormData] = React.useState({
    teamName: '',
    teamMembers: [] as string[],
    division: 'open',
  });
  const [registrationError, setRegistrationError] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const handleRegister = async () => {
    if (!tournament) return;

    setProcessing(true);
    setRegistrationError(null);

    try {
      // Validate form data
      if (!formData.teamName.trim()) {
        throw new Error('Team name is required');
      }
      if (formData.teamMembers.length < 1) {
        throw new Error('At least one team member is required');
      }
      if (!tournament.divisions.includes(formData.division)) {
        throw new Error('Invalid division selected');
      }

      // Check registration deadline
      const deadline = new Date(tournament.registrationDeadline);
      if (new Date() > deadline) {
        throw new Error('Registration deadline has passed');
      }

      // Simulate registration API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Update user's tournament history
      updateUser({
        ...user,
        tournaments: [...(user.tournaments || []), tournamentId],
        teams: [...(user.teams || []), {
          id: Date.now().toString(),
          name: formData.teamName,
          members: formData.teamMembers,
          division: formData.division,
          tournamentId,
        }],
      });

      // Navigate to payment page
      navigate(`/tournaments/${tournamentId}/payment`);
    } catch (err) {
      setRegistrationError(
        err instanceof Error ? err.message : 'Failed to register for tournament'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Loading tournament registration...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography color="error">{error.message}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Register for {tournament.name}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tournament Details
              </Typography>
              <Typography variant="body1">
                Type: {tournament.type.replace('_', ' ')}
              </Typography>
              <Typography variant="body1">
                Registration Deadline: {tournament.registrationDeadline}
              </Typography>
              <Typography variant="body1">
                Entry Fee: {tournament.entryFee} Dojo Coins
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registration Form
              </Typography>

              {registrationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {registrationError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Team Name"
                    value={formData.teamName}
                    onChange={(e) =>
                      setFormData({ ...formData, teamName: e.target.value })
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Division</InputLabel>
                    <Select
                      value={formData.division}
                      label="Division"
                      onChange={(e) =>
                        setFormData({ ...formData, division: e.target.value })
                      }
                    >
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="amateur">Amateur</MenuItem>
                      <MenuItem value="professional">Professional</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleRegister}
                    disabled={!formData.teamName}
                  >
                    Register
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

export default TournamentRegister;
