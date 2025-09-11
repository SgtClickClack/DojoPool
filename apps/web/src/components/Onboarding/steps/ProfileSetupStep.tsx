import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface ProfileSetupStepProps {
  onComplete: (data: any) => void;
  onboardingData: any;
}

const SKILL_LEVELS = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'New to pool or just starting out',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Have some experience and know the basics',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Experienced player with good skills',
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'Highly skilled, competitive player',
  },
];

const PLAY_FREQUENCIES = [
  { value: 'daily', label: 'Daily', description: 'Play almost every day' },
  { value: 'weekly', label: 'Weekly', description: 'A few times per week' },
  { value: 'monthly', label: 'Monthly', description: 'Once a month or so' },
  {
    value: 'occasional',
    label: 'Occasionally',
    description: 'Whenever I get the chance',
  },
];

export const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({
  onComplete,
  onboardingData,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [skillLevel, setSkillLevel] = useState(onboardingData.skillLevel || '');
  const [playFrequency, setPlayFrequency] = useState(
    onboardingData.playFrequency || ''
  );

  const handleContinue = () => {
    if (displayName.trim() && skillLevel && playFrequency) {
      onComplete({
        displayName: displayName.trim(),
        skillLevel,
        playFrequency,
      });
    }
  };

  const isFormValid = displayName.trim() && skillLevel && playFrequency;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom align="center">
        Let's set up your profile
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4, textAlign: 'center' }}
      >
        This helps us personalize your experience and match you with appropriate
        opponents
      </Typography>

      {/* Display Name */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How others will see you"
          helperText="This will be your public name in the game"
          sx={{ mb: 2 }}
        />
      </Box>

      {/* Skill Level */}
      <Box sx={{ mb: 4 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
            What's your skill level?
          </FormLabel>
          <RadioGroup
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
          >
            {SKILL_LEVELS.map((level) => (
              <FormControlLabel
                key={level.value}
                value={level.value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {level.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {level.description}
                    </Typography>
                  </Box>
                }
                sx={{
                  mb: 1,
                  alignItems: 'flex-start',
                  '& .MuiFormControlLabel-label': {
                    paddingTop: 1,
                  },
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Play Frequency */}
      <Box sx={{ mb: 4 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
            How often do you play pool?
          </FormLabel>
          <RadioGroup
            value={playFrequency}
            onChange={(e) => setPlayFrequency(e.target.value)}
          >
            {PLAY_FREQUENCIES.map((freq) => (
              <FormControlLabel
                key={freq.value}
                value={freq.value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {freq.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {freq.description}
                    </Typography>
                  </Box>
                }
                sx={{
                  mb: 1,
                  alignItems: 'flex-start',
                  '& .MuiFormControlLabel-label': {
                    paddingTop: 1,
                  },
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>

      <Button
        variant="contained"
        size="large"
        onClick={handleContinue}
        disabled={!isFormValid}
        fullWidth
        sx={{
          py: 1.5,
          fontSize: '1.1rem',
          borderRadius: 3,
        }}
      >
        Continue
      </Button>

      {!isFormValid && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, textAlign: 'center' }}
        >
          Please fill in all fields to continue
        </Typography>
      )}
    </Box>
  );
};
