import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControlLabel,
  Checkbox,
  useTheme,
} from '@mui/material';
import { Tournament } from '../../types/tournament';
import { useAuth } from '../../hooks/useAuth';
import { registerForTournament } from '../../services/tournament/tournament';
import useWalletService from '../../frontend/hooks/services/useWalletService';

interface TournamentRegistrationProps {
  tournament: Tournament;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TournamentRegistration: React.FC<TournamentRegistrationProps> = ({
  tournament,
  open,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreeToRules, setAgreeToRules] = useState(false);
  const [agreeToPayment, setAgreeToPayment] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactionInProgress, setTransactionInProgress] = useState(false);

  const { walletData, loading: walletLoading, error: walletError, fetchWalletData } = useWalletService();

  useEffect(() => {
    if (open && user && typeof (user as any).id === 'string') {
      fetchWalletData((user as any).id);
    }
  }, [open, user, fetchWalletData]);

  const steps = ['Review Details', 'Rules & Requirements', 'Payment Confirmation'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleRegister = async () => {
    try {
      setTransactionInProgress(true);
      setLoading(true);
      setError(null);
      await registerForTournament(tournament.id);
      setSuccess(true);
      onSuccess();
    } catch (err: any) {
      if (err?.response?.data?.error?.toLowerCase().includes('payment')) {
        setError('Payment failed. Please check your wallet balance and try again.');
      } else {
        setError('Failed to register for tournament. Please try again.');
      }
    } finally {
      setLoading(false);
      setTransactionInProgress(false);
    }
  };

  const entryFee = typeof tournament.entryFee === 'number' ? tournament.entryFee : 0;
  const tournamentType = (tournament as any).type || (tournament as any).format || '';
  const walletBalance = walletData?.balance ?? 0;
  const isBalanceSufficient = walletBalance >= entryFee;

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Tournament Details
            </Typography>
            <Typography variant="body1" gutterBottom>
              Name: {tournament.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Type: {tournamentType}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Start Date: {new Date(tournament.startDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Entry Fee: ${entryFee}
            </Typography>
            <Typography variant="body1">
              Maximum Participants: {tournament.maxParticipants}
            </Typography>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Tournament Rules & Requirements
            </Typography>
            <Typography variant="body1" paragraph>
              Please review and agree to the following rules and requirements:
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" paragraph>
                1. Players must arrive 30 minutes before their scheduled match time.
              </Typography>
              <Typography variant="body2" paragraph>
                2. All matches will be played according to official DojoPool rules.
              </Typography>
              <Typography variant="body2" paragraph>
                3. Players must maintain respectful behavior throughout the tournament.
              </Typography>
              <Typography variant="body2" paragraph>
                4. Tournament schedule is final and cannot be modified.
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeToRules}
                  onChange={(e) => setAgreeToRules(e.target.checked)}
                />
              }
              label="I agree to follow all tournament rules and requirements"
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Confirmation
            </Typography>
            <Typography variant="body1" paragraph>
              Entry Fee: {entryFee} Dojo Coins
            </Typography>

            <Typography variant="body1" gutterBottom>
              Your Current Balance:
              {walletLoading ? (
                <CircularProgress size={16} sx={{ ml: 1 }} />
              ) : walletError ? (
                <Typography component="span" color="error" sx={{ ml: 1 }}>
                  Error loading balance.
                </Typography>
              ) : (
                <Typography component="span" sx={{ ml: 1, fontWeight: 'bold' }}>
                  {walletBalance} Dojo Coins
                </Typography>
              )}
            </Typography>

            {!walletLoading && !walletError && (
              <Typography variant="body2" paragraph color={isBalanceSufficient ? 'success.main' : 'error.main'}>
                {isBalanceSufficient
                  ? 'Your balance is sufficient to cover the entry fee.'
                  : 'Your balance is insufficient to cover the entry fee.'}
              </Typography>
            )}

            <Typography variant="body2" paragraph>
              Payment will be processed using your connected wallet upon completing registration.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeToPayment}
                  onChange={(e) => setAgreeToPayment(e.target.checked)}
                  disabled={!isBalanceSufficient}
                />
              }
              label="I agree to pay the entry fee and understand it is non-refundable"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return agreeToRules;
      case 2:
        return agreeToPayment;
      default:
        return false;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: theme.palette.background.paper,
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        Tournament Registration
      </DialogTitle>
      
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Registration complete! You are now entered in the tournament.
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {transactionInProgress && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography variant="body2">Processing payment and registration...</Typography>
              </Box>
            )}

            {renderStepContent(activeStep)}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={loading || transactionInProgress}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading || transactionInProgress}>
            Back
          </Button>
        )}
        {!success && (activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleRegister}
            disabled={loading || transactionInProgress || !isStepComplete(activeStep) || !isBalanceSufficient}
          >
            {loading || transactionInProgress ? <CircularProgress size={24} /> : 'Complete Registration'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || transactionInProgress || !isStepComplete(activeStep)}
          >
            Next
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
}; 