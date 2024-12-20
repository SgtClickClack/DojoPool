import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  FitnessCenter,
  Timeline,
  CheckCircle,
  ArrowForward,
} from '@mui/icons-material';
import { api } from '../../services/api';
import { ProgressChart } from './ProgressChart';
import { ExerciseList } from './ExerciseList';

const DashboardContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));

interface Program {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  duration_weeks: number;
}

interface Recommendation {
  program: Program;
  match_score: number;
  reasons: string[];
}

interface Progress {
  program: string;
  exercise: string;
  completion_date: string;
  performance_metrics: Record<string, number>;
  notes: string;
}

export const TrainingDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [recResponse, progressResponse] = await Promise.all([
        api.get('/training/recommend'),
        api.get('/training/progress'),
      ]);

      setRecommendation(recResponse.data);
      setProgress(progressResponse.data.progress);
    } catch (err) {
      setError('Failed to load training dashboard');
      console.error('Training dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionRate = () => {
    if (!progress.length) return 0;
    const totalExercises = progress.length;
    const completedExercises = progress.filter(
      (p) => Object.values(p.performance_metrics).every((v) => v >= 0.7)
    ).length;
    return (completedExercises / totalExercises) * 100;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <DashboardContainer elevation={3}>
        <Typography variant="h5" gutterBottom>
          Training Dashboard
        </Typography>

        <Grid container spacing={3}>
          {/* Stats Overview */}
          <Grid item xs={12} md={4}>
            <StatsCard>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <FitnessCenter color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Program Progress</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateCompletionRate()}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="textSecondary">
                  {calculateCompletionRate().toFixed(1)}% Complete
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>

          {/* Performance Trends */}
          <Grid item xs={12} md={8}>
            <StatsCard>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Timeline color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Performance Trends</Typography>
                </Box>
                <ProgressChart progress={progress} />
              </CardContent>
            </StatsCard>
          </Grid>

          {/* Recommended Program */}
          {recommendation && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommended Program
                  </Typography>
                  <Typography variant="h5" gutterBottom>
                    {recommendation.program.name}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {recommendation.program.description}
                  </Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <Chip
                      label={`${recommendation.program.difficulty} Level`}
                      color="primary"
                    />
                    <Chip
                      label={`${recommendation.program.duration_weeks} Weeks`}
                      color="secondary"
                    />
                    <Chip
                      label={`${(recommendation.match_score * 100).toFixed(1)}% Match`}
                      color="success"
                    />
                  </Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Why this program?
                  </Typography>
                  <List>
                    {recommendation.reasons.map((reason, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText primary={reason} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForward />}
                    href={`/training/programs/${recommendation.program.id}`}
                  >
                    Start Program
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}

          {/* Recent Exercises */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Exercises
                </Typography>
                <ExerciseList progress={progress.slice(0, 5)} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DashboardContainer>
    </Box>
  );
};

export default TrainingDashboard; 