import { Box, Paper, Skeleton, Typography } from '@mui/material';
import { SvgIconProps } from '@mui/material/SvgIcon';
import { useTheme } from '@mui/material/styles';
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<SvgIconProps>;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
  testId?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  loading = false,
  testId,
  trend,
}) => {
  const theme = useTheme();

  const getColorValue = (colorName: string) => {
    switch (colorName) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      case 'secondary':
        return theme.palette.secondary.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getBorderColor = (colorName: string) => {
    switch (colorName) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      case 'secondary':
        return theme.palette.secondary.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getGlowEffect = (colorName: string) => {
    const color = getColorValue(colorName);
    return `0 0 15px ${color}30`;
  };

  if (loading) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          height: '100%',
          background: theme.cyberpunk.gradients.card,
          border: `1px solid ${theme.palette.primary.main}30`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {Icon && (
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ mr: 1 }}
            />
          )}
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
        </Box>
        <Skeleton variant="text" width="80%" height={32} />
        {subtitle && <Skeleton variant="text" width="70%" height={20} />}
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        background: theme.cyberpunk.gradients.card,
        border: `1px solid ${getBorderColor(color)}`,
        borderRadius: 2,
        boxShadow: getGlowEffect(color),
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${getColorValue(color)}40`,
          border: `1px solid ${getColorValue(color)}`,
        },
      }}
      data-testid={testId}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {Icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: '50%',
              backgroundColor: `${getColorValue(color)}20`,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              sx={{
                fontSize: 32,
                color: getColorValue(color),
              }}
            />
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
          >
            {title}
          </Typography>
          {trend && (
            <Typography
              variant="body2"
              sx={{
                color: trend.isPositive
                  ? theme.palette.success.main
                  : theme.palette.error.main,
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500,
              }}
            >
              {trend.isPositive ? '↗' : '↘'} {trend.value}% {trend.label}
            </Typography>
          )}
        </Box>
      </Box>

      <Typography
        variant="h3"
        sx={{
          color: getColorValue(color),
          fontWeight: 'bold',
          mb: subtitle ? 1 : 0,
          textShadow: `0 0 10px ${getColorValue(color)}50`,
        }}
        gutterBottom
      >
        {value}
      </Typography>

      {subtitle && (
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
        >
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export default StatCard;
