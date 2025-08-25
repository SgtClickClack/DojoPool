import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'indigo' | 'red';
}

const colorMap = {
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  yellow: '#F59E0B',
  indigo: '#6366F1',
  red: '#EF4444',
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 3, height: '100%' }}>
    <Box display="flex" alignItems="center" gap={2}>
      <Box
        sx={{
          backgroundColor: `${colorMap[color]}20`,
          borderRadius: '50%',
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography color="textSecondary" variant="body2" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{ color: colorMap[color], fontWeight: 'bold' }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

export default StatCard;
