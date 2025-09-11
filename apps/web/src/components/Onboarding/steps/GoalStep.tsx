import {
  EmojiEvents,
  Group,
  PlayArrow,
  School,
  SportsBar,
} from '@mui/icons-material';
import { Box, Button, Chip, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';

interface GoalStepProps {
  onComplete: (data: any) => void;
  onboardingData: any;
}

const GOALS = [
  {
    id: 'social',
    icon: <Group sx={{ fontSize: 24 }} />,
    title: 'Social Gaming',
    description: 'Make friends and play with others',
    color: 'primary',
  },
  {
    id: 'competition',
    icon: <EmojiEvents sx={{ fontSize: 24 }} />,
    title: 'Competitive Play',
    description: 'Rank up and compete for glory',
    color: 'secondary',
  },
  {
    id: 'casual',
    icon: <PlayArrow sx={{ fontSize: 24 }} />,
    title: 'Casual Fun',
    description: 'Relax and enjoy the game',
    color: 'success',
  },
  {
    id: 'skill-building',
    icon: <School sx={{ fontSize: 24 }} />,
    title: 'Skill Development',
    description: 'Improve your pool game',
    color: 'warning',
  },
  {
    id: 'venue-discovery',
    icon: <SportsBar sx={{ fontSize: 24 }} />,
    title: 'Explore Venues',
    description: 'Find new places to play',
    color: 'info',
  },
];

export const GoalStep: React.FC<GoalStepProps> = ({
  onComplete,
  onboardingData,
}) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    onboardingData.goals || []
  );
  const theme = useTheme();

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleContinue = () => {
    if (selectedGoals.length > 0) {
      onComplete({ goals: selectedGoals });
    }
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        What brings you to DojoPool?
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Tell us about your goals so we can personalize your experience
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center',
          mb: 4,
        }}
      >
        {GOALS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          return (
            <Box
              key={goal.id}
              onClick={() => handleGoalToggle(goal.id)}
              sx={{
                p: 3,
                border: `2px solid ${isSelected ? theme.palette[goal.color as keyof typeof theme.palette].main : theme.palette.divider}`,
                borderRadius: 3,
                cursor: 'pointer',
                backgroundColor: isSelected
                  ? theme.palette[goal.color as keyof typeof theme.palette]
                      .light
                  : 'transparent',
                transition: 'all 0.3s ease',
                minWidth: 200,
                '&:hover': {
                  borderColor:
                    theme.palette[goal.color as keyof typeof theme.palette]
                      .main,
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Box
                sx={{
                  color: isSelected
                    ? theme.palette[goal.color as keyof typeof theme.palette]
                        .main
                    : 'inherit',
                  mb: 1,
                }}
              >
                {goal.icon}
              </Box>
              <Typography variant="h6" gutterBottom>
                {goal.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {goal.description}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {selectedGoals.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Your goals:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'center',
            }}
          >
            {selectedGoals.map((goalId) => {
              const goal = GOALS.find((g) => g.id === goalId);
              return goal ? (
                <Chip
                  key={goalId}
                  label={goal.title}
                  color={goal.color as any}
                  variant="outlined"
                  onDelete={() => handleGoalToggle(goalId)}
                />
              ) : null;
            })}
          </Box>
        </Box>
      )}

      <Button
        variant="contained"
        size="large"
        onClick={handleContinue}
        disabled={selectedGoals.length === 0}
        sx={{
          px: 6,
          py: 1.5,
          fontSize: '1.1rem',
          borderRadius: 3,
        }}
      >
        Continue with {selectedGoals.length} goal
        {selectedGoals.length !== 1 ? 's' : ''}
      </Button>

      {selectedGoals.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Please select at least one goal to continue
        </Typography>
      )}
    </Box>
  );
};
