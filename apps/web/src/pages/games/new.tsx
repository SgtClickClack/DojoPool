import ProtectedRoute from '@/components/Common/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { createGame, getPlayers } from '@/services/APIService';
import type { CreateGameRequest } from '@/types/game';
import { GameType } from '@/types/gameSession';
import type { UserProfile } from '@/types/user';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface GameFormState {
  opponentId: string;
  gameType: GameType;
  wager: string;
  venueId: string;
  notes: string;
}

const DEFAULT_FORM_STATE: GameFormState = {
  opponentId: '',
  gameType: GameType.EIGHT_BALL,
  wager: '',
  venueId: '',
  notes: '',
};

const NewGamePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<GameFormState>(DEFAULT_FORM_STATE);

  const availableOpponents = useMemo(
    () =>
      players.filter((candidate) => {
        if (!candidate) return false;
        if (candidate.id === user?.id) return false;
        return true;
      }),
    [players, user?.id]
  );

  const loadPlayers = useCallback(async () => {
    try {
      setLoadingPlayers(true);
      const results = await getPlayers();
      setPlayers(results);
    } catch (error) {
      console.error('Failed to load players:', error);
      setPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  }, []);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  const handleChange = (field: keyof GameFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!formState.opponentId) {
      setSubmitError('Please choose an opponent to challenge.');
      return;
    }

    let wagerValue: number | undefined;
    if (formState.wager.trim()) {
      const parsed = Number(formState.wager);
      if (Number.isNaN(parsed) || parsed < 0) {
        setSubmitError('Wager must be a positive number.');
        return;
      }
      wagerValue = parsed;
    }

    const payload: CreateGameRequest = {
      opponentId: formState.opponentId,
      gameType: formState.gameType,
      wager: wagerValue,
      venueId: formState.venueId || undefined,
      notes: formState.notes || undefined,
    };

    try {
      setIsSubmitting(true);
      const created = await createGame(payload);
      await router.push(`/matches/${created.id}`);
    } catch (error) {
      console.error('Failed to create game', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create game.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Create New Game — DojoPool</title>
      </Head>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Set Up a New Game
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Challenge rivals, choose your format, and make it interesting with
          optional wagers.
        </Typography>

        <Paper elevation={3} sx={{ mt: 4, p: { xs: 3, md: 4 } }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            data-testid="create-game-form"
          >
            {submitError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {submitError}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="opponent-label">Opponent</InputLabel>
                  <Select
                    labelId="opponent-label"
                    value={formState.opponentId}
                    label="Opponent"
                    onChange={(event) =>
                      handleChange('opponentId', event.target.value)
                    }
                    disabled={loadingPlayers}
                    data-testid="opponent-select"
                  >
                    {availableOpponents.map((opponent) => (
                      <MenuItem value={opponent.id} key={opponent.id}>
                        {opponent.displayName || opponent.username}
                      </MenuItem>
                    ))}
                    {availableOpponents.length === 0 && !loadingPlayers && (
                      <MenuItem value="" disabled>
                        No opponents available
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="game-type-label">Game Type</InputLabel>
                  <Select
                    labelId="game-type-label"
                    value={formState.gameType}
                    label="Game Type"
                    onChange={(event) =>
                      handleChange('gameType', event.target.value)
                    }
                    data-testid="game-type-select"
                  >
                    <MenuItem value={GameType.EIGHT_BALL}>8-Ball</MenuItem>
                    <MenuItem value={GameType.NINE_BALL}>9-Ball</MenuItem>
                    <MenuItem value={GameType.STRAIGHT_POOL}>
                      Straight Pool
                    </MenuItem>
                    <MenuItem value={GameType.BANK_POOL}>Bank Pool</MenuItem>
                    <MenuItem value={GameType.ONE_POCKET}>One Pocket</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Wager (DojoCoins)"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={formState.wager}
                  onChange={(event) =>
                    handleChange('wager', event.target.value)
                  }
                  data-testid="wager-input"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Preferred Venue"
                  placeholder="Optional — enter venue ID or name"
                  value={formState.venueId}
                  onChange={(event) =>
                    handleChange('venueId', event.target.value)
                  }
                  data-testid="venue-input"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Match Notes"
                  placeholder="Add additional rules, stipulations, or pre-game hype"
                  value={formState.notes}
                  onChange={(event) =>
                    handleChange('notes', event.target.value)
                  }
                  multiline
                  minRows={3}
                  data-testid="notes-input"
                />
              </Grid>
            </Grid>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={4}
            >
              {loadingPlayers ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Loading roster…
                  </Typography>
                </Box>
              ) : (
                <Button variant="text" onClick={() => void loadPlayers()}>
                  Refresh opponents
                </Button>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={
                  loadingPlayers ||
                  availableOpponents.length === 0 ||
                  isSubmitting
                }
                data-testid="create-game-submit"
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress
                      size={20}
                      sx={{ color: 'inherit', mr: 1 }}
                    />
                    Creating...
                  </>
                ) : (
                  'Create Game'
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </ProtectedRoute>
  );
};

export default NewGamePage;
