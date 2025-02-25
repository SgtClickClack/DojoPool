import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import { validateTournamentName, validatePlayerCount } from '../../lib/validation';

interface Venue {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  venueId: string;
  startDate: string;
  maxPlayers: number;
  prizePool: number;
}

interface FormErrors {
  name?: string;
  venueId?: string;
  startDate?: string;
  maxPlayers?: string;
  prizePool?: string;
}

export default function CreateTournament() {
  const { user } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    venueId: '',
    startDate: '',
    maxPlayers: 8,
    prizePool: 0,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchVenues();
  }, [user, router]);

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venue/list');
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
    const errors: FormErrors = {};
    let isValid = true;

    if (!validateTournamentName(formData.name)) {
      errors.name = 'Tournament name must be between 3 and 100 characters';
      isValid = false;
    }

    if (!formData.venueId) {
      errors.venueId = 'Please select a venue';
      isValid = false;
    }

    if (!formData.startDate) {
      errors.startDate = 'Please select a start date';
      isValid = false;
    } else {
      const startDate = new Date(formData.startDate);
      const now = new Date();
      if (startDate < now) {
        errors.startDate = 'Start date must be in the future';
        isValid = false;
      }
    }

    if (!validatePlayerCount(formData.maxPlayers)) {
      errors.maxPlayers = 'Player count must be a power of 2 between 4 and 128';
      isValid = false;
    }

    if (formData.prizePool < 0) {
      errors.prizePool = 'Prize pool cannot be negative';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tournament/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tournament');
      }

      router.push(`/tournaments/${data.tournamentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name as string]: '',
      }));
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create Tournament
        </Typography>
        <Typography color="textSecondary" paragraph>
          Set up a new tournament and invite players to compete.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Tournament Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.venueId}>
                <InputLabel>Venue</InputLabel>
                <Select
                  value={formData.venueId}
                  name="venueId"
                  label="Venue"
                  onChange={handleChange}
                  disabled={loading}
                >
                  {venues.map((venue) => (
                    <MenuItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.venueId && (
                  <Typography color="error" variant="caption">
                    {formErrors.venueId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="datetime-local"
                label="Start Date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                error={!!formErrors.startDate}
                helperText={formErrors.startDate}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Maximum Players"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleChange}
                error={!!formErrors.maxPlayers}
                helperText={formErrors.maxPlayers}
                disabled={loading}
                inputProps={{ min: 4, max: 128, step: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Prize Pool"
                name="prizePool"
                value={formData.prizePool}
                onChange={handleChange}
                error={!!formErrors.prizePool}
                helperText={formErrors.prizePool}
                disabled={loading}
                InputProps={{
                  startAdornment: <Typography>$</Typography>,
                }}
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
                  {loading ? 'Creating...' : 'Create Tournament'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
} 