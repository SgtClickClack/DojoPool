import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Rating,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { PersonAdd } from "@mui/icons-material";
import axios from "axios";

const RecommenderContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const PlayerCard = styled(ListItem)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const CompatibilityChip = styled(Chip)<{ score: number }>(({
  theme,
  score,
}) => {
  let color = theme.palette.error.main;
  if (score >= 0.9) color = theme.palette.success.main;
  else if (score >= 0.8) color = theme.palette.info.main;
  else if (score >= 0.7) color = theme.palette.warning.main;

  return {
    backgroundColor: color,
    color: theme.palette.common.white,
    fontWeight: "bold",
  };
});

interface PlayerRecommendation {
  player_id: number;
  username: string;
  compatibility_score: number;
  reasons: string[];
  skill_level: number;
  play_style: string;
  availability: string[];
}

export const PlayerRecommender: React.FC = () => {
  const [recommendations, setRecommendations] = useState<
    PlayerRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/ai/player-recommendations", {
        params: { filter },
      });
      setRecommendations(response.data);
    } catch (err) {
      setError(
        "Failed to fetch player recommendations. Please try again later.",
      );
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [filter]);

  const getCompatibilityLabel = (score: number) => {
    if (score >= 0.9) return "Excellent Match";
    if (score >= 0.8) return "Good Match";
    if (score >= 0.7) return "Fair Match";
    return "Low Match";
  };

  if (loading) {
    return (
      <RecommenderContainer>
        <Box display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress />
        </Box>
      </RecommenderContainer>
    );
  }

  if (error) {
    return (
      <RecommenderContainer>
        <Alert severity="error">{error}</Alert>
      </RecommenderContainer>
    );
  }

  return (
    <RecommenderContainer>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Recommended Players</Typography>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Filter By</InputLabel>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="Filter By"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="skill">Skill Level</MenuItem>
            <MenuItem value="style">Play Style</MenuItem>
            <MenuItem value="schedule">Schedule</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {recommendations.length === 0 ? (
        <Alert severity="info">
          No player recommendations available at the moment.
        </Alert>
      ) : (
        <List>
          {recommendations.map((player) => (
            <PlayerCard key={player.player_id}>
              <ListItemAvatar>
                <Avatar>
                  <PersonAdd />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1">
                      {player.username}
                    </Typography>
                    <CompatibilityChip
                      score={player.compatibility_score}
                      label={`${getCompatibilityLabel(player.compatibility_score)} (${Math.round(
                        player.compatibility_score * 100,
                      )}%)`}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Typography variant="body2" color="textSecondary">
                        Skill Level:
                      </Typography>
                      <Rating
                        value={player.skill_level}
                        readOnly
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Play Style: {player.play_style}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Available: {player.availability.join(", ")}
                    </Typography>
                    <Box mt={1}>
                      {player.reasons.map((reason, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          color="textSecondary"
                          sx={{ "&:before": { content: '"• "' } }}
                        >
                          {reason}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                }
              />
            </PlayerCard>
          ))}
        </List>
      )}
    </RecommenderContainer>
  );
};

export default PlayerRecommender;
