import { EmojiEvents, Group, Map, QrCodeScanner } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

interface FirstActionStepProps {
  onComplete: (data?: any) => void;
  onboardingData: any;
}

const FIRST_ACTIONS = [
  {
    id: 'scan-qr',
    icon: <QrCodeScanner sx={{ fontSize: 48 }} />,
    title: 'Visit a Venue',
    description:
      'Scan a QR code at a local pool venue to start your first game',
    action: 'Start Playing',
    color: 'primary',
  },
  {
    id: 'explore-map',
    icon: <Map sx={{ fontSize: 48 }} />,
    title: 'Explore the Map',
    description: "Discover venues and see what's happening in your area",
    action: 'View Map',
    color: 'secondary',
  },
  {
    id: 'join-tournament',
    icon: <EmojiEvents sx={{ fontSize: 48 }} />,
    title: 'Join a Tournament',
    description: 'Test your skills in a competitive tournament',
    action: 'Browse Tournaments',
    color: 'warning',
  },
  {
    id: 'find-players',
    icon: <Group sx={{ fontSize: 48 }} />,
    title: 'Find Players',
    description: 'Connect with other players and make new friends',
    action: 'Find Players',
    color: 'success',
  },
];

export const FirstActionStep: React.FC<FirstActionStepProps> = ({
  onComplete,
}) => {
  const theme = useTheme();

  const handleActionSelect = (actionId: string) => {
    // Track the selected first action
    const action = FIRST_ACTIONS.find((a) => a.id === actionId);

    // Complete onboarding with first action preference
    onComplete({
      firstAction: actionId,
      firstActionTitle: action?.title,
    });
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        You're all set! 🎉
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        What would you like to do first?
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 3,
          mb: 4,
        }}
      >
        {FIRST_ACTIONS.map((action) => (
          <Card
            key={action.id}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: theme.shadows[8],
                transform: 'translateY(-4px)',
              },
            }}
            onClick={() => handleActionSelect(action.id)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box
                sx={{
                  color:
                    theme.palette[action.color as keyof typeof theme.palette]
                      .main,
                  mb: 2,
                }}
              >
                {action.icon}
              </Box>

              <Typography variant="h6" gutterBottom>
                {action.title}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {action.description}
              </Typography>

              <Button variant="contained" color={action.color as any} fullWidth>
                {action.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic' }}>
        "Every journey begins with a single shot. Make yours count."
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Don't worry, you can always change your mind and explore other features
        later!
      </Typography>
    </Box>
  );
};
