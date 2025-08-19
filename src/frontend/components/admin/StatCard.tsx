import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 2 }}>
    <Box display="flex" alignItems="center" gap={2}>
      <Box
        sx={{
          backgroundColor: `${color}20`,
          borderRadius: '50%',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ color }}>
          {icon}
        </Box>
      </Box>
      <Box>
        <Typography color="textSecondary" variant="body2">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ color }}>
          {value}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

export default StatCard;
