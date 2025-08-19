import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  CircularProgress, // For loading states
  Alert, // For displaying messages
} from '@mui/material';
// useNavigate is imported but not used. Remove if not planned for use.
// import { useNavigate, useParams } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament'; // Assuming this provides tournament data
import { useRewards } from '../hooks/useRewards'; // Assuming this provides rewards and claim function

// --- Define Interfaces for better Type Safety ---
interface Match {
  id: string | number;
  player1: string;
  player2: string;
  score1?: number; // Optional if match is not played
  score2?: number; // Optional
  status: 'completed' | 'in progress' | 'pending' | 'cancelled'; // Example statuses
  winner?: string | null; // Winner's name or ID, null for a draw
  round?: number; // Optional: useful for identifying final match
  // Add other relevant match properties
}

interface Tournament {
  id: string | number;
  name: string;
  type: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'; // Example statuses
  matches: Match[];
  // Add other relevant tournament properties like description, startDate, endDate etc.
}

interface Reward {
  id: string | number;
  name: string;
  description?: string;
  type: string; // e.g., 'badge', 'coins', 'item'
  claimed?: boolean; // To manage UI state after claiming
  // Add other relevant reward properties like imageUrl
}

interface TournamentResultsProps {
  tournamentId: string;
}

const TournamentResults: React.FC<TournamentResultsProps> = ({
  tournamentId,
}) => {
  // const navigate = useNavigate(); // Keep if you plan to use it
  const {
    tournament,
    loading: tournamentLoading,
    error: tournamentError,
  } = useTournament(tournamentId) as {
    tournament: Tournament | null;
    loading: boolean;
    error: Error | null;
  };
  const {
    rewards,
    claimReward,
    loading: rewardsLoading,
    error: rewardsError,
  } = useRewards();

  // State for individual reward claim loading
  const [claimingRewardId, setClaimingRewardId] = useState<
    string | number | null
  >(null);

  const handleClaimReward = useCallback(
    async (rewardId: string | number) => {
      setClaimingRewardId(rewardId);
      try {
        await claimReward(String(rewardId)); // Always pass string
        // Optionally, useSnackbar from notistack for feedback
        // enqueueSnackbar('Reward claimed successfully!', { variant: 'success' });
        // The useRewards hook should ideally update the 'rewards' list (e.g., mark as claimed)
      } catch (err) {
        console.error('Failed to claim reward:', err);
        // enqueueSnackbar(err.message || 'Failed to claim reward.', { variant: 'error' });
      } finally {
        setClaimingRewardId(null);
      }
    },
    [claimReward]
  );

  const getMatchResultDisplay = (match: Match) => {
    if (match.status === 'completed') {
      if (match.winner) {
        return (
          <Typography variant="body2" color="success.main" fontWeight="bold">
            Winner: {match.winner}
          </Typography>
        );
      } else {
        return (
          <Typography variant="body2" color="text.secondary">
            Match ended in a draw
          </Typography>
        );
      }
    } else if (match.status === 'in progress') {
      return (
        <Typography variant="body2" color="info.main">
          In Progress
        </Typography>
      );
    } else if (match.status === 'pending') {
      return (
        <Typography variant="body2" color="text.disabled">
          Pending
        </Typography>
      );
    }
    return (
      <Typography variant="body2" color="text.disabled">
        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
      </Typography>
    );
  };

  // --- Loading and Error States ---
  if (tournamentLoading || rewardsLoading) {
    // Check loading state from both hooks
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Loading tournament results...</Typography>
      </Container>
    );
  }

  if (tournamentError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ width: '100%' }}>
          Failed to load tournament details: {tournamentError.message}
        </Alert>
      </Container>
    );
  }
  if (rewardsError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ width: '100%' }}>
          Failed to load rewards: {rewardsError.message}
        </Alert>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ width: '100%' }}>
          Tournament data not found.
        </Alert>
      </Container>
    );
  }

  // --- Data for Display ---
  // Attempt to find a "final" match, e.g., highest round number or specific status/flag
  // This is a simplified example; your logic might be more complex.
  const finalMatch =
    tournament.matches && tournament.matches.length > 0
      ? tournament.matches.reduce(
          (prev, current) =>
            (prev.round || 0) > (current.round || 0) ? prev : current,
          tournament.matches[0]
        )
      : null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ textAlign: { xs: 'center', md: 'left' } }}
          >
            {tournament.name} Results
          </Typography>
        </Grid>

        {/* Tournament Summary Card */}
        <Grid item xs={12} md={7}>
          {' '}
          {/* Adjusted grid size */}
          <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Tournament Summary
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong>{' '}
                {tournament.type?.replace('_', ' ') || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong>{' '}
                <span
                  style={{
                    color:
                      tournament.status === 'completed' ? 'green' : 'orange',
                  }}
                >
                  {tournament.status?.charAt(0).toUpperCase() +
                    tournament.status?.slice(1) || 'N/A'}
                </span>
              </Typography>
              {finalMatch && (
                <Typography variant="body1" gutterBottom>
                  <strong>Final Match:</strong> {finalMatch.player1} vs{' '}
                  {finalMatch.player2}
                  {finalMatch.status === 'completed' && finalMatch.winner && (
                    <>
                      {' '}
                      - <strong>Winner:</strong> {finalMatch.winner}
                    </>
                  )}
                </Typography>
              )}
              {(!tournament.matches || tournament.matches.length === 0) && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  No match results available yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Your Rewards Card */}
        <Grid item xs={12} md={5}>
          {' '}
          {/* Adjusted grid size */}
          <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Your Rewards
              </Typography>
              {rewards && rewards.length > 0 ? (
                <List sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {rewards.map(
                    (
                      reward: Reward // Use Reward interface
                    ) => (
                      <React.Fragment key={reward.id}>
                        <ListItem
                          secondaryAction={
                            !reward.claimed && ( // Only show claim button if not claimed
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleClaimReward(reward.id)}
                                disabled={claimingRewardId === reward.id}
                              >
                                {claimingRewardId === reward.id ? (
                                  <CircularProgress size={20} color="inherit" />
                                ) : (
                                  'Claim'
                                )}
                              </Button>
                            )
                          }
                          sx={{ opacity: reward.claimed ? 0.6 : 1 }}
                        >
                          <ListItemAvatar>
                            {/* Consider using icons based on reward.type */}
                            <Avatar
                              sx={{
                                bgcolor: reward.claimed
                                  ? 'action.disabledBackground'
                                  : 'primary.main',
                              }}
                            >
                              {reward.type?.[0]?.toUpperCase() || 'R'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={reward.name}
                            secondary={
                              reward.claimed
                                ? 'Already Claimed'
                                : reward.description
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    )
                  )}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No rewards available to claim for this tournament or rewards
                  information is loading.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Match Results Section */}
        {tournament.matches && tournament.matches.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ p: { xs: 2, sm: 3 } }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Match Results
                </Typography>
                <Grid container spacing={2}>
                  {' '}
                  {/* Reduced spacing for denser match list */}
                  {tournament.matches.map(
                    (
                      match: Match // Use Match interface
                    ) => (
                      <Grid item xs={12} sm={6} md={4} key={match.id}>
                        <Card
                          variant="outlined" // Subtle distinction for match cards
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="h6"
                              component="h3"
                              fontSize="1.1rem"
                              gutterBottom
                            >
                              {match.player1 || 'Player 1'} vs{' '}
                              {match.player2 || 'Player 2'}
                            </Typography>
                            {match.status !== 'pending' &&
                              match.score1 !== undefined &&
                              match.score2 !== undefined && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  gutterBottom
                                >
                                  Score: {match.score1} - {match.score2}
                                </Typography>
                              )}
                            {getMatchResultDisplay(match)}
                            {match.round && (
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.disabled"
                                sx={{ mt: 1 }}
                              >
                                Round: {match.round}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    )
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

// It's good practice to have a wrapper component if you need to fetch ID from params
// const TournamentResultsPage: React.FC = () => {
//   const { tournamentId } = useParams<{ tournamentId: string }>();
//   if (!tournamentId) return <Alert severity="error">Tournament ID is missing.</Alert>;
//   return <TournamentResults tournamentId={tournamentId} />;
// };
// export default TournamentResultsPage;

export default TournamentResults;
