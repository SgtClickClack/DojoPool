import React from 'react';
import Link from 'next/link';
import { Button, Box, Typography, Container } from '@mui/material';

const HomePage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Dojo Pool
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: '32rem', mb: 4 }}
        >
          Challenge rivals, claim territories, and rise through the ranks in the
          hybrid world of Dojo Pool. E2E tests are now unblocked and ready to
          run against a live homepage.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link href="/territory-gameplay" passHref>
            <Button variant="contained" size="large" data-testid="map-tab">
              Territory Gameplay
            </Button>
          </Link>
          <Link href="/dashboard" passHref>
            <Button variant="outlined" size="large">
              Dashboard
            </Button>
          </Link>
          <Link href="/clans" passHref>
            <Button variant="outlined" size="large">
              Clans
            </Button>
          </Link>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
