import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  CircularProgress,
  Pagination,
  Alert,
  Rating,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  TableBar as TableIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';

interface Venue {
  id: string;
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
  table_count: number;
  rating: number;
  distance?: number;
}

const ITEMS_PER_PAGE = 9;

export default function Venues() {
  const { user } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [page, search, userLocation]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: ((page - 1) * ITEMS_PER_PAGE).toString(),
        search: search,
        ...(userLocation && {
          lat: userLocation.lat.toString(),
          lng: userLocation.lng.toString(),
        }),
      });

      const response = await fetch(`/api/venue/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch venues');
      }

      setVenues(data.venues);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const formatDistance = (distance: number | undefined) => {
    if (!distance) return '';
    return `${distance.toFixed(1)} miles away`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Venues
        </Typography>
        <Typography color="textSecondary" paragraph>
          Find DojoPool-enabled venues near you and start playing.
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            placeholder="Search venues by name or location..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          {user?.role === 'venue_owner' && (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => router.push('/venues/register')}
              sx={{ height: '56px' }}
            >
              Register Venue
            </Button>
          )}
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Venue Cards */}
          <Grid container spacing={3}>
            {venues.map((venue) => (
              <Grid item xs={12} sm={6} md={4} key={venue.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        {venue.name}
                      </Typography>
                      <Chip
                        label={venue.is_active ? 'Open' : 'Closed'}
                        color={venue.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PlaceIcon sx={{ mr: 1 }} color="action" />
                      <Typography variant="body2">{venue.address}</Typography>
                    </Box>

                    {venue.distance && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ ml: 4, mb: 1 }}
                      >
                        {formatDistance(venue.distance)}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TableIcon sx={{ mr: 1 }} color="action" />
                      <Typography variant="body2">
                        {venue.table_count} {venue.table_count === 1 ? 'table' : 'tables'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating value={venue.rating} precision={0.5} readOnly size="small" />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        ({venue.rating})
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => router.push(`/venues/${venue.id}`)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}

          {venues.length === 0 && (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <PlaceIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No venues found
              </Typography>
              <Typography color="textSecondary">
                Try adjusting your search or check back later
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
} 