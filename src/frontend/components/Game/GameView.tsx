import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Paper, Button, Stack } from '@mui/material';
import axiosInstance from '../../api/axiosInstance';

// Define interfaces based on expected API response for a single game
// This might need significant adjustment based on the actual GET /games/{id} response
interface PlayerDetail {
  id: number;
  user_id?: number;
  username?: string;
  score?: number;
  // Add other fields like balls_pocketed, fouls etc.
}

interface GameDetail {
  id: number;
  game_type: string;
  status: string;
  venue_id?: number;
  table_id?: number; // Or table_number?
  created_at?: string;
  started_at?: string;
  ended_at?: string;
  current_player_id?: number;
  winner_id?: number;
  players?: PlayerDetail[]; // Assuming an array of players
  player1?: PlayerDetail; // Or maybe separate player objects
  player2?: PlayerDetail;
  // Add game_state details if available (e.g., ball positions)
}

const GameView: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>(); // Get gameId from URL params
  const [game, setGame] = useState<GameDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setError('No game ID provided in URL.');
      setIsLoading(false);
      return;
    }

    const fetchGameDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch game details
        const response = await axiosInstance.get<GameDetail>(`/games/${gameId}`);
        setGame(response.data);
      } catch (err: any) {
        console.error(`Error fetching game ${gameId}:`, err);
        setError(err.response?.data?.message || err.message || 'Failed to load game details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameDetails();
  }, [gameId]);

  // Placeholder action handlers
  const handleRecordShot = () => {
    console.log(`TODO: Record shot for game ${gameId}`);
    alert('Record Shot functionality not implemented yet.');
    // API call: POST /games/{gameId}/shots
  };

  const handleEndTurn = () => {
    console.log(`TODO: End turn for game ${gameId}`);
    alert('End Turn functionality not implemented yet.');
    // API call: PUT /games/{gameId} (update current_player_id?)
  };

  const handleConcedeGame = () => {
    if (window.confirm('Are you sure you want to concede the game?')) {
      console.log(`TODO: Concede game ${gameId}`);
      alert('Concede Game functionality not implemented yet.');
       // API call: PUT /games/{gameId} (update status, winner_id)
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!game) {
    return <Alert severity="info">Game details not found.</Alert>;
  }

  // Helper to get player username by ID
  const getPlayerUsername = (playerId: number): string => {
    const players = game.players || (game.player1 && game.player2 ? [game.player1, game.player2] : []);
    const player = players.find(p => (p.id ?? p.user_id) === playerId);
    return player?.username || `ID: ${playerId}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Game: {game.game_type} (ID: {game.id})
      </Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography><strong>Status:</strong> {game.status}</Typography>
        {game.current_player_id && (
           <Typography><strong>Current Turn:</strong> {getPlayerUsername(game.current_player_id)}</Typography>
        )}
        {game.winner_id && (
           <Typography><strong>Winner:</strong> {getPlayerUsername(game.winner_id)}</Typography>
        )}
        {game.venue_id && <Typography><strong>Venue ID:</strong> {game.venue_id}</Typography>}
        {game.table_id && <Typography><strong>Table ID:</strong> {game.table_id}</Typography>}
        {/* Add more game state display here - e.g., ball layout if available */}
      </Paper>

      <Typography variant="h6" sx={{ mt: 2 }}>Players:</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {(game.players || (game.player1 && game.player2 ? [game.player1, game.player2] : [])).map((player, index) => (
          <Paper key={player.id ?? player.user_id ?? index} elevation={2} sx={{ p: 2, flexGrow: 1 }}>
             <Typography variant="subtitle1">{player.username || `ID: ${player.id ?? player.user_id}`}</Typography>
            {player.score !== undefined && <Typography><strong>Score:</strong> {player.score}</Typography>}
            {/* Add more player details */} 
          </Paper>
        ))}
      </Stack>
        
       {/* Placeholder Action Buttons - Only show if game is active? */}
       {game.status === 'active' && (
         <Paper elevation={3} sx={{ p: 2 }}>
             <Typography variant="h6" gutterBottom>Actions</Typography>
             <Stack direction="row" spacing={2}>
               <Button variant="contained" onClick={handleRecordShot}>Record Shot</Button>
               <Button variant="outlined" onClick={handleEndTurn}>End Turn</Button>
               <Button variant="outlined" color="error" onClick={handleConcedeGame}>Concede Game</Button>
             </Stack>
         </Paper>
       )}
    </Box>
  );
};

export default GameView; 