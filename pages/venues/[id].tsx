import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Rating,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  TableBar as TableIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { validateBookingTime } from '../../lib/validation';

interface Table {
  id: string;
  table_number: number;
  is_active: boolean;
  status: 'available' | 'in_use' | 'maintenance';
}

interface Booking {
  id: string;
  table_id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'completed';
}

interface Venue {
  id: string;
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
  rating: number;
  tables: Table[];
  current_bookings: Booking[];
}

export default function VenueDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [bookingData, setBookingData] = useState({
    startTime: '',
    endTime: '',
  });
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    if (id) {
      fetchVenueDetails();
    }
  }, [id]);

  const fetchVenueDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/venue/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch venue details');
      }

      setVenue(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBookTable = (table: Table) => {
    setSelectedTable(table);
    setBookingDialog(true);
  };

  const handleCloseBooking = () => {
    setBookingDialog(false);
    setSelectedTable(null);
    setBookingData({ startTime: '', endTime: '' });
    setBookingError('');
  };

  const handleConfirmBooking = async () => {
    if (!selectedTable) return;

    const startTime = new Date(bookingData.startTime);
    const endTime = new Date(bookingData.endTime);

    if (!validateBookingTime(startTime, endTime)) {
      setBookingError('Invalid booking time. Please check your selection.');
      return;
    }

    try {
      const response = await fetch('/api/venue/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_id: selectedTable.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book table');
      }

      handleCloseBooking();
      fetchVenueDetails(); // Refresh venue data
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to book table');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !venue) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error || 'Venue not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Venue Header */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {venue.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PlaceIcon sx={{ mr: 1 }} color="action" />
              <Typography>{venue.address}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhoneIcon sx={{ mr: 1 }} color="action" />
              <Typography>{venue.contact_phone}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmailIcon sx={{ mr: 1 }} color="action" />
              <Typography>{venue.contact_email}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                label={venue.is_active ? 'Open' : 'Closed'}
                color={venue.is_active ? 'success' : 'error'}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2 }}>
                <Rating value={venue.rating} precision={0.5} readOnly />
                <Typography sx={{ ml: 1 }}>({venue.rating})</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tables Section */}
      <Typography variant="h5" gutterBottom>
        Pool Tables
      </Typography>
      <Grid container spacing={3}>
        {venue.tables.map((table) => (
          <Grid item xs={12} sm={6} md={4} key={table.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Table {table.table_number}
                  </Typography>
                  <Chip
                    label={table.status}
                    color={
                      table.status === 'available'
                        ? 'success'
                        : table.status === 'in_use'
                        ? 'primary'
                        : 'error'
                    }
                    size="small"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={!table.is_active || table.status !== 'available'}
                  onClick={() => handleBookTable(table)}
                >
                  Book Table
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onClose={handleCloseBooking}>
        <DialogTitle>Book Table {selectedTable?.table_number}</DialogTitle>
        <DialogContent>
          {bookingError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {bookingError}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Start Time"
              type="datetime-local"
              value={bookingData.startTime}
              onChange={(e) =>
                setBookingData((prev) => ({ ...prev, startTime: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="End Time"
              type="datetime-local"
              value={bookingData.endTime}
              onChange={(e) =>
                setBookingData((prev) => ({ ...prev, endTime: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBooking}>Cancel</Button>
          <Button onClick={handleConfirmBooking} variant="contained">
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 