import { EmojiEvents, Group, LocationOn } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import WorldMapComponent from '../components/WorldMap/WorldMap';
import { useAuth } from '../hooks/useAuth';
import useUserLocation from '../hooks/useUserLocation';

const HomePage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h4">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  // Sample Dojo data with full details
  const sampleDojos = [
    {
      id: '1',
      name: 'Jade Tiger Dojo',
      description:
        'A legendary dojo in the heart of Brisbane, known for its peaceful atmosphere and skilled players. Perfect for beginners and advanced players alike.',
      location: {
        lat: -27.4698,
        lng: 153.0251,
        address: 'Brisbane CBD, QLD',
      },
      currentController: {
        name: 'JadeMaster',
        avatarUrl: undefined,
        level: 26,
      },
      memberCount: 45,
      maxCapacity: 60,
      status: 'occupied' as const,
      difficulty: 'intermediate' as const,
      specialFeatures: [
        'Tournament Venue',
        'Training Area',
        'Pro Shop',
        'Cafe',
      ],
    },
    {
      id: '2',
      name: 'Crimson Monkey Arena',
      description:
        'High-stakes competitive venue where only the best players dare to enter. Home of the fierce Crimson Monkey warriors.',
      location: {
        lat: -27.4705,
        lng: 153.026,
        address: 'South Bank, Brisbane, QLD',
      },
      currentController: {
        name: 'RyuKlaw',
        avatarUrl: undefined,
        level: 25,
      },
      memberCount: 38,
      maxCapacity: 50,
      status: 'at-war' as const,
      difficulty: 'expert' as const,
      specialFeatures: [
        'Championship Tables',
        'VIP Lounge',
        'Live Streaming',
        'Prize Pool',
      ],
    },
    {
      id: '3',
      name: 'Azure Dragon Temple',
      description:
        'Ancient dojo with mystical powers and advanced training techniques. Only accessible to players who have proven their worth.',
      location: {
        lat: -27.4712,
        lng: 153.027,
        address: 'West End, Brisbane, QLD',
      },
      currentController: {
        name: 'DragonLord',
        avatarUrl: undefined,
        level: 23,
      },
      memberCount: 25,
      maxCapacity: 40,
      status: 'occupied' as const,
      difficulty: 'advanced' as const,
      specialFeatures: [
        'Mystical Training',
        'Ancient Techniques',
        'Meditation Room',
        'Secret Chambers',
      ],
    },
    {
      id: '4',
      name: 'Golden Phoenix Pool Hall',
      description:
        'Rising star venue with modern amenities and a focus on community building. Great for new players looking to improve.',
      location: {
        lat: -27.472,
        lng: 153.028,
        address: 'Fortitude Valley, Brisbane, QLD',
      },
      currentController: undefined,
      memberCount: 15,
      maxCapacity: 35,
      status: 'available' as const,
      difficulty: 'beginner' as const,
      specialFeatures: [
        'Community Events',
        'Beginner Classes',
        'Social Lounge',
        'Food & Drinks',
      ],
    },
    {
      id: '5',
      name: 'Shadow Wolves Den',
      description:
        'Stealth-focused venue where players learn the art of surprise and strategy. Not for the faint of heart.',
      location: {
        lat: -27.4728,
        lng: 153.029,
        address: 'New Farm, Brisbane, QLD',
      },
      currentController: {
        name: 'ShadowAlpha',
        avatarUrl: undefined,
        level: 20,
      },
      memberCount: 22,
      maxCapacity: 30,
      status: 'occupied' as const,
      difficulty: 'advanced' as const,
      specialFeatures: [
        'Stealth Training',
        'Strategy Room',
        'Hidden Passages',
        'Tactical Maps',
      ],
    },
    {
      id: '6',
      name: 'Silver Serpent Sanctuary',
      description:
        'Mysterious venue known for its cunning strategies and ability to turn the tide of any battle.',
      location: {
        lat: -27.4735,
        lng: 153.03,
        address: 'Teneriffe, Brisbane, QLD',
      },
      currentController: {
        name: 'SerpentKing',
        avatarUrl: undefined,
        level: 21,
      },
      memberCount: 28,
      maxCapacity: 45,
      status: 'occupied' as const,
      difficulty: 'intermediate' as const,
      specialFeatures: [
        'Strategy Games',
        'Puzzle Rooms',
        'Mind Training',
        'Serpent Lore',
      ],
    },
    {
      id: '7',
      name: 'Sunset Coast Pool Club',
      description:
        'Relaxed beachside venue perfect for casual games and sunset matches. Popular with tourists and locals.',
      location: {
        lat: -26.65,
        lng: 153.0667,
        address: 'Sunshine Coast, QLD',
      },
      currentController: undefined,
      memberCount: 18,
      maxCapacity: 40,
      status: 'available' as const,
      difficulty: 'beginner' as const,
      specialFeatures: [
        'Beach Views',
        'Outdoor Tables',
        'Sunset Sessions',
        'Beach Access',
      ],
    },
    {
      id: '8',
      name: 'Gold Coast Elite Arena',
      description:
        'Luxury venue catering to high-rollers and professional players. Features premium tables and exclusive membership.',
      location: {
        lat: -28.0167,
        lng: 153.4,
        address: 'Gold Coast, QLD',
      },
      currentController: {
        name: 'EliteMaster',
        avatarUrl: undefined,
        level: 24,
      },
      memberCount: 35,
      maxCapacity: 50,
      status: 'occupied' as const,
      difficulty: 'expert' as const,
      specialFeatures: [
        'Premium Tables',
        'Exclusive Membership',
        'Luxury Lounge',
        'Professional Staff',
      ],
    },
    {
      id: '9',
      name: 'Cairns Tropical Dojo',
      description:
        'Northern territory venue with a tropical atmosphere and unique challenges. Home to some of the most creative players.',
      location: {
        lat: -16.9186,
        lng: 145.7781,
        address: 'Cairns, QLD',
      },
      currentController: {
        name: 'TropicalKing',
        avatarUrl: undefined,
        level: 19,
      },
      memberCount: 20,
      maxCapacity: 35,
      status: 'occupied' as const,
      difficulty: 'intermediate' as const,
      specialFeatures: [
        'Tropical Setting',
        'Creative Challenges',
        'Local Culture',
        'Adventure Tours',
      ],
    },
    {
      id: '10',
      name: 'Townsville Battle Grounds',
      description:
        'Fierce competitive venue where only the strongest survive. Known for intense battles and high stakes.',
      location: {
        lat: -19.259,
        lng: 146.8169,
        address: 'Townsville, QLD',
      },
      currentController: {
        name: 'BattleMaster',
        avatarUrl: undefined,
        level: 22,
      },
      memberCount: 30,
      maxCapacity: 45,
      status: 'at-war' as const,
      difficulty: 'advanced' as const,
      specialFeatures: [
        'Battle Arena',
        'War Room',
        'Victory Hall',
        'Trophy Display',
      ],
    },
  ];

  const WorldMapPage = () => {
    const [notification, setNotification] = useState<{
      open: boolean;
      message: string;
      severity: 'success' | 'error' | 'info';
    }>({
      open: false,
      message: '',
      severity: 'info',
    });

    const handleChallengeDojo = (dojoId: string) => {
      const dojo = sampleDojos.find((d) => d.id === dojoId);
      if (dojo) {
        setNotification({
          open: true,
          message: `Challenging ${dojo.name}! Prepare for battle...`,
          severity: 'success',
        });
      }
    };

    const handleViewDojo = (dojoId: string) => {
      const dojo = sampleDojos.find((d) => d.id === dojoId);
      if (dojo) {
        setNotification({
          open: true,
          message: `Viewing details for ${dojo.name}`,
          severity: 'info',
        });
      }
    };

    const handleLocationUpdate = (lat: number, lng: number) => {
      setNotification({
        open: true,
        message: `Location updated to ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        severity: 'info',
      });
    };

    const handleCloseNotification = () => {
      setNotification((prev) => ({ ...prev, open: false }));
    };

    // Calculate statistics
    const totalDojos = sampleDojos.length;
    const availableDojos = sampleDojos.filter(
      (d) => d.status === 'available'
    ).length;
    const occupiedDojos = sampleDojos.filter(
      (d) => d.status === 'occupied'
    ).length;
    const warDojos = sampleDojos.filter((d) => d.status === 'at-war').length;

    const { location, error } = useUserLocation();

    return (
      <Box>
        {/* Statistics Overview */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom align="center">
            🗺️ World Map Statistics
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <LocationOn
                  sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}
                />
                <Typography variant="h4" color="primary.main">
                  {totalDojos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Dojos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Group sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {availableDojos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <EmojiEvents
                  sx={{ fontSize: 40, color: 'warning.main', mb: 1 }}
                />
                <Typography variant="h4" color="warning.main">
                  {occupiedDojos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Occupied
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <LocationOn sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" color="error.main">
                  {warDojos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  At War
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Welcome Section for Non-Authenticated Users */}
        <Paper sx={{ p: 4, mt: 3, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to DojoPool
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            The ultimate pool gaming experience where strategy meets skill
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button variant="contained" size="large" href="/login">
              Sign In
            </Button>
            <Button variant="outlined" size="large" href="/register">
              Create Account
            </Button>
          </Box>
        </Paper>

        {/* World Map Component */}
        <WorldMapComponent
          dojos={sampleDojos}
          onChallengeDojo={handleChallengeDojo}
          onViewDojo={handleViewDojo}
          onLocationUpdate={handleLocationUpdate}
          centerOn={location}
        />

        {/* Information Panel */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            🎯 How to Use the World Map
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Exploring Dojos
              </Typography>
              <ul>
                <li>Use the search and filters to find specific venues</li>
                <li>
                  Toggle between map and list view for different perspectives
                </li>
                <li>Click on Dojo markers to see detailed information</li>
                <li>Use your current location to find nearby venues</li>
              </ul>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Challenging Players
              </Typography>
              <ul>
                <li>Available Dojos can be challenged immediately</li>
                <li>Occupied Dojos require defeating the current controller</li>
                <li>Dojos at war are involved in active clan conflicts</li>
                <li>Maintenance venues are temporarily unavailable</li>
              </ul>
            </Grid>
          </Grid>
        </Paper>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  };
};

export default HomePage;
