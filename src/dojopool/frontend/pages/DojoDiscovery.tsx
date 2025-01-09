import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DojoMap from '../components/DojoMap/DojoMap';
import { AnimatedAvatar } from '../components/Avatar';

interface LeaderboardEntry {
    userId: number;
    username: string;
    avatar: string;
    score: number;
    rank: number;
}

interface Challenge {
    name: string;
    description: string;
    requirements: {
        wins_needed: number;
        time_limit_days: number;
    };
    rewards: {
        xp: number;
        title: string;
    };
}

interface Dojo {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    distance: number;
    rating: number;
    is_unlocked: boolean;
    visit_count: number;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    height: '100%',
    overflow: 'auto',
}));

const LeaderboardItem = styled(ListItem)(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const DojoDiscovery: React.FC = () => {
    const [selectedDojo, setSelectedDojo] = useState<Dojo | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [showChallengeDialog, setShowChallengeDialog] = useState(false);

    useEffect(() => {
        if (selectedDojo) {
            fetchRegionalLeaderboard(selectedDojo.latitude, selectedDojo.longitude);
            fetchDojoChallenge(selectedDojo.id);
        }
    }, [selectedDojo]);

    const fetchRegionalLeaderboard = async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `/api/geo/leaderboard/regional?lat=${lat}&lng=${lng}`
            );
            const data = await response.json();
            if (data.status === 'success') {
                setLeaderboard(data.leaderboard);
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    };

    const fetchDojoChallenge = async (dojoId: number) => {
        try {
            const response = await fetch(`/api/geo/challenges/${dojoId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setChallenge(data.challenge);
            }
        } catch (error) {
            console.error('Error fetching challenge:', error);
        }
    };

    const handleDojoSelect = (dojo: Dojo) => {
        setSelectedDojo(dojo);
    };

    const handleViewChallenge = () => {
        setShowChallengeDialog(true);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Dojo Discovery
            </Typography>

            <Grid container spacing={3}>
                {/* Map Section */}
                <Grid item xs={12} md={8}>
                    <StyledPaper>
                        <DojoMap
                            apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}
                            onDojoSelect={handleDojoSelect}
                        />
                    </StyledPaper>
                </Grid>

                {/* Leaderboard and Info Section */}
                <Grid item xs={12} md={4}>
                    <Grid container spacing={2}>
                        {/* Selected Dojo Info */}
                        {selectedDojo && (
                            <Grid item xs={12}>
                                <StyledPaper>
                                    <Typography variant="h6" gutterBottom>
                                        {selectedDojo.name}
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Chip
                                            label={selectedDojo.is_unlocked ? 'Unlocked' : 'Locked'}
                                            color={selectedDojo.is_unlocked ? 'success' : 'default'}
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip
                                            label={`${selectedDojo.distance} km away`}
                                            variant="outlined"
                                        />
                                    </Box>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleViewChallenge}
                                        disabled={!challenge}
                                    >
                                        View Challenge
                                    </Button>
                                </StyledPaper>
                            </Grid>
                        )}

                        {/* Regional Leaderboard */}
                        <Grid item xs={12}>
                            <StyledPaper>
                                <Typography variant="h6" gutterBottom>
                                    Regional Leaderboard
                                </Typography>
                                <List>
                                    {leaderboard.map((entry) => (
                                        <LeaderboardItem key={entry.userId}>
                                            <ListItemAvatar>
                                                <AnimatedAvatar
                                                    src={entry.avatar}
                                                    animation="pulse"
                                                />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={entry.username}
                                                secondary={`Rank #${entry.rank}`}
                                            />
                                            <Typography variant="body2">
                                                {entry.score} pts
                                            </Typography>
                                        </LeaderboardItem>
                                    ))}
                                </List>
                            </StyledPaper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Challenge Dialog */}
            <Dialog
                open={showChallengeDialog}
                onClose={() => setShowChallengeDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Area Challenge</DialogTitle>
                <DialogContent>
                    {challenge && (
                        <>
                            <Typography variant="h6" gutterBottom>
                                {challenge.name}
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {challenge.description}
                            </Typography>
                            <Typography variant="subtitle2" gutterBottom>
                                Requirements:
                            </Typography>
                            <Typography variant="body2" paragraph>
                                • Win {challenge.requirements.wins_needed} games
                                <br />
                                • Complete within {challenge.requirements.time_limit_days} days
                            </Typography>
                            <Typography variant="subtitle2" gutterBottom>
                                Rewards:
                            </Typography>
                            <Typography variant="body2">
                                • {challenge.rewards.xp} XP
                                <br />
                                • Title: {challenge.rewards.title}
                            </Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowChallengeDialog(false)}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => setShowChallengeDialog(false)}
                    >
                        Accept Challenge
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default DojoDiscovery; 