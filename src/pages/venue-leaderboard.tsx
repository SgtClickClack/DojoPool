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
import { type NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { Layout } from '../components/Layout/[UI]Layout';

const VenueLeaderboardPage: NextPage = () => {
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();

  return (
    <>
      <Head>
        <title>Venue Leaderboard - DojoPool</title>
        <meta
          name="description"
          content="Track venue performance and Dojo Masters across the DojoPool network"
        />
      </Head>

      <Layout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ color: '#00ff9d', fontWeight: 'bold', textAlign: 'center' }}
          >
            Venue Leaderboard
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{ textAlign: 'center', mb: 4 }}
          >
            Track venue performance and Dojo Masters across the DojoPool network
          </Typography>

          {/* Venue Leaderboard Dashboard - Coming Soon */}
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Top Venues
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Venue performance rankings and metrics
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Chip label="Active Venues: 12" color="success" />
                      <Chip label="Total Players: 1,247" color="primary" />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Dojo Masters
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Top players and their achievements
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Chip label="Masters: 8" color="info" />
                      <Chip label="Champions: 15" color="warning" />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Layout>
    </>
  );
};

export default VenueLeaderboardPage;
