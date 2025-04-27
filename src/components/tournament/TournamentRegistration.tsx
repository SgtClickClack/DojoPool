import React, { useState } from 'react';
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
import { registerForTournament } from '../../services/tournament';

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

  const steps = ['Review Details', 'Rules & Requirements', 'Payment Confirmation'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await registerForTournament(tournament.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to register for tournament. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              Type: {tournament.type}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Start Date: {new Date(tournament.startDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Entry Fee: ${tournament.entryFee}
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
              Entry Fee: ${tournament.entryFee}
            </Typography>
            <Typography variant="body2" paragraph>
              Payment will be processed using your connected wallet.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeToPayment}
                  onChange={(e) => setAgreeToPayment(e.target.checked)}
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

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleRegister}
            disabled={loading || !isStepComplete(activeStep)}
          >
            {loading ? <CircularProgress size={24} /> : 'Complete Registration'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || !isStepComplete(activeStep)}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}; 