import { Box, Container, Typography } from '@mui/material';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Mock venue components for development
const VenueList: React.FC = () => (
  <Container>
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ color: '#00a8ff', mb: 2 }}>
        Venue List Component - Coming Soon
      </Typography>
    </Box>
  </Container>
);

const VenueDetail: React.FC = () => (
  <Container>
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ color: '#00a8ff', mb: 2 }}>
        Venue Detail Component - Coming Soon
      </Typography>
    </Box>
  </Container>
);

const PrivateRoute: React.FC = () => {
  return <></>;
};

const VenueRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<VenueList />} />
      <Route path="/:id" element={<VenueDetail />} />
    </Routes>
  );
};

export default VenueRoutes;
