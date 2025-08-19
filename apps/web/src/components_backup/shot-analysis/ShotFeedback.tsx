import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { type FeedbackMessage } from '../ai/shot-analysis/ShotFeedbackService';

interface ShotFeedbackProps {
  feedback: FeedbackMessage[];
}

const severityColors = {
  info: 'primary',
  warning: 'warning',
  error: 'error',
} as const;

const typeIcons = {
  technique: '🎯',
  power: '💪',
  accuracy: '🎯',
  spin: '🌀',
  success: '✅',
} as const;

export const ShotFeedback: React.FC<ShotFeedbackProps> = ({ feedback }) => {
  const [displayedFeedback, setDisplayedFeedback] = useState<FeedbackMessage[]>(
    []
  );

  useEffect(() => {
    setDisplayedFeedback(feedback.slice(0, 5)); // Show only the 5 most recent feedback items
  }, [feedback]);

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 400, margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom>
        Shot Feedback
      </Typography>
      <List>
        {displayedFeedback.map((item, index) => (
          <ListItem key={index} sx={{ borderBottom: '1px solid #eee' }}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">
                    {typeIcons[item.type]} {item.message}
                  </Typography>
                  <Chip
                    label={item.severity}
                    color={severityColors[item.severity]}
                    size="small"
                  />
                </Box>
              }
              secondary={new Date(item.timestamp).toLocaleTimeString()}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
