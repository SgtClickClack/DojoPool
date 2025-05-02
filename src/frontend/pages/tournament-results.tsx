import React from 'react';
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
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useRewards } from '../hooks/useRewards';

interface TournamentResultsProps {
  tournamentId: string;
}

const TournamentResults: React.FC<TournamentResultsProps> = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { tournament, loading, error } = useTournament(tournamentId);
  const { rewards, claimReward } = useRewards();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Loading tournament results...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography color="error">{error.message}</Typography>
        </Box>
      </Container>
    );
  }

  const getMatchResult = (match: any) => {
    if (match.status === 'completed') {
      return match.winner ? (
        <Typography variant="body2" color="success.main">
          {match.winner} won
        </Typography>
      ) : (
        <Typography variant="body2" color="error">
          Match ended in a draw
        </Typography>
      );
    }
    return <Typography variant="body2">In progress</Typography>;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            {tournament.name} Results
          </Typography>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tournament Summary
              </Typography>
              <Typography variant="body1">
                Type: {tournament.type.replace('_', ' ')}
              </Typography>
              <Typography variant="body1">
                Status: {tournament.status}
              </Typography>
              <Typography variant="body1">
                Final Match: {tournament.matches[0].player1} vs {tournament.matches[0].player2}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Rewards
              </Typography>
              <List>
                {rewards.map((reward) => (
                  <React.Fragment key={reward.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>{reward.type[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={reward.name}
                        secondary={reward.description}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => claimReward(reward.id)}
                      >
                        Claim
                      </Button>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Match Results
              </Typography>
              <Grid container spacing={3}>
                {tournament.matches.map((match) => (
                  <Grid item xs={12} sm={6} md={4} key={match.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">
                          {match.player1} vs {match.player2}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Score: {match.score1}-{match.score2}
                        </Typography>
                        {getMatchResult(match)}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TournamentResults;
