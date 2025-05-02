import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TournamentBracket from '../components/TournamentBracket';
import { useTournaments } from '../hooks/useTournaments';

const TournamentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tournaments, loading, error } = useTournaments();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Alert severity="error">{error.message}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Tournaments
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Tournaments
            </Typography>
            <Grid container spacing={3}>
              {tournaments.map((tournament) => (
                <Grid item xs={12} md={6} lg={4} key={tournament.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {tournament.name}
                      </Typography>
                      <Typography variant="body1">
                        Type: {tournament.type.replace('_', ' ')}
                      </Typography>
                      <Typography variant="body1">
                        Entry Fee: {tournament.entryFee} Dojo Coins
                      </Typography>
                      <Typography variant="body1">
                        Registration Deadline: {tournament.registrationDeadline}
                      </Typography>
                      <Typography variant="body1">
                        Status: {tournament.status}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <TournamentBracket
                          tournament={tournament}
                          onRegister={() => {
                            navigate(`/tournaments/${tournament.id}/register`);
                          }}
                          onPayEntryFee={() => {
                            navigate(`/tournaments/${tournament.id}/payment`);
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TournamentsPage;
