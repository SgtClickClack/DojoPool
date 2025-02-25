import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
} from '@mui/material';

interface Pattern {
  name: string;
  description: string;
  frequency: number;
  success_rate: number;
}

interface GamePatternsProps {
  patterns: Pattern[] | null;
}

export const GamePatterns: React.FC<GamePatternsProps> = ({ patterns }) => {
  if (!patterns) {
    return (
      <Box>
        <Typography variant="body1" color="text.secondary">
          No patterns detected in this game.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Game Patterns
      </Typography>

      <Grid container spacing={2}>
        {patterns.map((pattern, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {pattern.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {pattern.description}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Frequency: {pattern.frequency}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={pattern.frequency}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate: {pattern.success_rate}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={pattern.success_rate}
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}; 