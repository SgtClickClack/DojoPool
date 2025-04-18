import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  LinearProgress,
} from "@mui/material";

interface Statistics {
  total_shots: number;
  successful_shots: number;
  average_difficulty: number;
  average_power: number;
  average_spin: number;
  shot_types: {
    [key: string]: number;
  };
  success_by_difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface GameStatisticsProps {
  statistics: Statistics | null;
}

export const GameStatistics: React.FC<GameStatisticsProps> = ({
  statistics,
}) => {
  if (!statistics) {
    return (
      <Box>
        <Typography variant="body1" color="text.secondary">
          No statistics available for this game.
        </Typography>
      </Box>
    );
  }

  const successRate = Math.round(
    (statistics.successful_shots / statistics.total_shots) * 100,
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Game Statistics
      </Typography>

      <Grid container spacing={3}>
        {/* Overall Stats */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Performance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="subtitle1">Success Rate</Typography>
                    <Box position="relative" display="inline-flex">
                      <CircularProgress
                        variant="determinate"
                        value={successRate}
                        size={80}
                      />
                      <Box
                        position="absolute"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                      >
                        <Typography variant="caption">
                          {successRate}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="subtitle1">
                      Average Difficulty
                    </Typography>
                    <Typography variant="h4">
                      {statistics.average_difficulty.toFixed(1)}/10
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="subtitle1">Total Shots</Typography>
                    <Typography variant="h4">
                      {statistics.total_shots}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Shot Types */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shot Types
              </Typography>
              {Object.entries(statistics.shot_types).map(([type, count]) => (
                <Box key={type} mb={1}>
                  <Typography variant="body2" gutterBottom>
                    {type}: {count} shots
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(count / statistics.total_shots) * 100}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Success by Difficulty */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Success by Difficulty
              </Typography>
              {Object.entries(statistics.success_by_difficulty).map(
                ([difficulty, rate]) => (
                  <Box key={difficulty} mb={1}>
                    <Typography variant="body2" gutterBottom>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      : {rate}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={rate}
                      color={
                        difficulty === "easy"
                          ? "success"
                          : difficulty === "medium"
                            ? "warning"
                            : "error"
                      }
                    />
                  </Box>
                ),
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GameStatistics;
