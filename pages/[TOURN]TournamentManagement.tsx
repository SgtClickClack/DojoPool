/** @jsxImportSource react */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Add as AddIcon } from '@mui/icons-material';
import TournamentBracket from '../components/Tournament/TournamentBracket';
import { Tournament, TournamentMatch } from '../../types/tournament';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tournament-tabpanel-${index}`}
      aria-labelledby={`tournament-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const TournamentManagement: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    venue_id: '',
    start_date: new Date(),
    end_date: new Date(),
    registration_deadline: new Date(),
    max_participants: 8,
    entry_fee: 0,
    total_prize_pool: 0,
    rules: '',
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tournaments/active');
      setTournaments(response.data.tournaments);
      if (response.data.tournaments.length > 0) {
        setSelectedTournament(response.data.tournaments[0]);
      }
    } catch (err) {
      setError('Failed to fetch tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async () => {
    try {
      const response = await api.post('/tournaments', newTournament);
      setTournaments([...tournaments, response.data]);
      setCreateDialogOpen(false);
      setNewTournament({
        name: '',
        description: '',
        venue_id: '',
        start_date: new Date(),
        end_date: new Date(),
        registration_deadline: new Date(),
        max_participants: 8,
        entry_fee: 0,
        total_prize_pool: 0,
        rules: '',
      });
    } catch (err) {
      setError('Failed to create tournament');
    }
  };

  const handleRegisterForTournament = async (tournamentId: number) => {
    try {
      await api.post(`/tournaments/${tournamentId}/register`);
      // Refresh tournament data
      const response = await api.get(`/tournaments/${tournamentId}`);
      const updatedTournament = response.data;
      setTournaments(
        tournaments.map((t) => (t.id === updatedTournament.id ? updatedTournament : t))
      );
      setSelectedTournament(updatedTournament);
    } catch (err) {
      setError('Failed to register for tournament');
    }
  };

  const handleMatchClick = async (match: TournamentMatch) => {
    if (match.status === 'in_progress' && user?.id === selectedTournament?.organizer_id) {
      // Show match result dialog for tournament organizer
      // Implementation for match result update dialog
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Tournament Management
            </Typography>
          </Grid>
          <Grid item>
            {user?.id && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Tournament
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Active Tournaments" />
          <Tab label="My Tournaments" />
          <Tab label="Past Tournaments" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {tournaments.map((tournament) => (
              <Grid item xs={12} key={tournament.id}>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                      <Typography variant="h6">{tournament.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Start: {new Date(tournament.start_date).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Registration Deadline:{' '}
                        {new Date(tournament.registration_deadline).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleRegisterForTournament(tournament.id)}
                      >
                        Register
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {selectedTournament && (
            <TournamentBracket tournament={selectedTournament} onMatchClick={handleMatchClick} />
          )}
        </TabPanel>
      </Paper>

      {/* Create Tournament Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Tournament</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tournament Name"
                value={newTournament.name}
                onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newTournament.description}
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    description: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Venue ID"
                value={newTournament.venue_id}
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    venue_id: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Participants"
                value={newTournament.max_participants}
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    max_participants: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Entry Fee"
                value={newTournament.entry_fee}
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    entry_fee: parseFloat(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Prize Pool"
                value={newTournament.total_prize_pool}
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    total_prize_pool: parseFloat(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <DateTimePicker
                label="Start Date"
                value={newTournament.start_date}
                onChange={(date) =>
                  setNewTournament({
                    ...newTournament,
                    start_date: date || new Date(),
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <DateTimePicker
                label="End Date"
                value={newTournament.end_date}
                onChange={(date) =>
                  setNewTournament({
                    ...newTournament,
                    end_date: date || new Date(),
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <DateTimePicker
                label="Registration Deadline"
                value={newTournament.registration_deadline}
                onChange={(date) =>
                  setNewTournament({
                    ...newTournament,
                    registration_deadline: date || new Date(),
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Rules"
                value={newTournament.rules}
                onChange={(e) => setNewTournament({ ...newTournament, rules: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTournament} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TournamentManagement;
