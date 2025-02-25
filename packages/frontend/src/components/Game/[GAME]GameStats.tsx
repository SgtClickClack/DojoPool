import React from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Tooltip } from '@mui/material';
import { useAppSelector } from '../../store';
import {
    Timeline,
    TrendingUp,
    Speed,
    Timer,
    EmojiEvents,
    Assessment
} from '@mui/icons-material';

interface GameStatsProps {
    matchId: string;
}

export const GameStats: React.FC<GameStatsProps> = ({ matchId }) => {
    const { currentMatch, statistics, isLoading } = useAppSelector(state => state.game);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!currentMatch || !statistics) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">No statistics available</Typography>
            </Box>
        );
    }

    const renderPlayerStats = (playerKey: 'player1' | 'player2', playerName: string) => {
        const stats = statistics[playerKey];
        const accuracy = stats.shots_taken > 0
            ? ((stats.shots_made / stats.shots_taken) * 100).toFixed(1)
            : '0.0';

        return (
            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {playerName}'s Statistics
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6} sm={4}>
                            <Tooltip title="Shot Accuracy">
                                <Box sx={{ textAlign: 'center' }}>
                                    <Speed color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="h4">{accuracy}%</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Accuracy
                                    </Typography>
                                </Box>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                            <Tooltip title="Total Shots Taken">
                                <Box sx={{ textAlign: 'center' }}>
                                    <Timeline color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="h4">{stats.shots_taken}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Total Shots
                                    </Typography>
                                </Box>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                            <Tooltip title="Highest Break">
                                <Box sx={{ textAlign: 'center' }}>
                                    <TrendingUp color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="h4">{stats.highest_break}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Highest Break
                                    </Typography>
                                </Box>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                            <Tooltip title="Average Shot Time">
                                <Box sx={{ textAlign: 'center' }}>
                                    <Timer color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="h4">
                                        {stats.average_shot_time.toFixed(1)}s
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Avg Shot Time
                                    </Typography>
                                </Box>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                            <Tooltip title="Successful Shots">
                                <Box sx={{ textAlign: 'center' }}>
                                    <EmojiEvents color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="h4">{stats.shots_made}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Successful
                                    </Typography>
                                </Box>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                            <Tooltip title="Performance Rating">
                                <Box sx={{ textAlign: 'center' }}>
                                    <Assessment color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="h4">
                                        {calculatePerformanceRating(stats)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Rating
                                    </Typography>
                                </Box>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        );
    };

    const calculatePerformanceRating = (stats: typeof statistics.player1) => {
        const accuracy = stats.shots_taken > 0 ? (stats.shots_made / stats.shots_taken) * 100 : 0;
        const breakFactor = stats.highest_break / 100; // Normalize to 0-1 range
        const shotTimeFactor = Math.max(0, 1 - (stats.average_shot_time / 30)); // Lower is better, cap at 30s

        // Calculate weighted score (0-100)
        const score = (
            accuracy * 0.4 +
            breakFactor * 40 * 0.3 +
            shotTimeFactor * 100 * 0.3
        ).toFixed(0);

        return score;
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Detailed Match Statistics
            </Typography>
            <Grid container spacing={3}>
                {renderPlayerStats(
                    'player1',
                    currentMatch.player1?.nickname || 'Player 1'
                )}
                {renderPlayerStats(
                    'player2',
                    currentMatch.player2?.nickname || 'Player 2'
                )}
            </Grid>
        </Box>
    );
}; 