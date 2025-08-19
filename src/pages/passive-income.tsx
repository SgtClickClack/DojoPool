import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';

const PassiveIncomePage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ color: '#00ff9d', fontWeight: 'bold' }}
        >
          Passive Income System
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage passive income generation for territory holders. Monitor
          DojoCoin rewards, venue activity bonuses, and clan-controlled
          territory benefits.
        </Typography>

        {/* Passive Income Dashboard - Coming Soon */}
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Territory Rewards
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitor DojoCoin generation from controlled territories
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Chip label="Active Territories: 3" color="success" />
                    <Chip label="Daily Rewards: 150 DC" color="primary" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Venue Bonuses
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track activity-based bonuses from venue partnerships
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Chip label="Partner Venues: 5" color="info" />
                    <Chip label="Monthly Bonus: 500 DC" color="warning" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default PassiveIncomePage;
