import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PersonAdd } from '@mui/icons-material';
import { api } from '../../services/api';

const RecommenderContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const PlayerCard = styled(ListItem)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const CompatibilityChip = styled(Chip)<{ score: number }>(({ theme, score }) => {
  let color = theme.palette.error.main;
  if (score >= 0.9) color = theme.palette.success.main;
  else if (score >= 0.8) color = theme.palette.info.main;
  else if (score >= 0.7) color = theme.palette.warning.main;

  return {
    backgroundColor: color,
    color: theme.palette.common.white,
    fontWeight: 'bold',
  };
});

interface PlayerRecommendation {
  player_id: number;
  username: string;
  compatibility_score: number;
  reasons: string[];
}

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export const PlayerRecommender: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<PlayerRecommendation[]>([]);
  const [skillLevel, setSkillLevel] = useState('intermediate');

  useEffect(() => {
    fetchRecommendations();
  }, [skillLevel]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai/recommend-players', {
        params: { skill_level: skillLevel },
      });
      setRecommendations(response.data.recommendations);
    } catch (err) {
      setError('Failed to fetch player recommendations');
      console.error('Player recommendation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent Match';
    if (score >= 0.8) return 'Great Match';
    if (score >= 0.7) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <RecommenderContainer elevation={3}>
      <Typography variant="h5" gutterBottom>
        Recommended Players
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Skill Level</InputLabel>
          <Select
            value={skillLevel}
            label="Skill Level"
            onChange={(e) => setSkillLevel(e.target.value)}
          >
            {SKILL_LEVELS.map((level) => (
              <MenuItem key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && recommendations.length === 0 && (
        <Alert severity="info">No player recommendations found for the selected skill level.</Alert>
      )}

      <List>
        {recommendations.map((recommendation) => (
          <PlayerCard key={recommendation.player_id}>
            <ListItemAvatar>
              <Avatar>{recommendation.username.charAt(0).toUpperCase()}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">{recommendation.username}</Typography>
                  <CompatibilityChip
                    label={getCompatibilityLabel(recommendation.compatibility_score)}
                    score={recommendation.compatibility_score}
                    size="small"
                  />
                </Box>
              }
              secondary={
                <Box mt={1}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Compatibility Score:
                  </Typography>
                  <Rating value={recommendation.compatibility_score * 5} precision={0.5} readOnly />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Reasons for Compatibility:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    {recommendation.reasons.map((reason, index) => (
                      <Chip key={index} label={reason} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              }
            />
          </PlayerCard>
        ))}
      </List>
    </RecommenderContainer>
  );
};

export default PlayerRecommender;
