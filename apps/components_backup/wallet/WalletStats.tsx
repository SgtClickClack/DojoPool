import React from 'react';
import { Grid, Paper, Typography, Box, useTheme } from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  SwapHoriz,
} from '@mui/icons-material';
import { formatCurrency, formatNumber } from '../../utils/format';
import type { WalletStats as WalletStatsType } from '../../types/wallet';

interface WalletStatsProps {
  stats: WalletStatsType | null;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subValue, icon, color }) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: `${color}15`,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" component="h2" color="textSecondary">
          {title}
        </Typography>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography variant="h4" component="p" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
      {subValue && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {subValue}
        </Typography>
      )}
    </Paper>
  );
};

export const WalletStatsDisplay: React.FC<WalletStatsProps> = ({ stats }) => {
  const theme = useTheme();

  if (!stats) {
    return null;
  }

  const totalRewards = stats.rewards
    ? Object.values(stats.rewards).reduce(
        (acc, reward) => acc + reward.total_amount,
        0
      )
    : 0;
  const rewardCount = stats.rewards
    ? Object.values(stats.rewards).reduce(
        (acc, reward) => acc + reward.count,
        0
      )
    : 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <StatCard
          title="Total Volume"
          value={formatCurrency(stats?.total_volume ?? 0, 'DP')}
          subValue={`${formatNumber(stats?.total_transactions ?? 0)} transactions`}
          icon={<SwapHoriz sx={{ color: 'white' }} />}
          color={theme.palette.primary.main}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <StatCard
          title="Total Rewards"
          value={formatCurrency(totalRewards, 'DP')}
          subValue={`${rewardCount} rewards earned`}
          icon={<AccountBalance sx={{ color: 'white' }} />}
          color={theme.palette.success.main}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <StatCard
          title="Total Received"
          value={formatCurrency(stats?.total_incoming ?? 0, 'DP')}
          icon={<TrendingUp sx={{ color: 'white' }} />}
          color={theme.palette.info.main}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <StatCard
          title="Total Sent"
          value={formatCurrency(stats?.total_outgoing ?? 0, 'DP')}
          icon={<TrendingDown sx={{ color: 'white' }} />}
          color={theme.palette.error.main}
        />
      </Grid>
    </Grid>
  );
};
