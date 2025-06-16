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
  alpha,
  StepConnector,
  stepConnectorClasses,
  styled,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  SportsEsports as GameIcon,
} from '@mui/icons-material';
import { Tournament } from '../../types/tournament';
import { useAuth } from '../../hooks/useAuth';
import { registerForTournament } from '../../services/tournament/tournament';
import useWalletService from '../../frontend/hooks/services/useWalletService';
import { TournamentPayment } from './TournamentPayment';
import '../styles/tournament.scss';

// Cyberpunk styled step connector
const CyberpunkConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(90deg, #00ff88 0%, #00ccff 100%)',
      boxShadow: '0 0 10px #00ff88',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: '#00ff88',
      boxShadow: '0 0 10px #00ff88',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: alpha('#00ff88', 0.3),
    borderRadius: 1,
    transition: 'all 0.3s ease',
  },
}));

// Cyberpunk styled step icon
const CyberpunkStepIcon = (props: any) => {
  const { active, completed, className } = props;
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    info: '#00ccff',
  };

  return (
    <Box
      className={className}
      sx={{
        width: 50,
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: completed 
          ? `linear-gradient(135deg, ${neonColors.primary} 0%, ${neonColors.info} 100%)`
          : active 
          ? `linear-gradient(135deg, ${neonColors.secondary} 0%, ${neonColors.primary} 100%)`
          : alpha(neonColors.primary, 0.2),
        borderRadius: '50%',
        boxShadow: completed || active ? `0 0 20px ${neonColors.primary}` : 'none',
        animation: active ? 'pulse 1.5s infinite' : 'none',
        '@keyframes pulse': {
          '0%': { boxShadow: `0 0 20px ${neonColors.primary}` },
          '50%': { boxShadow: `0 0 30px ${neonColors.primary}` },
          '100%': { boxShadow: `0 0 20px ${neonColors.primary}` },
        },
      }}
    >
      {completed ? (
        <CheckIcon sx={{ color: '#fff', fontSize: 30 }} />
      ) : (
        <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
          {props.icon}
        </Typography>
      )}
    </Box>
  );
};

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
  const [showPaymentComponent, setShowPaymentComponent] = useState(false);

  const { walletData, loading: walletLoading, error: walletError, fetchWalletData } = useWalletService();

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  useEffect(() => {
    if (open && user && typeof (user as any).id === 'string') {
      fetchWalletData((user as any).id);
    }
  }, [open, user, fetchWalletData]);

  const steps = ['Review Details', 'Rules & Requirements', 'Payment Confirmation'];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      setShowPaymentComponent(true);
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePaymentComplete = async () => {
    setShowPaymentComponent(false);
    setSuccess(true);
    onSuccess();
  };

  const handlePaymentCancel = () => {
    setShowPaymentComponent(false);
  };

  const entryFee = typeof tournament.entryFee === 'number' ? tournament.entryFee : 0;
  const tournamentType = tournament.format || '';
  const walletBalance = walletData?.balance ?? 0;
  const isBalanceSufficient = walletBalance >= entryFee;

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box
            sx={{
              p: 3,
              background: alpha(theme.palette.background.default, 0.5),
              borderRadius: 2,
              border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: neonColors.info,
                textShadow: `0 0 10px ${neonColors.info}`,
              }}
            >
              Tournament Details
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GameIcon sx={{ mr: 1, color: neonColors.primary }} />
              <Typography variant="body1">
                Name: <span style={{ color: neonColors.primary, fontWeight: 'bold' }}>{tournament.name}</span>
              </Typography>
            </Box>
            <Typography variant="body1" gutterBottom>
              Format: <span style={{ color: neonColors.info }}>{tournamentType}</span>
            </Typography>
            <Typography variant="body1" gutterBottom>
              Start Date: <span style={{ color: neonColors.warning }}>{new Date(tournament.startDate).toLocaleDateString()}</span>
            </Typography>
            <Typography variant="body1" gutterBottom>
              Entry Fee: <span style={{ color: neonColors.warning, fontWeight: 'bold' }}>${entryFee}</span>
            </Typography>
            <Typography variant="body1">
              Maximum Participants: <span style={{ color: neonColors.info }}>{tournament.maxParticipants}</span>
            </Typography>
          </Box>
        );
      case 1:
        return (
          <Box
            sx={{
              p: 3,
              background: alpha(theme.palette.background.default, 0.5),
              borderRadius: 2,
              border: `1px solid ${alpha(neonColors.secondary, 0.3)}`,
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: neonColors.secondary,
                textShadow: `0 0 10px ${neonColors.secondary}`,
              }}
            >
              Tournament Rules & Requirements
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: theme.palette.text.secondary }}>
              Please review and agree to the following rules and requirements:
            </Typography>
            <Box 
              sx={{ 
                mb: 2,
                p: 2,
                background: alpha(neonColors.primary, 0.05),
                borderLeft: `3px solid ${neonColors.primary}`,
                borderRadius: 1,
              }}
            >
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
                  sx={{
                    color: neonColors.primary,
                    '&.Mui-checked': {
                      color: neonColors.primary,
                    },
                  }}
                />
              }
              label="I agree to follow all tournament rules and requirements"
              sx={{
                '& .MuiFormControlLabel-label': {
                  color: theme.palette.text.primary,
                },
              }}
            />
          </Box>
        );
      case 2:
        return (
          <Box
            sx={{
              p: 3,
              background: alpha(theme.palette.background.default, 0.5),
              borderRadius: 2,
              border: `1px solid ${alpha(neonColors.warning, 0.3)}`,
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: neonColors.warning,
                textShadow: `0 0 10px ${neonColors.warning}`,
              }}
            >
              Payment Confirmation
            </Typography>
            <Typography variant="body1" paragraph>
              Entry Fee: <span style={{ color: neonColors.warning, fontWeight: 'bold' }}>{entryFee} Dojo Coins</span>
            </Typography>

            <Typography variant="body1" gutterBottom>
              Your Current Balance:
              {walletLoading ? (
                <CircularProgress size={16} sx={{ ml: 1, color: neonColors.info }} />
              ) : walletError ? (
                <Typography component="span" color="error" sx={{ ml: 1 }}>
                  Error loading balance.
                </Typography>
              ) : (
                <Typography 
                  component="span" 
                  sx={{ 
                    ml: 1, 
                    fontWeight: 'bold',
                    color: isBalanceSufficient ? neonColors.primary : neonColors.error,
                    textShadow: `0 0 5px ${isBalanceSufficient ? neonColors.primary : neonColors.error}`,
                  }}
                >
                  {walletBalance} Dojo Coins
                </Typography>
              )}
            </Typography>

            {!walletLoading && !walletError && (
              <Alert 
                severity={isBalanceSufficient ? 'success' : 'error'}
                sx={{ 
                  mt: 2,
                  mb: 2,
                  background: alpha(isBalanceSufficient ? neonColors.primary : neonColors.error, 0.1),
                  border: `1px solid ${isBalanceSufficient ? neonColors.primary : neonColors.error}`,
                  '& .MuiAlert-icon': { 
                    color: isBalanceSufficient ? neonColors.primary : neonColors.error 
                  },
                }}
              >
                {isBalanceSufficient
                  ? 'Your balance is sufficient to cover the entry fee.'
                  : 'Your balance is insufficient to cover the entry fee.'}
              </Alert>
            )}

            <Typography variant="body2" paragraph sx={{ color: theme.palette.text.secondary }}>
              Payment will be processed using your connected wallet upon completing registration.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeToPayment}
                  onChange={(e) => setAgreeToPayment(e.target.checked)}
                  disabled={!isBalanceSufficient}
                  sx={{
                    color: neonColors.warning,
                    '&.Mui-checked': {
                      color: neonColors.warning,
                    },
                  }}
                />
              }
              label="I agree to pay the entry fee and understand it is non-refundable"
              sx={{
                '& .MuiFormControlLabel-label': {
                  color: theme.palette.text.primary,
                },
              }}
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

  if (showPaymentComponent) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`,
            border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
            borderRadius: 2,
            boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.3)}`,
          },
        }}
      >
        <DialogContent>
          <TournamentPayment
            tournament={tournament}
            onPaymentComplete={handlePaymentComplete}
            onCancel={handlePaymentCancel}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`,
          border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
          borderRadius: 2,
          boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.3)}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          fontSize: '1.5rem',
        }}
      >
        Tournament Registration
      </DialogTitle>
      
      <DialogContent>
        {success ? (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              background: alpha(neonColors.primary, 0.1),
              border: `1px solid ${neonColors.primary}`,
              '& .MuiAlert-icon': { color: neonColors.primary },
              animation: 'fadeIn 0.5s ease-in',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'scale(0.9)' },
                '100%': { opacity: 1, transform: 'scale(1)' },
              },
            }}
          >
            Registration complete! You are now entered in the tournament.
          </Alert>
        ) : (
          <>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  background: alpha(neonColors.error, 0.1),
                  border: `1px solid ${neonColors.error}`,
                  '& .MuiAlert-icon': { color: neonColors.error },
                }}
              >
                {error}
              </Alert>
            )}

            <Stepper 
              activeStep={activeStep} 
              sx={{ mb: 4 }}
              connector={<CyberpunkConnector />}
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={() => <CyberpunkStepIcon icon={index + 1} active={activeStep === index} completed={activeStep > index} />}>
                    <Typography
                      sx={{
                        color: activeStep === index ? neonColors.primary : theme.palette.text.secondary,
                        textShadow: activeStep === index ? `0 0 5px ${neonColors.primary}` : 'none',
                      }}
                    >
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {transactionInProgress && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress 
                  size={20} 
                  sx={{ 
                    mr: 2,
                    color: neonColors.info,
                    filter: `drop-shadow(0 0 5px ${neonColors.info})`,
                  }} 
                />
                <Typography 
                  variant="body2"
                  sx={{
                    color: neonColors.info,
                    animation: 'blink 1s infinite',
                    '@keyframes blink': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                  }}
                >
                  Processing payment and registration...
                </Typography>
              </Box>
            )}

            {renderStepContent(activeStep)}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose} 
          disabled={loading || transactionInProgress}
          sx={{
            color: neonColors.secondary,
            borderColor: neonColors.secondary,
            '&:hover': {
              borderColor: neonColors.secondary,
              background: alpha(neonColors.secondary, 0.1),
            },
          }}
        >
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && activeStep > 0 && (
          <Button 
            onClick={handleBack} 
            disabled={loading || transactionInProgress}
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            Back
          </Button>
        )}
        {!success && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || transactionInProgress || !isStepComplete(activeStep) || (activeStep === steps.length - 1 && !isBalanceSufficient)}
            sx={{
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
            {activeStep === steps.length - 1 ? 'Proceed to Payment' : 'Next'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}; 