import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom"; // Use RouterLink for navigation
import { Visibility, SportsEsports } from "@mui/icons-material";
import axiosInstance from "../../api/axiosInstance";
import { useUserProfile } from "../../contexts/UserContext";

// Interface for player data (assuming consistent structure)
interface PlayerInfo {
  id: number;
  user_id?: number; // Allow either id or user_id based on potential API variations
  username?: string;
}

// Basic interface for game list item
interface GameListItem {
  id: number;
  game_type: string;
  status: string;
  // Use the consistent PlayerInfo type
  player1?: PlayerInfo;
  player2?: PlayerInfo;
  players?: PlayerInfo[];
  created_at?: string;
}

const ActiveGamesList: React.FC = () => {
  const { profile } = useUserProfile();
  const [games, setGames] = useState<GameListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    if (!profile) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get<
        GameListItem[] | { results: GameListItem[] }
      >("/v1/games");
      const fetchedGames = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setGames(fetchedGames);
    } catch (err: any) {
      console.error("Error fetching games:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load games.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [profile]);

  const getOpponentUsername = (game: GameListItem): string => {
    if (!profile) return "Opponent";
    const playerArray =
      game.players ||
      (game.player1 && game.player2 ? [game.player1, game.player2] : []);
    const opponent = playerArray.find(
      (p) => (p.id ?? p.user_id) !== profile.id,
    );
    const opponentIdentifier = opponent?.id ?? (opponent?.user_id || "N/A");
    return opponent?.username || `Player ${opponentIdentifier}`;
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Active Games
      </Typography>
      {isLoading && <CircularProgress size={24} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {!isLoading && !error && (
        <List dense>
          {games.length === 0 ? (
            <ListItem>
              <ListItemText primary="No active games found." />
            </ListItem>
          ) : (
            games.map((game) => (
              <ListItem
                key={game.id}
                component={RouterLink}
                to={`/game/${game.id}`}
              >
                <ListItemText
                  primary={`Game ${game.id} (${game.game_type}) vs ${getOpponentUsername(game)}`}
                  secondary={`Status: ${game.status}`}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Watch Game">
                    <IconButton 
                      edge="end" 
                      aria-label="watch"
                      component={RouterLink}
                      to={`/spectate/${game.id}`}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      )}
      <Button onClick={fetchGames} disabled={isLoading} sx={{ mt: 1 }}>
        Refresh List
      </Button>
    </Box>
  );
};

export default ActiveGamesList;
