import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Rating,
  Button,
} from '@mui/material';
import { type Venue, VenueStatus } from '../../types/venue';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TableBarIcon from '@mui/icons-material/TableBar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface VenueListProps {
  venues: Venue[];
}

export const VenueList: React.FC<VenueListProps> = ({ venues }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: VenueStatus) => {
    switch (status) {
      case VenueStatus.ACTIVE:
        return 'success';
      case VenueStatus.INACTIVE:
        return 'error';
      case VenueStatus.MAINTENANCE:
        return 'warning';
      case VenueStatus.CLOSED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getCurrentStatus = (venue: Venue) => {
    const now = new Date();
    const day = now.getDay();
    const time = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const todayHours = venue.businessHours.find((hours) => hours.day === day);
    if (!todayHours || todayHours.closed) {
      return 'CLOSED';
    }

    if (time >= todayHours.open && time <= todayHours.close) {
      return 'OPEN';
    }

    return 'CLOSED';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Pool Venues</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/venues/register')}
        >
          Register Venue
        </Button>
      </Box>
      <Grid container spacing={3}>
        {venues.map((venue) => (
          <Grid item xs={12} sm={6} md={4} key={venue.id}>
            <Card>
              <CardActionArea onClick={() => navigate(`/venues/${venue.id}`)}>
                <CardMedia
                  component="img"
                  height="200"
                  image={venue.photos[0] || '/default-venue.jpg'}
                  alt={venue.name}
                />
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {venue.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={venue.status}
                      color={getStatusColor(venue.status)}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating
                      value={venue.rating}
                      precision={0.5}
                      readOnly
                      size="small"
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      ({venue.reviewCount})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {venue.address.city}, {venue.address.state}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TableBarIcon fontSize="small" color="action" />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {venue.tables.length} tables available
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {getCurrentStatus(venue)}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
