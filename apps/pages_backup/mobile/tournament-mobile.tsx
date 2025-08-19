import React from 'react';
import { Box } from '@mui/material';
import PageBackground from '../../components/common/PageBackground';
import TournamentMobile from '../../components/mobile/TournamentMobile';

const TournamentMobilePage: React.FC = () => {
  return (
    <PageBackground variant="mobile">
      <Box sx={{ minHeight: '100vh', py: 2 }}>
        <TournamentMobile />
      </Box>
    </PageBackground>
  );
};

export default TournamentMobilePage;
