import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Divider, List, ListItem, ListItemText, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import { Heading, Text } from '@chakra-ui/react'; // Correct import for Heading and Text
import { getVenue } from '../../dojopool/frontend/api/venues'; // Assuming this path and function exist
import { Venue } from '../../dojopool/frontend/types/venue';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface VenueDashboardProps {
  venueId: string; // Assuming venueId is passed as a prop
  // Or derive venueId from user context if the logged-in user is a venue owner
}

const VenueDashboard: React.FC<VenueDashboardProps> = ({ venueId }) => {
  const [venueData, setVenueData] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [tableForm, setTableForm] = useState({ name: '', type: '' });
  const [eventForm, setEventForm] = useState({ name: '', date: '', time: '' });

  useEffect(() => {
    const fetchVenueData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch venue details
        const details = await getVenue(parseInt(venueId));
        
        // Assuming getVenue returns a Venue object directly, or needs mapping
        // If mapping is needed, adjust based on the actual Venue type structure
        // For now, assume direct assignment if the fetched structure is close enough
        setVenueData(details);

      } catch (err: any) {
        console.error("Error fetching venue data:", err);
        setError('Failed to load venue data.');
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchVenueData();
    }
  }, [venueId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!venueData) {
       return (
           <Box sx={{ p: 4 }}>
               <Alert severity="info">No venue data available.</Alert>
           </Box>
       );
  }

  // Access data using the structure of the imported Venue type
  // Example: venueData.address is an object, format for display
  const displayAddress = `${venueData.address.street}, ${venueData.address.city}, ${venueData.address.state} ${venueData.address.postalCode}`;
  // Example: venueData.businessHours is an array, format for display
  const displayHours = venueData.businessHours.map(bh => `${bh.day}: ${bh.openTime} - ${bh.closeTime}`).join(', ');

  // Handlers for table CRUD
  const handleAddTable = () => {
    setSelectedTable(null);
    setTableForm({ name: '', type: '' });
    setIsTableDialogOpen(true);
  };
  const handleEditTable = (table: any) => {
    setSelectedTable(table);
    setTableForm({ name: table.name, type: table.type });
    setIsTableDialogOpen(true);
  };
  const handleDeleteTable = (tableId: string) => {
    // TODO: Implement API call
    setVenueData((prev: any) => ({ ...prev, tables: prev.tables.filter((t: any) => t.id !== tableId) }));
  };
  const handleTableDialogSave = () => {
    if (selectedTable) {
      // Edit
      setVenueData((prev: any) => ({
        ...prev,
        tables: prev.tables.map((t: any) => t.id === selectedTable.id ? { ...t, ...tableForm } : t)
      }));
    } else {
      // Add
      setVenueData((prev: any) => ({
        ...prev,
        tables: [...prev.tables, { id: Date.now().toString(), ...tableForm, status: 'available' }]
      }));
    }
    setIsTableDialogOpen(false);
  };

  // Handlers for event CRUD
  const handleAddEvent = () => {
    setSelectedEvent(null);
    setEventForm({ name: '', date: '', time: '' });
    setIsEventDialogOpen(true);
  };
  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setEventForm({ name: event.name, date: event.date, time: event.time });
    setIsEventDialogOpen(true);
  };
  const handleDeleteEvent = (eventId: string) => {
    // TODO: Implement API call
    setVenueData((prev: any) => ({ ...prev, events: prev.events.filter((e: any) => e.id !== eventId) }));
  };
  const handleEventDialogSave = () => {
    if (selectedEvent) {
      // Edit
      setVenueData((prev: any) => ({
        ...prev,
        events: prev.events.map((e: any) => e.id === selectedEvent.id ? { ...e, ...eventForm } : e)
      }));
    } else {
      // Add
      setVenueData((prev: any) => ({
        ...prev,
        events: [...(prev.events || []), { id: Date.now().toString(), ...eventForm }]
      }));
    }
    setIsEventDialogOpen(false);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Heading as="h4" size="lg" gutterBottom>Venue Dashboard: {venueData.name}</Heading>
      <Text sx={{ mb: 4 }}>Welcome to your venue management dashboard.</Text>

      <Grid container spacing={4}>
        {/* Venue Information Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Venue Information</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body1"><strong>Address:</strong> {displayAddress}</Typography>
              <Typography variant="body1"><strong>Hours:</strong> {displayHours}</Typography>
              <Typography variant="body1"><strong>Contact:</strong> {venueData.contact.email || venueData.contact.phone || venueData.contact.website}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Today's Overview</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body1"><strong>Check-ins:</strong> {venueData.stats.totalCheckins}</Typography>
              <Typography variant="body1"><strong>Games Played:</strong> {venueData.stats.totalGamesPlayed}</Typography>
              <Typography variant="body1"><strong>Avg. Game Duration:</strong> {venueData.stats.averageGameDuration}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tables Status Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Tables Status</Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button startIcon={<AddIcon />} onClick={handleAddTable} size="small">Add Table</Button>
              </Box>
              <List>
                {venueData.tables.length === 0 && <ListItem><ListItemText primary="No tables configured." /></ListItem>}
                {venueData.tables.map(table => (
                  <ListItem key={table.id} secondaryAction={
                    <>
                      <IconButton edge="end" aria-label="edit" onClick={() => handleEditTable(table)}><EditIcon /></IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteTable(table.id)}><DeleteIcon /></IconButton>
                    </>
                  }>
                    <ListItemText 
                      primary={`${table.name} - ${table.status}`}
                      secondary={`Type: ${table.type}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Events Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Upcoming Events</Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button startIcon={<AddIcon />} onClick={handleAddEvent} size="small">Add Event</Button>
              </Box>
              <List>
                {venueData.events?.length === 0 && <ListItem><ListItemText primary="No upcoming events." /></ListItem>}
                {venueData.events?.map(event => (
                  <ListItem key={event.id} secondaryAction={
                    <>
                      <IconButton edge="end" aria-label="edit" onClick={() => handleEditEvent(event)}><EditIcon /></IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteEvent(event.id)}><DeleteIcon /></IconButton>
                    </>
                  }>
                    <ListItemText 
                      primary={`${event.name} on ${event.date}`}
                      secondary={`Time: ${event.time}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Table Dialog */}
      <Dialog open={isTableDialogOpen} onClose={() => setIsTableDialogOpen(false)}>
        <DialogTitle>{selectedTable ? 'Edit Table' : 'Add Table'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={tableForm.name} onChange={e => setTableForm(f => ({ ...f, name: e.target.value }))} fullWidth sx={{ mb: 2 }} />
          <TextField label="Type" value={tableForm.type} onChange={e => setTableForm(f => ({ ...f, type: e.target.value }))} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTableDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTableDialogSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onClose={() => setIsEventDialogOpen(false)}>
        <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={eventForm.name} onChange={e => setEventForm(f => ({ ...f, name: e.target.value }))} fullWidth sx={{ mb: 2 }} />
          <TextField label="Date" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} fullWidth sx={{ mb: 2 }} />
          <TextField label="Time" value={eventForm.time} onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEventDialogSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default VenueDashboard; 