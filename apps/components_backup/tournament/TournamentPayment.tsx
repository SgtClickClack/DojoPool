import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { type Tournament } from '../../types/tournament';
import useWalletService from '../../frontend/hooks/services/useWalletService';
import { useAuth } from '../../hooks/useAuth';

interface TournamentPaymentProps {
  tournament: Tournament;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

export const TournamentPayment: React.FC<TournamentPaymentProps> = ({
  tournament,
  onPaymentComplete,
  onCancel,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    walletData,
    loading: walletLoading,
    error: walletError,
    fetchWalletData,
  } = useWalletService();

  useEffect(() => {
    if (user && typeof (user as any).id === 'string') {
      fetchWalletData((user as any).id);
    }
  }, [user, fetchWalletData]);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      // Simulate payment processing with cyberpunk animation delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would integrate with actual payment processing
      // For now, we'll simulate success
      setPaymentStatus('success');

      // Wait a moment before completing
      setTimeout(() => {
        onPaymentComplete();
      }, 1500);
    } catch (error: any) {
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const entryFee =
    typeof tournament.entryFee === 'number' ? tournament.entryFee : 0;
  const walletBalance = walletData?.balance ?? 0;
  const isBalanceSufficient = walletBalance >= entryFee;

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return neonColors.primary;
      case 'error':
        return neonColors.error;
      case 'processing':
        return neonColors.info;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
        border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
        borderRadius: 2,
        boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.2)}`,
        animation:
          paymentStatus === 'processing' ? 'pulse 1.5s infinite' : 'none',
        '@keyframes pulse': {
          '0%': { boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.2)}` },
          '50%': { boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.4)}` },
          '100%': { boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.2)}` },
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <WalletIcon
            sx={{
              fontSize: 40,
              mr: 2,
              color: neonColors.primary,
              filter: `drop-shadow(0 0 10px ${neonColors.primary})`,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Payment Processing
          </Typography>
        </Box>

        <Box
          sx={{
            p: 3,
            mb: 3,
            background: alpha(theme.palette.background.default, 0.5),
            borderRadius: 1,
            border: `1px solid ${alpha(neonColors.primary, 0.2)}`,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: neonColors.info }}>
            Tournament: {tournament.name}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Entry Fee:{' '}
            <span style={{ color: neonColors.warning, fontWeight: 'bold' }}>
              {entryFee} Dojo Coins
            </span>
          </Typography>

          <Divider
            sx={{ my: 2, borderColor: alpha(neonColors.primary, 0.2) }}
          />

          <Typography variant="body1" gutterBottom>
            Your Balance:
            {walletLoading ? (
              <CircularProgress
                size={16}
                sx={{ ml: 1, color: neonColors.info }}
              />
            ) : (
              <span
                style={{
                  color: isBalanceSufficient
                    ? neonColors.primary
                    : neonColors.error,
                  fontWeight: 'bold',
                  marginLeft: 8,
                  filter: `drop-shadow(0 0 5px ${isBalanceSufficient ? neonColors.primary : neonColors.error})`,
                }}
              >
                {walletBalance} Dojo Coins
              </span>
            )}
          </Typography>

          {!walletLoading && !isBalanceSufficient && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                background: alpha(neonColors.error, 0.1),
                border: `1px solid ${neonColors.error}`,
                '& .MuiAlert-icon': { color: neonColors.error },
              }}
            >
              Insufficient balance. Please add funds to your wallet.
            </Alert>
          )}
        </Box>

        {paymentStatus === 'success' && (
          <Alert
            icon={<CheckIcon />}
            severity="success"
            sx={{
              mb: 3,
              background: alpha(neonColors.primary, 0.1),
              border: `1px solid ${neonColors.primary}`,
              '& .MuiAlert-icon': { color: neonColors.primary },
            }}
          >
            Payment successful! Registration complete.
          </Alert>
        )}

        {paymentStatus === 'error' && (
          <Alert
            icon={<ErrorIcon />}
            severity="error"
            sx={{
              mb: 3,
              background: alpha(neonColors.error, 0.1),
              border: `1px solid ${neonColors.error}`,
              '& .MuiAlert-icon': { color: neonColors.error },
            }}
          >
            {errorMessage}
          </Alert>
        )}

        {paymentStatus === 'processing' && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            py={3}
          >
            <CircularProgress
              size={60}
              sx={{
                color: neonColors.info,
                filter: `drop-shadow(0 0 10px ${neonColors.info})`,
              }}
            />
            <Typography
              variant="body1"
              sx={{
                ml: 2,
                color: neonColors.info,
                animation: 'blink 1s infinite',
                '@keyframes blink': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            >
              Processing payment...
            </Typography>
          </Box>
        )}

        <Box display="flex" gap={2} mt={3}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={processing || paymentStatus === 'success'}
            sx={{
              borderColor: neonColors.secondary,
              color: neonColors.secondary,
              '&:hover': {
                borderColor: neonColors.secondary,
                background: alpha(neonColors.secondary, 0.1),
                boxShadow: `0 0 10px ${alpha(neonColors.secondary, 0.5)}`,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePayment}
            disabled={
              processing ||
              !isBalanceSufficient ||
              walletLoading ||
              paymentStatus === 'success'
            }
            sx={{
              flex: 1,
              background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.info} 90%)`,
              boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
              '&:hover': {
                background: `linear-gradient(45deg, ${neonColors.primary} 10%, ${neonColors.info} 100%)`,
                boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.7)}`,
              },
              '&:disabled': {
                background: theme.palette.action.disabledBackground,
              },
            }}
          >
            {processing ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
