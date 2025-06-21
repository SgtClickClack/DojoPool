import React from 'react';
import { Box, Container, Typography, Paper, Card, CardContent } from '@mui/material';
import { LocationOn, Business, Star, AccessTime } from '@mui/icons-material';
import Layout from '../src/components/layout/Layout';
import PageBackground from '../src/components/common/PageBackground';
import MapView from '../src/frontend/components/MapView';

const MapPage: React.FC = () => {
  const nearbyVenues = [
    {
      id: 1,
      name: "DojoPool Central",
      distance: "0.2 km",
      rating: 4.8,
      status: "Open",
      players: 12,
      color: "#00ff9d"
    },
    {
      id: 2,
      name: "Pool Masters Arena",
      distance: "0.8 km",
      rating: 4.6,
      status: "Open",
      players: 8,
      color: "#00a8ff"
    },
    {
      id: 3,
      name: "Elite Pool Club",
      distance: "1.2 km",
      rating: 4.9,
      status: "Open",
      players: 15,
      color: "#ff6b6b"
    },
    {
      id: 4,
      name: "Championship Hall",
      distance: "2.1 km",
      rating: 4.7,
      status: "Open",
      players: 6,
      color: "#feca57"
    }
  ];

  return (
    <Layout>
      <PageBackground variant="map">
        <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              color: '#00ff9d',
              textShadow: '0 0 20px #00ff9d',
              mb: 2,
              textAlign: 'center'
            }}
          >
            Venue Map
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: '#00a8ff',
              textAlign: 'center',
              mb: 4,
              fontFamily: 'Orbitron, monospace',
              textShadow: '0 0 10px rgba(0, 168, 255, 0.5)'
            }}
          >
            Find your nearest DojoPool venue
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Card
              sx={{
                background: 'rgba(26, 26, 26, 0.9)',
                border: '2px solid #00ff9d',
                borderRadius: 3,
                boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: '#00ff9d',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 600,
                    mb: 2,
                    textShadow: '0 0 10px rgba(0, 255, 157, 0.5)'
                  }}
                >
                  Interactive Map
                </Typography>
                <Box sx={{ height: 500, borderRadius: 2, overflow: 'hidden' }}>
                  <MapView />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Typography
            variant="h4"
            sx={{
              color: '#00a8ff',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
              mb: 3,
              textAlign: 'center',
              textShadow: '0 0 10px rgba(0, 168, 255, 0.5)'
            }}
          >
            Nearby Venues
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            {nearbyVenues.map((venue) => (
              <Paper
                key={venue.id}
                sx={{
                  p: 3,
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: `2px solid ${venue.color}`,
                  borderRadius: 3,
                  boxShadow: `0 0 20px ${venue.color}40`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 0 30px ${venue.color}80`,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn sx={{ color: venue.color, mr: 1, fontSize: 24 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: venue.color,
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      textShadow: `0 0 10px ${venue.color}40`
                    }}
                  >
                    {venue.name}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Star sx={{ color: '#ffd700', fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2" sx={{ color: '#fff', mr: 2 }}>
                    {venue.rating}
                  </Typography>
                  <AccessTime sx={{ color: '#00a8ff', fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2" sx={{ color: '#00a8ff' }}>
                    {venue.status}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    {venue.distance}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Business sx={{ color: '#00ff9d', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: '#00ff9d' }}>
                      {venue.players} players
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default MapPage; 