import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CircularProgress,
  Alert,
  FormControl,
  FormControlLabel,
  Checkbox,
  Divider,
  IconButton,
  LinearProgress,
  Fade,
  Zoom
} from '@mui/material';
import {
  EmojiEvents,
  CheckCircle,
  Warning,
  AttachMoney,
  Security,
  Close,
  ArrowForward,
  ArrowBack,
  Payment,
  Person,
  Gavel
} from '@mui/icons-material';
import { Tournament } from '../../types/tournament';
import { useAuth } from '../../hooks/useAuth';

interface TournamentRegistrationProps {
  tournament: Tournament;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

enum RegistrationStep {
  CONFIRM_DETAILS = 0,
  CONFIRM_RULES = 1,
  PAYMENT = 2,
  REGISTERING = 3,
  COMPLETED = 4,
  ERROR = 5,
}

const TournamentRegistration: React.FC<TournamentRegistrationProps> = ({
  tournament,
  open,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(RegistrationStep.CONFIRM_DETAILS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');

  // Cyberpunk styling constants
  const cyberCardStyle = {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid #00ff9d',
    borderRadius: '15px',
    padding: '1.5rem',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.4s ease',
    boxShadow: '0 0 30px rgba(0, 255, 157, 0.1), inset 0 0 30px rgba(0, 255, 157, 0.05)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent, rgba(0, 255, 157, 0.1), transparent)',
      transform: 'translateZ(-1px)',
    }
  };

  const neonTextStyle = {
    color: '#fff',
    textShadow: '0 0 10px rgba(0, 255, 157, 0.8), 0 0 20px rgba(0, 255, 157, 0.4), 0 0 30px rgba(0, 255, 157, 0.2)',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  };

  const cyberButtonStyle = {
    background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    padding: '12px 24px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
      background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: '0.5s',
    },
    '&:hover::before': {
      left: '100%',
    }
  };

  const steps = [
    {
      label: 'Confirm Details',
      icon: <Person />,
      description: 'Review tournament information and your details'
    },
    {
      label: 'Accept Rules',
      icon: <Gavel />,
      description: 'Read and accept tournament rules and terms'
    },
    {
      label: 'Payment',
      icon: <Payment />,
      description: 'Complete payment for tournament entry'
    },
    {
      label: 'Registration',
      icon: <CheckCircle />,
      description: 'Finalizing your registration'
    }
  ];

  const handleNext = () => {
    if (activeStep === RegistrationStep.CONFIRM_DETAILS) {
      setActiveStep(RegistrationStep.CONFIRM_RULES);
    } else if (activeStep === RegistrationStep.CONFIRM_RULES) {
      if (!acceptedRules || !acceptedTerms) {
        setError('You must accept both the rules and terms to continue');
        return;
      }
      setActiveStep(RegistrationStep.PAYMENT);
    } else if (activeStep === RegistrationStep.PAYMENT) {
      handleRegistration();
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };

  const handleRegistration = async () => {
    setLoading(true);
    setError(null);
    setActiveStep(RegistrationStep.REGISTERING);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Replace with actual registration API call
      // await registerForTournament(tournament.id, user.id);
      
      setActiveStep(RegistrationStep.COMPLETED);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setActiveStep(RegistrationStep.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (activeStep < RegistrationStep.REGISTERING) {
      onClose();
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case RegistrationStep.CONFIRM_DETAILS:
        return (
          <Fade in>
            <Box>
              <Typography variant="h6" sx={neonTextStyle} gutterBottom>
                Tournament Details
              </Typography>
              
              <Card sx={cyberCardStyle} style={{ marginBottom: '1rem' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: '#00ff9d', fontWeight: 'bold' }}>
                      Tournament Name
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
                      {tournament.name}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ color: '#00a8ff', fontWeight: 'bold' }}>
                      Format
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
                      {tournament.format}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ color: '#ff00ff', fontWeight: 'bold' }}>
                      Entry Fee
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
                      {tournament.entryFee} DOJO
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: '#ffff00', fontWeight: 'bold' }}>
                      Prize Pool
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
                      {tournament.prizePool} DOJO
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ color: '#00ff9d', fontWeight: 'bold' }}>
                      Start Date
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
                      {new Date(tournament.startDate).toLocaleDateString()}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ color: '#00a8ff', fontWeight: 'bold' }}>
                      Participants
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ccc' }}>
                      {tournament.participants}/{tournament.maxParticipants}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              <Card sx={cyberCardStyle}>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  Your Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ color: '#ccc' }}>
                    Username: {user?.displayName || user?.email || 'Unknown'}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#ccc' }}>
                    Email: {user?.email || 'Not provided'}
                  </Typography>
                </Box>
              </Card>
            </Box>
          </Fade>
        );

      case RegistrationStep.CONFIRM_RULES:
        return (
          <Fade in>
            <Box>
              <Typography variant="h6" sx={neonTextStyle} gutterBottom>
                Tournament Rules & Terms
              </Typography>
              
              <Card sx={cyberCardStyle} style={{ marginBottom: '1rem' }}>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  <Gavel sx={{ mr: 1 }} />
                  Tournament Rules
                </Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    1. All players must arrive 15 minutes before their scheduled match time.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    2. Standard 8-ball rules apply unless otherwise specified.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    3. No coaching or outside assistance is allowed during matches.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    4. Tournament officials have final say on all rule interpretations.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    5. Entry fees are non-refundable once registration closes.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    6. Players must maintain appropriate conduct throughout the tournament.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    7. Prize distribution will be handled within 24 hours of tournament completion.
                  </Typography>
                </Box>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptedRules}
                      onChange={(e) => setAcceptedRules(e.target.checked)}
                      sx={{
                        color: '#00ff9d',
                        '&.Mui-checked': {
                          color: '#00ff9d',
                        },
                      }}
                    />
                  }
                  label="I accept the tournament rules"
                  sx={{ color: '#ccc' }}
                />
              </Card>

              <Card sx={cyberCardStyle}>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  <Security sx={{ mr: 1 }} />
                  Terms of Service
                </Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    By registering for this tournament, you agree to:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    • Provide accurate registration information
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    • Comply with all tournament rules and venue policies
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    • Accept that tournament organizers may use your image/video for promotional purposes
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    • Understand that entry fees are non-refundable
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    • Release DojoPool from liability for any injuries or damages
                  </Typography>
                </Box>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      sx={{
                        color: '#00a8ff',
                        '&.Mui-checked': {
                          color: '#00a8ff',
                        },
                      }}
                    />
                  }
                  label="I accept the terms of service"
                  sx={{ color: '#ccc' }}
                />
              </Card>
            </Box>
          </Fade>
        );

      case RegistrationStep.PAYMENT:
        return (
          <Fade in>
            <Box>
              <Typography variant="h6" sx={neonTextStyle} gutterBottom>
                Payment Method
              </Typography>
              
              <Card sx={cyberCardStyle}>
                <Typography variant="h6" sx={{ color: '#ff00ff', mb: 2 }}>
                  <AttachMoney sx={{ mr: 1 }} />
                  Entry Fee: {tournament.entryFee} DOJO
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ color: '#ccc', mb: 2 }}>
                    Select Payment Method:
                  </Typography>
                  
                  <FormControl component="fieldset" sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                      <Card 
                        sx={{ 
                          ...cyberCardStyle,
                          cursor: 'pointer',
                          border: paymentMethod === 'wallet' ? '2px solid #00ff9d' : '1px solid #00ff9d',
                          transform: paymentMethod === 'wallet' ? 'scale(1.05)' : 'scale(1)',
                        }}
                        onClick={() => setPaymentMethod('wallet')}
                      >
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h6" sx={{ color: '#00ff9d', mb: 1 }}>
                            Dojo Wallet
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            Pay with your Dojo Coin balance
                          </Typography>
                        </Box>
                      </Card>
                      
                      <Card 
                        sx={{ 
                          ...cyberCardStyle,
                          cursor: 'pointer',
                          border: paymentMethod === 'card' ? '2px solid #00a8ff' : '1px solid #00a8ff',
                          transform: paymentMethod === 'card' ? 'scale(1.05)' : 'scale(1)',
                        }}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h6" sx={{ color: '#00a8ff', mb: 1 }}>
                            Credit Card
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            Pay with credit/debit card
                          </Typography>
                        </Box>
                      </Card>
                    </Box>
                  </FormControl>
                </Box>
                
                <Divider sx={{ borderColor: 'rgba(0, 255, 157, 0.3)', my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#ccc' }}>
                    Total Amount:
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#00ff9d', fontWeight: 'bold' }}>
                    {tournament.entryFee} DOJO
                  </Typography>
                </Box>
              </Card>
            </Box>
          </Fade>
        );

      case RegistrationStep.REGISTERING:
        return (
          <Zoom in>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress 
                size={80}
                sx={{ 
                  color: '#00ff9d',
                  mb: 3,
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }} 
              />
              <Typography variant="h5" sx={neonTextStyle} gutterBottom>
                Processing Registration
              </Typography>
              <Typography variant="body1" sx={{ color: '#ccc' }}>
                Please wait while we complete your tournament registration...
              </Typography>
              <LinearProgress 
                sx={{ 
                  mt: 3,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(0, 255, 157, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, #00ff9d 0%, #00a8ff 100%)',
                    boxShadow: '0 0 20px #00ff9d',
                  },
                }} 
              />
            </Box>
          </Zoom>
        );

      case RegistrationStep.COMPLETED:
        return (
          <Zoom in>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle 
                sx={{ 
                  fontSize: 80, 
                  color: '#00ff9d', 
                  mb: 3,
                  filter: 'drop-shadow(0 0 20px #00ff9d)'
                }} 
              />
              <Typography variant="h5" sx={neonTextStyle} gutterBottom>
                Registration Complete!
              </Typography>
              <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                You have successfully registered for {tournament.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#888' }}>
                You will receive a confirmation email shortly.
              </Typography>
            </Box>
          </Zoom>
        );

      case RegistrationStep.ERROR:
        return (
          <Fade in>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Warning 
                sx={{ 
                  fontSize: 80, 
                  color: '#ff4444', 
                  mb: 3,
                  filter: 'drop-shadow(0 0 20px #ff4444)'
                }} 
              />
              <Typography variant="h5" sx={{ color: '#ff4444', fontWeight: 'bold' }} gutterBottom>
                Registration Failed
              </Typography>
              <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                {error || 'An error occurred during registration'}
              </Typography>
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          border: '1px solid #00ff9d',
          borderRadius: '15px',
          boxShadow: '0 0 50px rgba(0, 255, 157, 0.3)',
        }
      }}
    >
      <DialogTitle sx={{ 
        ...neonTextStyle,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 255, 157, 0.3)',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents sx={{ color: '#00ff9d' }} />
          Tournament Registration
        </Box>
        <IconButton 
          onClick={handleClose}
          sx={{ color: '#888' }}
          disabled={activeStep >= RegistrationStep.REGISTERING}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Stepper */}
        <Box sx={{ mb: 3 }}>
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel
            sx={{
              '& .MuiStepLabel-root .Mui-completed': {
                color: '#00ff9d',
              },
              '& .MuiStepLabel-root .Mui-active': {
                color: '#00a8ff',
              },
              '& .MuiStepLabel-root .Mui-disabled': {
                color: '#888',
              },
              '& .MuiStepLabel-label': {
                color: '#ccc',
                fontWeight: 600,
                letterSpacing: '1px',
              },
              '& .MuiStepLabel-label.Mui-active': {
                color: '#00a8ff',
                textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
              },
              '& .MuiStepLabel-label.Mui-completed': {
                color: '#00ff9d',
                textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
              },
            }}
          >
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel 
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: index < activeStep ? 'rgba(0, 255, 157, 0.2)' : 
                                   index === activeStep ? 'rgba(0, 168, 255, 0.2)' : 'rgba(136, 136, 136, 0.2)',
                        border: `2px solid ${index < activeStep ? '#00ff9d' : 
                                           index === activeStep ? '#00a8ff' : '#888'}`,
                        color: index < activeStep ? '#00ff9d' : 
                               index === activeStep ? '#00a8ff' : '#888',
                        boxShadow: index === activeStep ? `0 0 15px ${index === activeStep ? '#00a8ff' : '#00ff9d'}` : 'none',
                      }}
                    >
                      {index < activeStep ? <CheckCircle /> : step.icon}
                    </Box>
                  )}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid #ff4444',
              color: '#ff4444',
              '& .MuiAlert-icon': { color: '#ff4444' }
            }}
          >
            {error}
          </Alert>
        )}

        {/* Step Content */}
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid rgba(0, 255, 157, 0.3)',
        gap: 2
      }}>
        {activeStep < RegistrationStep.REGISTERING && (
          <>
            <Button 
              onClick={handleClose}
              sx={{ 
                color: '#888',
                border: '1px solid #888',
                '&:hover': {
                  borderColor: '#ccc',
                  color: '#ccc',
                }
              }}
            >
              Cancel
            </Button>
            
            <Box sx={{ flex: 1 }} />
            
            {activeStep > RegistrationStep.CONFIRM_DETAILS && (
              <Button 
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{ 
                  color: '#00a8ff',
                  border: '1px solid #00a8ff',
                  '&:hover': {
                    background: 'rgba(0, 168, 255, 0.1)',
                  }
                }}
              >
                Back
              </Button>
            )}
            
            <Button 
              onClick={handleNext}
              disabled={loading || (activeStep === RegistrationStep.CONFIRM_RULES && (!acceptedRules || !acceptedTerms))}
              endIcon={activeStep === RegistrationStep.PAYMENT ? <Payment /> : <ArrowForward />}
              sx={cyberButtonStyle}
            >
              {activeStep === RegistrationStep.PAYMENT ? 'Complete Payment' : 'Next'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TournamentRegistration; 