import { Box, Paper, Skeleton, Typography } from '@mui/material';
import { SvgIconProps } from '@mui/material/SvgIcon';
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
  const getColorValue = (colorName: string) => {
    switch (colorName) {
      case 'success':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      case 'info':
        return 'info.main';
      case 'secondary':
        return 'secondary.main';
      default:
        return 'primary.main';
    }
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
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
    <Paper elevation={2} sx={{ p: 3, height: '100%' }} data-testid={testId}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {Icon && (
          <Icon
            sx={{
              fontSize: 40,
              color: getColorValue(color),
              mr: 1,
            }}
          />
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          {trend && (
            <Typography
              variant="body2"
              color={trend.isPositive ? 'success.main' : 'error.main'}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {trend.isPositive ? '↗' : '↘'} {trend.value}% {trend.label}
            </Typography>
          )}
        </Box>
      </Box>

      <Typography variant="h3" color={getColorValue(color)} gutterBottom>
        {value}
      </Typography>

      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export default StatCard;
