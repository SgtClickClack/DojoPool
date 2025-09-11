import { useAuth } from '@/hooks/useAuth';
import {
  Star as StarIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

interface BattlePassWidgetProps {
  compact?: boolean;
}

const BattlePassWidget: React.FC<BattlePassWidgetProps> = ({
  compact = false,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [currentTier, setCurrentTier] = useState(1);
  const [isPremium, setIsPremium] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('12d 4h');

  // Mock data - replace with actual API call
  useEffect(() => {
    // Simulate battle pass progress
    setProgress(65);
    setCurrentTier(3);
    setIsPremium(false);
    setTimeRemaining('12d 4h');
  }, []);

  if (compact) {
    return (
      <Card
        sx={{
          background: isPremium
            ? theme.cyberpunk.battlePass.premium.background
            : theme.cyberpunk.gradients.card,
          border: isPremium
            ? theme.cyberpunk.battlePass.premium.border
            : theme.cyberpunk.battlePass.free.border,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.cyberpunk.shadows.elevated,
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Battle Pass
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {isPremium && (
                <StarIcon
                  sx={{
                    color: theme.cyberpunk.battlePass.tier.premium,
                    fontSize: 16,
                  }}
                />
              )}
              <TimerIcon
                sx={{ color: theme.palette.warning.main, fontSize: 16 }}
              />
              <Typography
                variant="caption"
                sx={{ color: theme.palette.warning.main }}
              >
                {timeRemaining}
              </Typography>
            </Box>
          </Box>

          <Box mb={1}>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.primary }}
            >
              Tier {currentTier}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: theme.cyberpunk.battlePass.progress.background,
              '& .MuiLinearProgress-bar': {
                background: theme.cyberpunk.battlePass.progress.fill,
                borderRadius: 3,
              },
            }}
          />

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={1}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              {progress}% Complete
            </Typography>
            <Button
              component={Link}
              href="/battle-pass"
              size="small"
              sx={{
                minWidth: 'auto',
                px: 1,
                py: 0.5,
                fontSize: '0.75rem',
              }}
            >
              View
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        background: isPremium
          ? theme.cyberpunk.battlePass.premium.background
          : theme.cyberpunk.gradients.card,
        border: isPremium
          ? theme.cyberpunk.battlePass.premium.border
          : theme.cyberpunk.battlePass.free.border,
        boxShadow: isPremium
          ? theme.cyberpunk.battlePass.premium.glow
          : theme.cyberpunk.shadows.card,
      }}
    >
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <TrophyIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
              Seasonal Battle Pass
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {isPremium && (
              <StarIcon
                sx={{ color: theme.cyberpunk.battlePass.tier.premium }}
              />
            )}
            <TimerIcon
              sx={{ color: theme.palette.warning.main, fontSize: 16 }}
            />
            <Typography
              variant="body2"
              sx={{ color: theme.palette.warning.main }}
            >
              {timeRemaining}
            </Typography>
          </Box>
        </Box>

        <Box mb={3}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Current Progress
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.primary.main }}
            >
              Tier {currentTier}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: theme.cyberpunk.battlePass.progress.background,
              '& .MuiLinearProgress-bar': {
                background: theme.cyberpunk.battlePass.progress.fill,
                borderRadius: 5,
              },
            }}
          />
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={1}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              {progress}% to next tier
            </Typography>
            {!isPremium && (
              <Typography
                variant="caption"
                sx={{ color: theme.palette.warning.main }}
              >
                Upgrade for premium rewards!
              </Typography>
            )}
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            component={Link}
            href="/battle-pass"
            variant="contained"
            fullWidth
            sx={{
              background: isPremium
                ? theme.cyberpunk.battlePass.premium.primary
                : theme.palette.primary.main,
              '&:hover': {
                background: isPremium
                  ? theme.cyberpunk.battlePass.premium.secondary
                  : theme.palette.primary.dark,
              },
            }}
          >
            View Battle Pass
          </Button>
          {!isPremium && (
            <Button
              variant="outlined"
              sx={{
                borderColor: theme.cyberpunk.battlePass.premium.primary,
                color: theme.cyberpunk.battlePass.premium.primary,
                '&:hover': {
                  borderColor: theme.cyberpunk.battlePass.premium.secondary,
                  backgroundColor:
                    theme.cyberpunk.battlePass.premium.primary + '20',
                },
              }}
            >
              <StarIcon sx={{ mr: 1, fontSize: 16 }} />
              Upgrade
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default BattlePassWidget;
