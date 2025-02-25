import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';

interface Player {
  id: string;
  username: string;
  rating: number;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
}

interface FormData {
  game_type: 'casual' | 'ranked' | 'tournament';
  player2_id: string;
  venue_id: string;
  start_time: string;
}

export default function CreateGame() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    game_type: 'casual',
    player2_id: '',
    venue_id: '',
    start_time: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  useEffect(() => {
    fetchPlayers();
    fetchVenues();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players/list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch players');
      }

      setPlayers(data.players.filter((p: Player) => p.id !== user?.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players');
    }
  };

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venue/list?active=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch venues');
      }

      setVenues(data.venues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch venues');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.player2_id) {
      setError('Please select an opponent');
      return false;
    }

    if (!formData.venue_id) {
      setError('Please select a venue');
      return false;
    }

    if (!formData.start_time) {
      setError('Please select a start time');
      return false;
    }

    const startTime = new Date(formData.start_time);
    if (startTime < new Date()) {
      setError('Start time must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/games/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          player1_id: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create game');
      }

      router.push(`/games/${data.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Game
        </Typography>
        <Typography color="textSecondary" paragraph>
          Set up a new pool game and invite your opponent
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Game Type</InputLabel>
                <Select
                  value={formData.game_type}
                  label="Game Type"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      game_type: e.target.value as 'casual' | 'ranked' | 'tournament',
                    }))
                  }
                >
                  <MenuItem value="casual">Casual Game</MenuItem>
                  <MenuItem value="ranked">Ranked Match</MenuItem>
                  <MenuItem value="tournament">Tournament Game</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={players}
                getOptionLabel={(player) => `${player.username} (Rating: ${player.rating})`}
                value={selectedPlayer}
                onChange={(_, newValue) => {
                  setSelectedPlayer(newValue);
                  setFormData((prev) => ({
                    ...prev,
                    player2_id: newValue?.id || '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Opponent"
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={venues}
                getOptionLabel={(venue) => venue.name}
                value={selectedVenue}
                onChange={(_, newValue) => {
                  setSelectedVenue(newValue);
                  setFormData((prev) => ({
                    ...prev,
                    venue_id: newValue?.id || '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Venue"
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Creating...' : 'Create Game'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
} 