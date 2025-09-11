import { EmojiEvents, Group, LocationOn, Pool } from '@mui/icons-material';
import { Box, Button, Typography, useTheme } from '@mui/material';
import React from 'react';

interface WelcomeStepProps {
  onComplete: (data?: any) => void;
  onboardingData: any;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onComplete }) => {
  const theme = useTheme();

  const features = [
    {
      icon: <Pool sx={{ fontSize: 32, color: theme.palette.primary.main }} />,
      title: 'Real Pool Gaming',
      description:
        'Play actual games of pool at local venues and track your progress digitally',
    },
    {
      icon: (
        <EmojiEvents
          sx={{ fontSize: 32, color: theme.palette.secondary.main }}
        />
      ),
      title: 'Competitive Rankings',
      description:
        'Climb the global leaderboard and compete for territory control',
    },
    {
      icon: <Group sx={{ fontSize: 32, color: theme.palette.success.main }} />,
      title: 'Social Experience',
      description: 'Join clans, make friends, and participate in tournaments',
    },
    {
      icon: (
        <LocationOn sx={{ fontSize: 32, color: theme.palette.warning.main }} />
      ),
      title: 'Venue Discovery',
      description: 'Find nearby pool venues and discover new places to play',
    },
  ];

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
        Welcome to DojoPool! 🎱
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        The ultimate hybrid gaming experience that combines real-world pool with
        digital strategy
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 3,
          mb: 4,
        }}
      >
        {features.map((feature, index) => (
          <Box
            key={index}
            sx={{
              p: 3,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-4px)',
              },
            }}
          >
            <Box sx={{ mb: 2 }}>{feature.icon}</Box>
            <Typography variant="h6" gutterBottom>
              {feature.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {feature.description}
            </Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="body1" sx={{ mb: 4, fontStyle: 'italic' }}>
        "In the world of pool, every shot is a story, every game is a battle,
        and every victory is legendary."
      </Typography>

      <Button
        variant="contained"
        size="large"
        onClick={() => onComplete()}
        sx={{
          px: 6,
          py: 1.5,
          fontSize: '1.1rem',
          borderRadius: 3,
        }}
      >
        Let's Get Started! 🚀
      </Button>
    </Box>
  );
};
