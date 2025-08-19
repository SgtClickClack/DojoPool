import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { EnhancedVenueManagementPanel } from '../src/components/venue/EnhancedVenueManagementPanel';

const VenueManagementPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Venue Management Portal
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Comprehensive venue management system with real-time monitoring,
          analytics, tournament scheduling, revenue optimization, and
          performance metrics.
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          <EnhancedVenueManagementPanel />
        </Paper>
      </Box>
    </Container>
  );
};

export default VenueManagementPage;
