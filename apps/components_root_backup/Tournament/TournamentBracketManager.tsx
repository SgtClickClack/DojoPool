import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTournamentBracket } from '../../hooks/useTournamentBracket';
import {
  TournamentFormat,
  TournamentStatus,
  type Tournament,
  type TournamentPlayer,
} from '../../types/tournament';
import TournamentBracket from './[TOURN]TournamentBracket';

interface TournamentBracketManagerProps {
  initialTournament?: Tournament;
  initialPlayers?: TournamentPlayer[];
  onBracketGenerated?: (tournament: Tournament) => void;
}

const TournamentBracketManager: React.FC<TournamentBracketManagerProps> = ({
  initialTournament,
  initialPlayers = [],
  onBracketGenerated,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [playerRank, setPlayerRank] = useState(1);

  const {
    tournament,
    players,
    bracketOptions,
    isGenerating,
    generateBracket,
    updateBracketOptions,
    resetBracket,
    addPlayer,
    removePlayer,
    updatePlayer,
    reorderPlayers,
  } = useTournamentBracket();

  // Initialize with props if provided
  React.useEffect(() => {
    if (initialTournament && initialPlayers.length > 0) {
      generateBracket(initialTournament, initialPlayers);
    }
  }, [initialTournament, initialPlayers, generateBracket]);

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      const newPlayer: TournamentPlayer = {
        id: `player-${Date.now()}`,
        name: playerName.trim(),
        rank: playerRank,
        status: 'ACTIVE',
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
      };
      addPlayer(newPlayer);
      setPlayerName('');
      setPlayerRank(players.length + 2);
    }
  };

  const handleGenerateBracket = () => {
    if (players.length < 2) {
      alert('Need at least 2 players to generate a bracket');
      return;
    }

    const sampleTournament: Tournament = {
      id: 'tournament-' + Date.now(),
      name: 'Generated Tournament',
      description: 'Auto-generated tournament bracket',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: TournamentStatus.REGISTRATION,
      maxParticipants: players.length,
      currentParticipants: players.length,
      venue: { id: 'venue-1', name: 'Main Venue' },
      entryFee: 0,
      prizePools: [],
      rules: [],
      format: TournamentFormat.SINGLE_ELIMINATION,
      players: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      generateBracket(sampleTournament, players);
      onBracketGenerated?.(sampleTournament);
    } catch (error) {
      console.error('Failed to generate bracket:', error);
    }
  };

  const handleFormatChange = (format: TournamentFormat) => {
    const updatedTournament = tournament ? { ...tournament, format } : null;
    if (updatedTournament) {
      // setTournament(updatedTournament); // This line was commented out in the original file, so it's commented out here.
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Tournament Bracket Manager
      </Typography>

      {/* Player Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Player Management
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              label="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Rank"
              type="number"
              value={playerRank}
              onChange={(e) => setPlayerRank(parseInt(e.target.value) || 1)}
              size="small"
              sx={{ width: 100 }}
            />
            <Button
              variant="contained"
              onClick={handleAddPlayer}
              disabled={!playerName.trim()}
            >
              Add Player
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {players.map((player) => (
              <Chip
                key={player.id}
                label={`${player.name} (${player.rank})`}
                onDelete={() => removePlayer(player.id)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          {players.length > 0 && (
            <Alert severity="info">
              {players.length} player{players.length !== 1 ? 's' : ''}{' '}
              registered
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bracket Options */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bracket Options
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <FormControl>
              <Typography variant="subtitle2" gutterBottom>
                Tournament Format
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.values(TournamentFormat).map((format) => (
                  <Chip
                    key={format}
                    label={format.replace('_', ' ')}
                    onClick={() => handleFormatChange(format)}
                    color={
                      tournament?.format === format ? 'primary' : 'default'
                    }
                    variant={
                      tournament?.format === format ? 'filled' : 'outlined'
                    }
                  />
                ))}
              </Box>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={bracketOptions.seedPlayers}
                  onChange={(e) =>
                    updateBracketOptions({ seedPlayers: e.target.checked })
                  }
                />
              }
              label="Seed Players by Rank"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={bracketOptions.randomizeSeeds}
                  onChange={(e) =>
                    updateBracketOptions({ randomizeSeeds: e.target.checked })
                  }
                />
              }
              label="Randomize Seeds"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleGenerateBracket}
          disabled={players.length < 2 || isGenerating}
          startIcon={isGenerating ? <CircularProgress size={20} /> : null}
        >
          {isGenerating ? 'Generating...' : 'Generate Bracket'}
        </Button>
        <Button
          variant="outlined"
          onClick={resetBracket}
          disabled={!tournament}
        >
          Reset Bracket
        </Button>
      </Box>

      {/* Generated Bracket */}
      {tournament && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generated Bracket
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TournamentBracket tournament={tournament} />
          </CardContent>
        </Card>
      )}

      {/* Tournament Stats */}
      {tournament && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tournament Statistics
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Format
                </Typography>
                <Typography variant="body1">
                  {tournament.format.replace('_', ' ')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Players
                </Typography>
                <Typography variant="body1">
                  {tournament.players.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1">{tournament.status}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TournamentBracketManager;
