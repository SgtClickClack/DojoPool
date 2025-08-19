import { Box, Container, Typography } from '@mui/material';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Mock tournament components for development
const TournamentList: React.FC = () => (
  <Container>
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ color: '#00a8ff', mb: 2 }}>
        Tournament List Component - Coming Soon
      </Typography>
    </Box>
  </Container>
);

const TournamentDetail: React.FC = () => (
  <Container>
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ color: '#00a8ff', mb: 2 }}>
        Tournament Detail Component - Coming Soon
      </Typography>
    </Box>
  </Container>
);

const TournamentForm: React.FC = () => (
  <Container>
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ color: '#00a8ff', mb: 2 }}>
        Tournament Form Component - Coming Soon
      </Typography>
    </Box>
  </Container>
);

const PrivateRoute: React.FC<{
  adminOnly?: boolean;
  children: React.ReactNode;
}> = ({ children }) => {
  return <>{children}</>;
};

const TournamentRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<TournamentList />} />
      <Route path="/:id" element={<TournamentDetail />} />
      <Route
        path="/create"
        element={
          <PrivateRoute adminOnly>
            <TournamentForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/:id/edit"
        element={
          <PrivateRoute adminOnly>
            <TournamentForm />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default TournamentRoutes;
