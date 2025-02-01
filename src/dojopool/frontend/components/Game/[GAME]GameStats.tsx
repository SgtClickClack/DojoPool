import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { GameStats as GameStatsType } from '../../types/game';

interface GameStatsProps {
    stats: GameStatsType;
    playerName: string;
}

export const GameStats: React.FC<GameStatsProps> = ({ stats, playerName }) => {
    const accuracy = ((stats.successfulShots / stats.totalShots) * 100).toFixed(1);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                {playerName}'s Game Statistics
            </Typography>
            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Accuracy
                            </Typography>
                            <Typography variant="h4">
                                {accuracy}%
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Total Shots
                            </Typography>
                            <Typography variant="h4">
                                {stats.totalShots}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Successful Shots
                            </Typography>
                            <Typography variant="h4">
                                {stats.successfulShots}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Fouls
                            </Typography>
                            <Typography variant="h4">
                                {stats.fouls}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Longest Streak
                            </Typography>
                            <Typography variant="h4">
                                {stats.longestStreak}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Game Length
                            </Typography>
                            <Typography variant="h4">
                                {stats.gameLength} min
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}; 