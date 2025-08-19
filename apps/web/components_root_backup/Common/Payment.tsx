import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useWallet } from '../../hooks/useWallet';

interface PaymentProps {
  amount: number;
  description: string;
  onSuccess: () => void;
}

const Payment: React.FC<PaymentProps> = ({
  amount,
  description,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const { wallet, processPayment } = useWallet();
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Process payment
      const result = await processPayment({
        amount,
        description,
      });

      if (result.success) {
        // Update user's wallet balance
        updateUser({
          ...user,
          wallet: {
            ...wallet,
            balance: wallet.balance - amount,
          },
        });

        onSuccess();
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to process payment'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Payment
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Details
              </Typography>
              <Typography variant="body1">
                Amount: {amount} Dojo Coins
              </Typography>
              <Typography variant="body1">
                Description: {description}
              </Typography>
              <Typography variant="body1">
                Current Balance: {wallet.balance} Dojo Coins
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Method
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Payment ID"
                    placeholder="Optional - for reference"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handlePayment}
                    disabled={processing || wallet.balance < amount}
                  >
                    {processing ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Processing...
                      </>
                    ) : (
                      'Pay Now'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Payment;
