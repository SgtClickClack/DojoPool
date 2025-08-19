import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TableBar as TableIcon,
  Event as BookingIcon,
  Analytics as StatsIcon,
} from '@mui/icons-material';

interface Table {
  id: string;
  number: number;
  isOccupied: boolean;
  currentGame?: {
    id: string;
    player1: string;
    player2: string;
    startTime: string;
  };
  maintenanceStatus: 'operational' | 'needs_maintenance' | 'under_maintenance';
  lastMaintenance: string;
}

interface Booking {
  id: string;
  tableId: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface Venue {
  id: string;
  name: string;
  address: string;
  tables: Table[];
  operatingHours: {
    open: string;
    close: string;
  };
  currentCapacity: number;
  maxCapacity: number;
  amenities: string[];
  rating: number;
  bookings: Booking[];
}

const VenueManager: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues');
      if (!response.ok) throw new Error('Failed to fetch venues');
      const data = await response.json();
      setVenues(data);
    } catch (err) {
      setError('Error loading venues');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVenue = async (venueData: Partial<Venue>) => {
    try {
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venueData),
      });
      if (!response.ok) throw new Error('Failed to add venue');
      const newVenue = await response.json();
      setVenues([...venues, newVenue]);
      setIsAddDialogOpen(false);
    } catch (err) {
      setError('Error adding venue');
    }
  };

  const handleEditVenue = async (
    venueId: string,
    venueData: Partial<Venue>
  ) => {
    try {
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venueData),
      });
      if (!response.ok) throw new Error('Failed to update venue');
      const updatedVenue = await response.json();
      setVenues(venues.map((v) => (v.id === venueId ? updatedVenue : v)));
      setIsEditDialogOpen(false);
    } catch (err) {
      setError('Error updating venue');
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!window.confirm('Are you sure you want to delete this venue?')) return;

    try {
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete venue');
      setVenues(venues.filter((v) => v.id !== venueId));
    } catch (err) {
      setError('Error deleting venue');
    }
  };

  const handleBookTable = async (booking: Partial<Booking>) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });
      if (!response.ok) throw new Error('Failed to book table');
      const newBooking = await response.json();

      // Update venue bookings
      if (selectedVenue) {
        const updatedVenue = {
          ...selectedVenue,
          bookings: [...selectedVenue.bookings, newBooking],
        };
        setVenues(
          venues.map((v) => (v.id === selectedVenue.id ? updatedVenue : v))
        );
        setSelectedVenue(updatedVenue);
      }

      setIsBookingDialogOpen(false);
    } catch (err) {
      setError('Error booking table');
    }
  };

  const handleMaintenanceRequest = async (
    tableId: string,
    status: Table['maintenanceStatus']
  ) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update maintenance status');

      // Update table status in UI
      if (selectedVenue) {
        const updatedTables = selectedVenue.tables.map((t) =>
          t.id === tableId ? { ...t, maintenanceStatus: status } : t
        );
        const updatedVenue = { ...selectedVenue, tables: updatedTables };
        setVenues(
          venues.map((v) => (v.id === selectedVenue.id ? updatedVenue : v))
        );
        setSelectedVenue(updatedVenue);
      }
    } catch (err) {
      setError('Error updating maintenance status');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4">Venue Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Add Venue
        </Button>
      </Box>

      <Grid container spacing={3}>
        {venues.map((venue) => (
          <Grid item xs={12} md={6} lg={4} key={venue.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">{venue.name}</Typography>
                  <Box>
                    <IconButton
                      onClick={() => {
                        setSelectedVenue(venue);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteVenue(venue.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography color="textSecondary" gutterBottom>
                  {venue.address}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Operating Hours</Typography>
                  <Typography>
                    {venue.operatingHours.open} - {venue.operatingHours.close}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Capacity</Typography>
                  <Typography>
                    {venue.currentCapacity}/{venue.maxCapacity} tables in use
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Amenities</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {venue.amenities.map((amenity) => (
                      <Chip key={amenity} label={amenity} size="small" />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<TableIcon />}
                    onClick={() => setSelectedVenue(venue)}
                  >
                    View Tables
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BookingIcon />}
                    onClick={() => {
                      setSelectedVenue(venue);
                      setIsBookingDialogOpen(true);
                    }}
                  >
                    Bookings
                  </Button>
                  <Button variant="outlined" startIcon={<StatsIcon />}>
                    Stats
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Venue Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add New Venue</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Venue Name"
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Opening Time"
                fullWidth
                variant="outlined"
                type="time"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Closing Time"
                fullWidth
                variant="outlined"
                type="time"
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Number of Tables"
            fullWidth
            variant="outlined"
            type="number"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleAddVenue({})}>
            Add Venue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Venue Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      >
        <DialogTitle>Edit Venue</DialogTitle>
        <DialogContent>
          {/* Similar fields as Add Venue Dialog, pre-filled with selected venue data */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() =>
              selectedVenue && handleEditVenue(selectedVenue.id, {})
            }
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog
        open={isBookingDialogOpen}
        onClose={() => setIsBookingDialogOpen(false)}
      >
        <DialogTitle>Book a Table</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Select Table"
            fullWidth
            variant="outlined"
            select
          />
          <TextField
            margin="dense"
            label="Date"
            fullWidth
            variant="outlined"
            type="date"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Start Time"
                fullWidth
                variant="outlined"
                type="time"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="End Time"
                fullWidth
                variant="outlined"
                type="time"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsBookingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleBookTable({})}>
            Book Table
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VenueManager;
