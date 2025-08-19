import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  FitnessCenter as ExerciseIcon,
  Timer as DurationIcon,
  Speed as DifficultyIcon,
  Target as TargetIcon,
  CheckCircleOutline as CompletedIcon,
} from '@mui/icons-material';

interface Exercise {
  type: string;
  duration: number;
  difficulty: number;
  target_score: number;
}

interface Recommendation {
  type: string;
  focus_area: string;
  difficulty: number;
  exercises: Exercise[];
  duration: number;
}

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
}) => {
  const theme = useTheme();

  if (!recommendations.length) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No recommendations available
        </Typography>
      </Box>
    );
  }

  const formatExerciseType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 0.3) return theme.palette.success.main;
    if (difficulty < 0.6) return theme.palette.info.main;
    if (difficulty < 0.8) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Stack spacing={3}>
      {recommendations.map((recommendation, index) => (
        <Card key={index} variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" component="div">
                  {formatExerciseType(recommendation.focus_area)}
                </Typography>
                <Chip
                  label={`${Math.round(recommendation.difficulty * 100)}% Difficulty`}
                  color="primary"
                  size="small"
                />
              </Box>

              {/* Difficulty Indicator */}
              <Box sx={{ width: '100%', mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={recommendation.difficulty * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getDifficultyColor(
                        recommendation.difficulty
                      ),
                    },
                  }}
                />
              </Box>

              {/* Exercises */}
              <List>
                {recommendation.exercises.map((exercise, exerciseIndex) => (
                  <React.Fragment key={exerciseIndex}>
                    {exerciseIndex > 0 && <Divider />}
                    <ListItem>
                      <ListItemIcon>
                        <ExerciseIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={formatExerciseType(exercise.type)}
                        secondary={
                          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            <Chip
                              icon={<DurationIcon />}
                              label={`${exercise.duration} min`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              icon={<DifficultyIcon />}
                              label={`${Math.round(exercise.difficulty * 100)}%`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              icon={<TargetIcon />}
                              label={`Target: ${exercise.target_score}`}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>

              {/* Footer */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Total Duration: {recommendation.duration} minutes
                </Typography>
                <Chip
                  icon={<CompletedIcon />}
                  label="Ready to Start"
                  color="success"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};
