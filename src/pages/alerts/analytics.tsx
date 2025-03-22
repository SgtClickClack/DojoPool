import React from 'react';
import { AlertAnalyticsDashboard } from '../../components/alerts/AlertAnalyticsDashboard';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const AlertAnalyticsPage: React.FC = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AlertAnalyticsDashboard />
    </LocalizationProvider>
  );
};

export default AlertAnalyticsPage; 