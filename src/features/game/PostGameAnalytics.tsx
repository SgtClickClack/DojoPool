import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, CircularProgress, Alert, List, ListItem, Divider } from "@mui/material";
import LiveCommentary from "./LiveCommentary";

interface PlayerStats {
  accuracy: number;
  potting_success: number;
  position_control: number;
  safety_success: number;
  break_success: number;
  total_shots: number;
  successful_shots: number;
  failed_shots: number;
  total_fouls: number;
  total_points: number;
}

interface Highlight {
  id: string;
  description: string;
  timestamp: string;
}

interface GameAnalytics {
  summary: string;
  playerStats: Record<string, PlayerStats>;
  highlights: Highlight[];
  trends: any; // For future trend visualizations
}

interface PostGameAnalyticsProps {
  gameId: string;
}

const PostGameAnalytics: React.FC<PostGameAnalyticsProps> = ({ gameId }) => {
  const [analytics, setAnalytics] = useState<GameAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setAnalytics(null);
    fetch(`/api/games/${gameId}/analytics`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return res.json();
      })
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [gameId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!analytics) {
    return <Typography>No analytics available.</Typography>;
  }

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>Post-Game Analytics</Typography>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>{analytics.summary}</Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">AI Commentary & Audio</Typography>
      <LiveCommentary gameId={gameId} />
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Highlights</Typography>
      <List dense>
        {analytics.highlights.map((hl) => (
          <ListItem key={hl.id}>
            <Typography variant="body2">[{new Date(hl.timestamp).toLocaleTimeString()}] {hl.description}</Typography>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Player Stats</Typography>
      {Object.entries(analytics.playerStats).map(([player, stats]) => (
        <Box key={player} sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{player}</Typography>
          <Typography variant="body2">Accuracy: {stats.accuracy}%</Typography>
          <Typography variant="body2">Potting Success: {stats.potting_success}%</Typography>
          <Typography variant="body2">Position Control: {stats.position_control}%</Typography>
          <Typography variant="body2">Safety Success: {stats.safety_success}%</Typography>
          <Typography variant="body2">Break Success: {stats.break_success}%</Typography>
          <Typography variant="body2">Total Shots: {stats.total_shots}</Typography>
          <Typography variant="body2">Successful Shots: {stats.successful_shots}</Typography>
          <Typography variant="body2">Failed Shots: {stats.failed_shots}</Typography>
          <Typography variant="body2">Fouls: {stats.total_fouls}</Typography>
          <Typography variant="body2">Points: {stats.total_points}</Typography>
        </Box>
      ))}
      {/* Future: Add trend visualizations here */}
    </Paper>
  );
};

export default PostGameAnalytics; 