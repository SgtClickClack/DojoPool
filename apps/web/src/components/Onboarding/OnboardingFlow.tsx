import { analyticsService } from '@/services/analyticsService';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  LinearProgress,
  MobileStepper,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { FirstActionStep } from './steps/FirstActionStep';
import { GoalStep } from './steps/GoalStep';
import { ProfileSetupStep } from './steps/ProfileSetupStep';
import { VenueDiscoveryStep } from './steps/VenueDiscoveryStep';
import { WelcomeStep } from './steps/WelcomeStep';

interface OnboardingStep {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  required?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DojoPool',
    component: WelcomeStep,
  },
  {
    id: 'goals',
    title: 'What brings you here?',
    component: GoalStep,
  },
  {
    id: 'profile',
    title: 'Set up your profile',
    component: ProfileSetupStep,
  },
  {
    id: 'venues',
    title: 'Find nearby venues',
    component: VenueDiscoveryStep,
  },
  {
    id: 'first-action',
    title: 'Ready to start playing!',
    component: FirstActionStep,
  },
];

interface OnboardingData {
  goals: string[];
  preferredVenues: string[];
  skillLevel: string;
  playFrequency: string;
}

export const OnboardingFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    goals: [],
    preferredVenues: [],
    skillLevel: '',
    playFrequency: '',
  });
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const theme = useTheme();
  const router = useRouter();

  const maxSteps = ONBOARDING_STEPS.length;
  const isLastStep = activeStep === maxSteps - 1;
  const isFirstStep = activeStep === 0;

  useEffect(() => {
    // Track onboarding start
    analyticsService.trackEvent('onboarding_started', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    });
  }, []);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to completed steps or next step
    if (stepIndex <= activeStep || completedSteps.has(stepIndex)) {
      setActiveStep(stepIndex);
    }
  };

  const handleStepComplete = (stepData?: any) => {
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(activeStep);
    setCompletedSteps(newCompletedSteps);

    if (stepData) {
      setOnboardingData((prev) => ({ ...prev, ...stepData }));
    }

    // Track step completion
    analyticsService.trackEvent('onboarding_step_completed', {
      step: ONBOARDING_STEPS[activeStep].id,
      stepIndex: activeStep,
      stepData,
      timestamp: new Date().toISOString(),
    });

    handleNext();
  };

  const handleComplete = async () => {
    try {
      // Track onboarding completion
      analyticsService.trackEvent('onboarding_completed', {
        totalSteps: maxSteps,
        completedSteps: Array.from(completedSteps).length,
        onboardingData,
        timestamp: new Date().toISOString(),
      });

      // Mark user as onboarded
      localStorage.setItem('onboarding_completed', 'true');

      // Redirect to main app
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleSkip = () => {
    // Track onboarding skip
    analyticsService.trackEvent('onboarding_skipped', {
      step: ONBOARDING_STEPS[activeStep].id,
      stepIndex: activeStep,
      timestamp: new Date().toISOString(),
    });

    // Mark as completed and redirect
    localStorage.setItem('onboarding_completed', 'true');
    router.push('/dashboard');
  };

  const CurrentStepComponent = ONBOARDING_STEPS[activeStep].component;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Header with Progress */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h4" component="h1">
              {ONBOARDING_STEPS[activeStep].title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Step {activeStep + 1} of {maxSteps}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={(activeStep / (maxSteps - 1)) * 100}
            sx={{ mb: 2 }}
          />

          {/* Step Indicators */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {ONBOARDING_STEPS.map((step, index) => (
              <Box
                key={step.id}
                sx={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    index < activeStep || completedSteps.has(index)
                      ? theme.palette.primary.main
                      : index === activeStep
                        ? theme.palette.primary.light
                        : theme.palette.grey[300],
                  cursor:
                    index <= activeStep || completedSteps.has(index)
                      ? 'pointer'
                      : 'not-allowed',
                  transition: 'background-color 0.3s ease',
                }}
                onClick={() => handleStepClick(index)}
              />
            ))}
          </Box>
        </Paper>

        {/* Step Content */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <CurrentStepComponent
              onComplete={handleStepComplete}
              onboardingData={onboardingData}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <MobileStepper
          variant="dots"
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{
            mt: 3,
            backgroundColor: 'transparent',
            '& .MuiMobileStepper-dot': {
              backgroundColor: theme.palette.grey[300],
            },
            '& .MuiMobileStepper-dotActive': {
              backgroundColor: theme.palette.primary.main,
            },
          }}
          nextButton={
            <Button
              size="small"
              onClick={handleNext}
              disabled={isLastStep}
              endIcon={<KeyboardArrowRight />}
            >
              {isLastStep ? 'Finish' : 'Next'}
            </Button>
          }
          backButton={
            <Button
              size="small"
              onClick={handleBack}
              disabled={isFirstStep}
              startIcon={<KeyboardArrowLeft />}
            >
              Back
            </Button>
          }
        />

        {/* Skip Option */}
        {!isLastStep && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="text"
              color="inherit"
              onClick={handleSkip}
              sx={{ fontSize: '0.875rem' }}
            >
              Skip onboarding
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};
