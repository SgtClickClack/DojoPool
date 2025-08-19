import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { useWallet } from '../hooks/useWallet';
// import { useTournament } from '../hooks/useTournament';

interface TournamentPaymentProps {
  tournamentId: string;
}

const TournamentPayment: React.FC<TournamentPaymentProps> = ({
  tournamentId,
}) => {
  const navigate = useNavigate();
  // const {
  //   tournament,
  //   loading: tournamentLoading,
  //   error: tournamentError,
  // } = useTournament(tournamentId);
  // const {
  //   wallet,
  //   loading: walletLoading,
  //   error: walletError,
  //   processPayment,
  // } = useWallet();

  // Temporary mock data
  const tournament = {
    id: tournamentId,
    name: 'Tournament',
    entryFee: 50,
    type: 'single_elimination',
    registrationDeadline: '2024-12-31',
    maxParticipants: 32,
    prizePool: 1000,
  };
  const tournamentLoading = false;
  const tournamentError = null;
  const wallet = { id: 'mock-wallet', balance: 1000 };
  const walletLoading = false;
  const walletError = null;
  const processPayment = async (data: any) => ({
    success: true,
    message: 'Payment successful',
  });
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const handlePayment = async () => {
    if (!tournament || !wallet) return;

    setProcessing(true);
    setPaymentError(null);

    try {
      const paymentResult = await processPayment({
        amount: tournament.entryFee,
        description: `Tournament entry fee for ${tournament.name}`,
      });

      if (paymentResult.success) {
        // Navigate to tournament page after successful payment
        navigate(`/tournaments/${tournamentId}`);
      } else {
        setPaymentError(paymentResult.message || 'Payment failed');
      }
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : 'Failed to process payment'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (tournamentLoading || walletLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (tournamentError || walletError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Alert severity="error">
            {tournamentError?.message ||
              walletError?.message ||
              'Failed to load data'}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Tournament Entry Fee
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tournament Details
              </Typography>
              <Typography variant="body1">Name: {tournament.name}</Typography>
              <Typography variant="body1">
                Type: {tournament.type.replace('_', ' ')}
              </Typography>
              <Typography variant="body1">
                Entry Fee: {tournament.entryFee} Dojo Coins
              </Typography>
              <Typography variant="body1">
                Registration Deadline: {tournament.registrationDeadline}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Wallet
              </Typography>
              <Typography variant="body1">
                Available Balance: {wallet.balance} Dojo Coins
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Required: {tournament.entryFee} Dojo Coins
              </Typography>
              {wallet.balance < tournament.entryFee && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Insufficient balance. Please add more Dojo Coins to your
                  wallet.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment
              </Typography>
              {paymentError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {paymentError}
                </Alert>
              )}
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handlePayment}
                disabled={processing || wallet.balance < tournament.entryFee}
                sx={{ mt: 2 }}
              >
                {processing ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Processing Payment...
                  </>
                ) : (
                  'Pay Entry Fee'
                )}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TournamentPayment;
