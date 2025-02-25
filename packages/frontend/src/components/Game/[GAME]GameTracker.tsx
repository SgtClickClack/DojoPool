import React, { useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, CircularProgress, IconButton } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMatch, recordShot, recordBreak, endMatch, updateScore } from '../../store/slices/gameSlice';
import { SportsPool, Timer, EmojiEvents, Close } from '@mui/icons-material';
import { useWebSocket } from '../../hooks/useWebSocket';

interface GameTrackerProps {
    matchId: string;
}

export const GameTracker: React.FC<GameTrackerProps> = ({ matchId }) => {
    const dispatch = useAppDispatch();
    const { currentMatch, shots, breaks, statistics, isLoading, error } = useAppSelector(state => state.game);
    const { user } = useAppSelector(state => state.auth);

    // WebSocket setup for real-time game updates
    const { lastMessage } = useWebSocket(`/ws/game/${matchId}/`);

    useEffect(() => {
        dispatch(fetchMatch(matchId));
    }, [dispatch, matchId]);

    useEffect(() => {
        if (lastMessage) {
            const data = JSON.parse(lastMessage.data);
            switch (data.type) {
                case 'shot_recorded':
                    dispatch(updateScore(data.score));
                    break;
                case 'break_recorded':
                    // Handle break update
                    break;
                case 'match_ended':
                    // Handle match end
                    break;
            }
        }
    }, [lastMessage, dispatch]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, color: 'error.main' }}>
                <Typography>{error}</Typography>
            </Box>
        );
    }

    const handleShotRecorded = async (type: string, successful: boolean) => {
        if (!user?.id) return;
        
        await dispatch(recordShot({
            matchId,
            shot: {
                player_id: user.id,
                type,
                successful,
                points: successful ? (type === 'break' ? 2 : 1) : 0
            }
        }));
    };

    const handleBreakRecorded = async (points: number) => {
        if (!user?.id) return;

        await dispatch(recordBreak({
            matchId,
            break: {
                player_id: user.id,
                points
            }
        }));
    };

    const handleEndMatch = async () => {
        if (!currentMatch?.id || !currentMatch.player1 || !currentMatch.player2) return;

        const winnerId = currentMatch.score.player1 > currentMatch.score.player2 
            ? currentMatch.player1.id 
            : currentMatch.player2.id;

        await dispatch(endMatch({
            matchId,
            winnerId,
            finalScore: currentMatch.score
        }));
    };

    return (
        <Box>
            {/* Match Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6">
                            {currentMatch?.player1?.nickname || 'Player 1'}
                        </Typography>
                        <Typography variant="h4">
                            {currentMatch?.score.player1 || 0}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="primary">
                            VS
                        </Typography>
                        {currentMatch?.status === 'in_progress' && (
                            <Typography variant="subtitle1" color="text.secondary">
                                In Progress
                            </Typography>
                        )}
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                        <Typography variant="h6">
                            {currentMatch?.player2?.nickname || 'Player 2'}
                        </Typography>
                        <Typography variant="h4">
                            {currentMatch?.score.player2 || 0}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Game Controls */}
            {currentMatch?.status === 'in_progress' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Shot Controls
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item>
                            <IconButton
                                color="primary"
                                onClick={() => handleShotRecorded('standard', true)}
                                size="large"
                            >
                                <SportsPool />
                            </IconButton>
                            <Typography variant="caption">Standard Shot</Typography>
                        </Grid>
                        <Grid item>
                            <IconButton
                                color="secondary"
                                onClick={() => handleBreakRecorded(5)}
                                size="large"
                            >
                                <Timer />
                            </IconButton>
                            <Typography variant="caption">Record Break</Typography>
                        </Grid>
                        <Grid item>
                            <IconButton
                                color="error"
                                onClick={handleEndMatch}
                                size="large"
                            >
                                <Close />
                            </IconButton>
                            <Typography variant="caption">End Match</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Statistics */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Match Statistics
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1">
                            Player 1 Stats
                        </Typography>
                        <Typography>
                            Shots Made: {statistics.player1.shots_made}/{statistics.player1.shots_taken}
                        </Typography>
                        <Typography>
                            Highest Break: {statistics.player1.highest_break}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1">
                            Player 2 Stats
                        </Typography>
                        <Typography>
                            Shots Made: {statistics.player2.shots_made}/{statistics.player2.shots_taken}
                        </Typography>
                        <Typography>
                            Highest Break: {statistics.player2.highest_break}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}; 