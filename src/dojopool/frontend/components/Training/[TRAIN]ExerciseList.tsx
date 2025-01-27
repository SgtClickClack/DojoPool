import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Chip,
  Typography,
  LinearProgress,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FitnessCenter, Speed, Gavel, Timeline } from '@mui/icons-material';

const MetricsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  marginTop: theme.spacing(1),
}));

const MetricBox = styled(Box)(({ theme }) => ({
  flex: 1,
}));

interface Progress {
  program: string;
  exercise: string;
  completion_date: string;
  performance_metrics: Record<string, number>;
  notes: string;
}

interface Props {
  progress: Progress[];
}

export const ExerciseList: React.FC<Props> = ({ progress }) => {
  const getExerciseIcon = (exercise: string) => {
    if (exercise.toLowerCase().includes('shot')) return <Gavel />;
    if (exercise.toLowerCase().includes('speed')) return <Speed />;
    if (exercise.toLowerCase().includes('drill')) return <Timeline />;
    return <FitnessCenter />;
  };

  const getMetricColor = (value: number) => {
    if (value >= 0.8) return 'success';
    if (value >= 0.6) return 'warning';
    return 'error';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <List>
      {progress.map((entry, index) => (
        <React.Fragment key={index}>
          <ListItem>
            <ListItemIcon>{getExerciseIcon(entry.exercise)}</ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">{entry.exercise}</Typography>
                  <Chip label={entry.program} size="small" color="primary" variant="outlined" />
                </Box>
              }
              secondary={
                <>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(entry.completion_date)}
                  </Typography>
                  <MetricsContainer>
                    {Object.entries(entry.performance_metrics).map(([key, value]) => (
                      <MetricBox key={key}>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={value * 100}
                          color={getMetricColor(value)}
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="body2">{(value * 100).toFixed(1)}%</Typography>
                      </MetricBox>
                    ))}
                  </MetricsContainer>
                  {entry.notes && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {entry.notes}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
          {index < progress.length - 1 && <Divider />}
        </React.Fragment>
      ))}
      {progress.length === 0 && (
        <ListItem>
          <ListItemText
            primary="No exercises completed yet"
            secondary="Start a training program to track your progress"
          />
        </ListItem>
      )}
    </List>
  );
};

export default ExerciseList;
