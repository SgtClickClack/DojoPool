import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import VenueSpecials from '../../components/venue/VenueSpecials';
import PageBackground from '../../components/common/PageBackground';

const VenueSpecialsPage: React.FC = () => {
  return (
    <PageBackground variant="venue">
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Venue Specials Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage promotions, happy hours, and special offers for your venue
          </Typography>
        </Box>
        <VenueSpecials />
      </Container>
    </PageBackground>
  );
};

export default VenueSpecialsPage;
