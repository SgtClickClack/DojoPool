import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Alert,
  Grid,
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';

interface Venue {
  id: string;
  name: string;
  address: string;
  tables: number;
}

const VenueManagementPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([
    { id: '1', name: 'Test Venue', address: '123 Test St', tables: 4 },
  ]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<string | null>(null);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    tables: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setEditingVenue(null);
    setFormData({ name: '', address: '', tables: '' });
    setError(null);
    setOpen(true);
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      address: venue.address,
      tables: venue.tables.toString(),
    });
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVenue(null);
    setFormData({ name: '', address: '', tables: '' });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || !formData.tables) {
      setError('All fields are required');
      return;
    }

    const tables = parseInt(formData.tables);
    if (isNaN(tables) || tables < 1) {
      setError('Tables must be a positive number');
      return;
    }

    try {
      if (editingVenue) {
        // Simulate API call
        setVenues((prev) =>
          prev.map((v) =>
            v.id === editingVenue.id
              ? { ...v, name: formData.name, address: formData.address, tables }
              : v
          )
        );
      } else {
        // Simulate API call
        const newVenue: Venue = {
          id: (venues.length + 1).toString(),
          name: formData.name,
          address: formData.address,
          tables,
        };
        setVenues((prev) => [...prev, newVenue]);
      }
      handleClose();
    } catch (err) {
      setError('Failed to save venue');
    }
  };

  const handleDelete = (venueId: string) => {
    setVenueToDelete(venueId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (venueToDelete) {
      setVenues((prev) => prev.filter((v) => v.id !== venueToDelete));
      setDeleteDialogOpen(false);
      setVenueToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setVenueToDelete(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Venue Management
      </Typography>

      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Manage your venues</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          data-testid="add-venue-button"
        >
          Add Venue
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="error-message">
          {error}
        </Alert>
      )}

      <Grid container spacing={2} data-testid="venue-list">
        {venues.map((venue) => (
          <Grid item xs={12} md={6} lg={4} key={venue.id}>
            <Card data-testid="venue-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {venue.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {venue.address}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {venue.tables} tables
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(venue)}
                    data-testid={`edit-venue-button-${venue.id}`}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(venue.id)}
                    data-testid={`delete-venue-button-${venue.id}`}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingVenue ? 'Edit Venue' : 'Add New Venue'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Venue Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              margin="normal"
              data-testid="venue-name-input"
            />
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              margin="normal"
              data-testid="venue-address-input"
            />
            <TextField
              fullWidth
              label="Number of Tables"
              type="number"
              value={formData.tables}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tables: e.target.value }))
              }
              margin="normal"
              data-testid="venue-tables-input"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            data-testid="submit-venue-button"
          >
            {editingVenue ? 'Update' : 'Add'} Venue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this venue?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button
            color="error"
            onClick={confirmDelete}
            data-testid="confirm-delete-button"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VenueManagementPage;
