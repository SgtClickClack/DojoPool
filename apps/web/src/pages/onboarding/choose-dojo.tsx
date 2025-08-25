import {
  CheckCircle,
  LocationOn,
  Schedule,
  Warning,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

interface DojoCandidate {
  id: string;
  name: string;
  address: string;
  distance: number;
  status: 'verified' | 'unconfirmed' | 'pending_verification';
  photo: string;
  latitude: number;
  longitude: number;
}

// Mock data for development
const MOCK_DOJOS: DojoCandidate[] = [
  {
    id: '1',
    name: 'The Empire Hotel',
    address: '339 Brunswick St, Fortitude Valley QLD 4006',
    distance: 120,
    status: 'verified',
    photo: '/images/empire-hotel.jpg',
    latitude: -27.4568,
    longitude: 153.0364,
  },
  {
    id: '2',
    name: 'The Wickham',
    address: '308 Wickham St, Fortitude Valley QLD 4006',
    distance: 300,
    status: 'unconfirmed',
    photo: '/images/wickham.jpg',
    latitude: -27.4589,
    longitude: 153.0345,
  },
  {
    id: '3',
    name: 'The Brightside',
    address: '27 Warner St, Fortitude Valley QLD 4006',
    distance: 450,
    status: 'pending_verification',
    photo: '/images/brightside.jpg',
    latitude: -27.4601,
    longitude: 153.0321,
  },
];

const ChooseDojoScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedDojo, setSelectedDojo] = useState<DojoCandidate | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleDojoSelect = (dojo: DojoCandidate) => {
    setSelectedDojo(dojo);
  };

  const handleContinue = () => {
    if (selectedDojo) {
      router.push('/onboarding/complete');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle color="success" />;
      case 'unconfirmed':
        return <Warning color="warning" />;
      case 'pending_verification':
        return <Schedule color="info" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'unconfirmed':
        return 'warning';
      case 'pending_verification':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Choose Your Dojo - DojoPool</title>
      </Head>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" gutterBottom>
            Choose Your Dojo
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Select a pool hall to start your journey
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {MOCK_DOJOS.map((dojo) => (
            <Grid item xs={12} md={4} key={dojo.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border:
                    selectedDojo?.id === dojo.id
                      ? '2px solid #1976d2'
                      : '1px solid #e0e0e0',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleDojoSelect(dojo)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={dojo.photo}
                  alt={dojo.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="h6" component="div">
                      {dojo.name}
                    </Typography>
                    {getStatusIcon(dojo.status)}
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    <LocationOn
                      fontSize="small"
                      sx={{ mr: 0.5, verticalAlign: 'middle' }}
                    />
                    {dojo.address}
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2" color="text.secondary">
                      {dojo.distance}m away
                    </Typography>
                    <Chip
                      label={dojo.status.replace('_', ' ')}
                      color={getStatusColor(dojo.status) as any}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedDojo && (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" gutterBottom>
              Selected: {selectedDojo.name}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              sx={{ mt: 2 }}
            >
              Continue with {selectedDojo.name}
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
};

export default ChooseDojoScreen;
