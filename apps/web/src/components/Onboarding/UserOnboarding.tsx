import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import { theme } from '../../styles/theme';

const OnboardingCard = styled(Card)(({ theme }) => ({
  background: theme.cyberpunk.gradients.card,
  border: theme.cyberpunk.borders.primary,
  borderRadius: '16px',
  boxShadow: theme.cyberpunk.shadows.glow,
  '&:hover': {
    boxShadow: theme.cyberpunk.shadows.elevated,
    transform: 'translateY(-2px)',
    transition: 'all 0.3s ease',
  },
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.cyberpunk.battlePass.progress.background,
  '& .MuiLinearProgress-bar': {
    background: theme.cyberpunk.battlePass.progress.fill,
    borderRadius: 4,
  },
}));

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
}

interface UserOnboardingProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const UserOnboarding: React.FC<UserOnboardingProps> = ({
  userId,
  onComplete,
  onSkip,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [userData, setUserData] = useState<any>({});

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to DojoPool',
      description:
        "Let's get you started on your journey to becoming a Pool God",
      component: WelcomeStep,
      completed: false,
      required: true,
    },
    {
      id: 'avatar',
      title: 'Create Your Avatar',
      description: 'Design your digital identity in the Dojo world',
      component: AvatarStep,
      completed: false,
      required: true,
    },
    {
      id: 'wallet',
      title: 'Connect Your Wallet',
      description: 'Link your crypto wallet to earn Dojo Coins',
      component: WalletStep,
      completed: false,
      required: true,
    },
    {
      id: 'preferences',
      title: 'Set Your Preferences',
      description: 'Customize your gaming experience',
      component: PreferencesStep,
      completed: false,
      required: false,
    },
    {
      id: 'tutorial',
      title: 'Quick Tutorial',
      description: 'Learn the basics of DojoPool gameplay',
      component: TutorialStep,
      completed: false,
      required: false,
    },
  ];

  const handleNext = () => {
    const currentStep = steps[activeStep];
    setCompletedSteps((prev) => new Set([...prev, currentStep.id]));

    if (activeStep === steps.length - 1) {
      onComplete();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    onSkip();
  };

  const getProgressPercentage = () => {
    return (completedSteps.size / steps.length) * 100;
  };

  const getCurrentStepComponent = () => {
    const currentStep = steps[activeStep];
    const StepComponent = currentStep.component;
    return (
      <StepComponent
        userData={userData}
        onDataChange={setUserData}
        onComplete={() => handleNext()}
      />
    );
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <OnboardingCard>
        <CardContent sx={{ p: 4 }}>
          {/* Progress Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 2, textAlign: 'center' }}>
              Welcome to DojoPool
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                Progress: {completedSteps.size}/{steps.length}
              </Typography>
              <ProgressBar
                variant="determinate"
                value={getProgressPercentage()}
                sx={{ flexGrow: 1 }}
              />
              <Typography variant="body2" sx={{ ml: 2 }}>
                {Math.round(getProgressPercentage())}%
              </Typography>
            </Box>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.id}>
                <StepLabel
                  optional={
                    !step.required && (
                      <Chip
                        label="Optional"
                        size="small"
                        sx={{
                          backgroundColor:
                            theme.cyberpunk.battlePass.tier.locked,
                          color: 'white',
                        }}
                      />
                    )
                  }
                >
                  <Typography variant="h6">{step.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {index === activeStep && getCurrentStepComponent()}
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* Navigation */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            <Box>
              <Button onClick={handleSkip} sx={{ mr: 2 }} color="secondary">
                Skip Tutorial
              </Button>
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={activeStep === steps.length - 1}
              >
                {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </OnboardingCard>
    </Box>
  );
};

// Step Components
const WelcomeStep: React.FC<any> = ({ onComplete }) => (
  <Box sx={{ p: 3 }}>
    <Typography variant="body1" sx={{ mb: 3 }}>
      Welcome to DojoPool, where traditional pool meets digital innovation!
      You're about to embark on an epic journey to become a legendary Pool God.
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, backgroundColor: theme.cyberpunk.background.paper }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            🎱 Real Pool Games
          </Typography>
          <Typography variant="body2">
            Play actual pool matches tracked by AI technology
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, backgroundColor: theme.cyberpunk.background.paper }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            🏆 Tournament System
          </Typography>
          <Typography variant="body2">
            Compete in tournaments and climb the leaderboards
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, backgroundColor: theme.cyberpunk.background.paper }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            🎮 Digital Avatars
          </Typography>
          <Typography variant="body2">
            Create and evolve your unique digital identity
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, backgroundColor: theme.cyberpunk.background.paper }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            💰 Dojo Coins
          </Typography>
          <Typography variant="body2">
            Earn cryptocurrency rewards for your victories
          </Typography>
        </Paper>
      </Grid>
    </Grid>
    <Button onClick={onComplete} variant="contained" sx={{ mt: 3 }} fullWidth>
      Let's Get Started!
    </Button>
  </Box>
);

const AvatarStep: React.FC<any> = ({ userData, onDataChange, onComplete }) => (
  <Box sx={{ p: 3 }}>
    <Typography variant="body1" sx={{ mb: 3 }}>
      Your avatar is your digital representation in the Dojo world. You can
      customize it and watch it evolve as you progress.
    </Typography>
    {/* Avatar creation component would go here */}
    <Button onClick={onComplete} variant="contained" sx={{ mt: 3 }} fullWidth>
      Create Avatar
    </Button>
  </Box>
);

const WalletStep: React.FC<any> = ({ onComplete }) => (
  <Box sx={{ p: 3 }}>
    <Typography variant="body1" sx={{ mb: 3 }}>
      Connect your crypto wallet to start earning Dojo Coins and participating
      in the DojoPool economy.
    </Typography>
    {/* Wallet connection component would go here */}
    <Button onClick={onComplete} variant="contained" sx={{ mt: 3 }} fullWidth>
      Connect Wallet
    </Button>
  </Box>
);

const PreferencesStep: React.FC<any> = ({ onComplete }) => (
  <Box sx={{ p: 3 }}>
    <Typography variant="body1" sx={{ mb: 3 }}>
      Customize your gaming experience with your preferred settings.
    </Typography>
    {/* Preferences component would go here */}
    <Button onClick={onComplete} variant="contained" sx={{ mt: 3 }} fullWidth>
      Save Preferences
    </Button>
  </Box>
);

const TutorialStep: React.FC<any> = ({ onComplete }) => (
  <Box sx={{ p: 3 }}>
    <Typography variant="body1" sx={{ mb: 3 }}>
      Let's walk through the basics of DojoPool gameplay.
    </Typography>
    {/* Tutorial component would go here */}
    <Button onClick={onComplete} variant="contained" sx={{ mt: 3 }} fullWidth>
      Complete Tutorial
    </Button>
  </Box>
);

export default UserOnboarding;
