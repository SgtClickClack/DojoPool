import { TrendingDown, TrendingFlat, TrendingUp } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

interface FunnelStep {
  id: string;
  name: string;
  count: number;
  percentage: number;
  change?: number;
  color: string;
}

interface UserJourneyFunnelProps {
  steps: FunnelStep[];
  title?: string;
}

export const UserJourneyFunnel: React.FC<UserJourneyFunnelProps> = ({
  steps,
  title = 'User Journey Funnel',
}) => {
  const theme = useTheme();

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    if (change > 0)
      return <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />;
    if (change < 0)
      return <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />;
    return <TrendingFlat sx={{ fontSize: 16, color: 'text.secondary' }} />;
  };

  const getChangeColor = (change?: number) => {
    if (!change) return 'text.secondary';
    if (change > 0) return 'success.main';
    if (change < 0) return 'error.main';
    return 'text.secondary';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        <Box sx={{ mt: 3 }}>
          {steps.map((step, index) => (
            <Box key={step.id} sx={{ mb: index < steps.length - 1 ? 2 : 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  {step.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {step.count.toLocaleString()} ({step.percentage.toFixed(1)}
                    %)
                  </Typography>
                  {step.change !== undefined && (
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {getChangeIcon(step.change)}
                      <Typography
                        variant="caption"
                        sx={{ color: getChangeColor(step.change) }}
                      >
                        {step.change > 0 ? '+' : ''}
                        {step.change.toFixed(1)}%
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ position: 'relative' }}>
                <LinearProgress
                  variant="determinate"
                  value={step.percentage}
                  sx={{
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: step.color,
                      borderRadius: 12,
                    },
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.getContrastText(step.color),
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {step.percentage.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: theme.palette.grey[50],
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            💡 Insights:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • {steps[0]?.percentage.toFixed(1)}% of visitors complete
            registration • {steps[1]?.percentage.toFixed(1)}% finish onboarding
            • {steps[2]?.percentage.toFixed(1)}% play their first game •{' '}
            {steps[steps.length - 1]?.percentage.toFixed(1)}% become returning
            users
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
