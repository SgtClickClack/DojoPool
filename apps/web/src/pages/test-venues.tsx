import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';

const TestVenuesPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Test Venues Page
          </Typography>

          <Typography variant="body1" paragraph>
            This is a simple test page to verify routing works
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Page Status
            </Typography>
            <Typography variant="body1" color="success.main">
              ✅ Page loads successfully
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default TestVenuesPage;


