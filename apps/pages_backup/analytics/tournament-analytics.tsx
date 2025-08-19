import React from 'react';
import { Box } from '@mui/material';
import PageBackground from '../../components/common/PageBackground';
import TournamentAnalytics from '../../components/analytics/TournamentAnalytics';

const TournamentAnalyticsPage: React.FC = () => {
  return (
    <PageBackground variant="analytics">
      <Box sx={{ minHeight: '100vh', py: 2 }}>
        <TournamentAnalytics />
      </Box>
    </PageBackground>
  );
};

export default TournamentAnalyticsPage;
