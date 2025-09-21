import React from 'react';
import { Box } from '@mui/material';
import PerformanceDashboard from '../components/Dashboard/PerformanceDashboard';

const PerformancePage: React.FC = () => {
  return (
    <Box>
      <PerformanceDashboard refreshInterval={5000} />
    </Box>
  );
};

export default PerformancePage;
