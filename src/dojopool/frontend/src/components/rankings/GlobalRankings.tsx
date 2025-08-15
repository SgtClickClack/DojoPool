import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  useTheme,
  Pagination,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  EmojiEvents,
  Star,
  TrendingUp,
  TrendingDown,
  Remove,
  ArrowUpward,
  ArrowDownward,
  Timeline,
  Info,
  Sync,
} from "@mui/icons-material";
import { useQuery } from "react-query";
import axios from "axios";
import { alpha } from "@mui/material/styles";
import PlayerStatsModal from "./PlayerStatsModal";
import { useRankingWebSocket } from "../../hooks/useRankingWebSocket";

const ITEMS_PER_PAGE = 20;

interface RankingData {
  user_id: number;
  username: string;
  rating: number;
  rank: number;
  tier: string;
  tier_color: string;
  total_games: number;
  games_won: number;
  win_rate: number;
  tournament_wins: number;
  rank_movement: number;
  rank_streak: number;
  rank_streak_type: string;
}

const GlobalRankings: React.FC = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  // Add WebSocket connection
  const { connected } = useRankingWebSocket();

  const {
    data: rankings,
    isLoading,
    error,
  } = useQuery(
    ["rankings", page],
    async () => {
      const start = (page - 1) * ITEMS_PER_PAGE + 1;
      const end = start + ITEMS_PER_PAGE - 1;
      const response = await axios.get(
        `/api/rankings/global?start_rank=${start}&end_rank=${end}`,
      );
      return response.data;
    },
    {
      keepPreviousData: true,
      // Reduce refetch interval since we have WebSocket updates
      refetchInterval: connected ? false : 300000,
    },
  );

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Pool God":
        return <EmojiEvents style={{ color: "#FFD700" }} />;
      case "Divine":
      case "Mythic":
        return <Star style={{ color: "#FF69B4" }} />;
      default:
        return null;
    }
  };

  const getRankMovementIcon = (movement: number) => {
    if (movement > 0) {
      return <ArrowUpward color="success" />;
    } else if (movement < 0) {
      return <ArrowDownward color="error" />;
    }
    return <Remove color="action" />;
  };

  const getStreakIndicator = (streak: number, type: string) => {
    if (streak >= 3) {
      return (
        <Chip
          size="small"
          icon={type === "win" ? <TrendingUp /> : <TrendingDown />}
          label={`${streak} ${type === "win" ? "Up" : "Down"}`}
          color={type === "win" ? "success" : "error"}
          variant="outlined"
        />
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">Error loading rankings</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4">Global Rankings</Typography>
        {connected && (
          <Chip
            size="small"
            color="success"
            label="Live Updates"
            icon={<Sync />}
          />
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Player</TableCell>
              <TableCell align="center">Rating</TableCell>
              <TableCell align="center">Tier</TableCell>
              <TableCell align="center">Win Rate</TableCell>
              <TableCell align="center">Games</TableCell>
              <TableCell align="center">Movement</TableCell>
              <TableCell align="center">Streak</TableCell>
              <TableCell align="center">Stats</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rankings?.map((player: RankingData) => (
              <TableRow
                key={player.user_id}
                hover
                onClick={() => setSelectedPlayerId(player.user_id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {player.rank}
                    {getRankMovementIcon(player.rank_movement)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      alt={player.username}
                      src={`/api/users/${player.user_id}/avatar`}
                    />
                    <Typography>{player.username}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6">
                    {Math.round(player.rating)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    icon={getTierIcon(player.tier)}
                    label={player.tier}
                    sx={{
                      backgroundColor: alpha(player.tier_color, 0.1),
                      color: player.tier_color,
                      fontWeight: "bold",
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography
                    sx={{
                      color:
                        player.win_rate >= 0.6
                          ? theme.palette.success.main
                          : player.win_rate <= 0.4
                            ? theme.palette.error.main
                            : "inherit",
                    }}
                  >
                    {(player.win_rate * 100).toFixed(1)}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Typography>{player.total_games}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      ({player.games_won} wins)
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography
                    color={
                      player.rank_movement > 0
                        ? "success.main"
                        : player.rank_movement < 0
                          ? "error.main"
                          : "inherit"
                    }
                  >
                    {player.rank_movement > 0 ? "+" : ""}
                    {player.rank_movement}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {getStreakIndicator(
                    player.rank_streak,
                    player.rank_streak_type,
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlayerId(player.user_id);
                    }}
                  >
                    <Info />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={Math.ceil(1000 / ITEMS_PER_PAGE)} // Assuming max 1000 ranked players
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {selectedPlayerId && (
        <PlayerStatsModal
          playerId={selectedPlayerId}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </Box>
  );
};

export default GlobalRankings;
