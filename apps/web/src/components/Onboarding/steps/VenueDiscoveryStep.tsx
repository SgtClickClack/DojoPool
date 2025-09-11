import { Group, LocationOn, Star } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

interface VenueDiscoveryStepProps {
  onComplete: (data: any) => void;
  onboardingData: any;
}

// Mock venue data - in real app, this would come from API
const MOCK_VENUES = [
  {
    id: '1',
    name: 'The Corner Pocket',
    distance: '0.3 miles',
    rating: 4.5,
    players: 12,
    image: '/api/placeholder/300/200',
    type: 'Sports Bar',
    features: ['8-ball', '9-ball', 'Tournaments'],
  },
  {
    id: '2',
    name: 'Rack & Cue Lounge',
    distance: '0.7 miles',
    rating: 4.2,
    players: 8,
    image: '/api/placeholder/300/200',
    type: 'Pool Hall',
    features: ['Snooker', 'Carom', 'Training'],
  },
  {
    id: '3',
    name: 'Downtown Billiards',
    distance: '1.2 miles',
    rating: 4.8,
    players: 25,
    image: '/api/placeholder/300/200',
    type: 'Professional Venue',
    features: ['Professional Tables', 'League Play', 'Bar'],
  },
];

export const VenueDiscoveryStep: React.FC<VenueDiscoveryStepProps> = ({
  onComplete,
  onboardingData,
}) => {
  const [selectedVenues, setSelectedVenues] = useState<string[]>(
    onboardingData.preferredVenues || []
  );
  const theme = useTheme();

  const handleVenueToggle = (venueId: string) => {
    setSelectedVenues((prev) =>
      prev.includes(venueId)
        ? prev.filter((id) => id !== venueId)
        : [...prev, venueId]
    );
  };

  const handleContinue = () => {
    onComplete({ preferredVenues: selectedVenues });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom align="center">
        Discover nearby venues
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4, textAlign: 'center' }}
      >
        Here are some great places near you to start playing. You can visit any
        venue to scan the QR code and start your first game!
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, maxWidth: 800, mx: 'auto' }}>
        {MOCK_VENUES.map((venue) => {
          const isSelected = selectedVenues.includes(venue.id);
          return (
            <Card
              key={venue.id}
              onClick={() => handleVenueToggle(venue.id)}
              sx={{
                cursor: 'pointer',
                border: `2px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[8],
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6">{venue.name}</Typography>
                      {isSelected && (
                        <Chip label="Selected" color="primary" size="small" />
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <LocationOn
                          sx={{ fontSize: 16, color: 'text.secondary' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {venue.distance}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                        <Typography variant="body2" color="text.secondary">
                          {venue.rating}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {venue.players} players online
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}
                    >
                      <Chip
                        label={venue.type}
                        variant="outlined"
                        size="small"
                      />
                      {venue.features.map((feature) => (
                        <Chip
                          key={feature}
                          label={feature}
                          variant="outlined"
                          size="small"
                          color="primary"
                        />
                      ))}
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Click to add to your preferred venues
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleContinue}
          sx={{
            px: 6,
            py: 1.5,
            fontSize: '1.1rem',
            borderRadius: 3,
          }}
        >
          Continue with {selectedVenues.length} venue
          {selectedVenues.length !== 1 ? 's' : ''} selected
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          You can always discover more venues later in the app
        </Typography>
      </Box>
    </Box>
  );
};
