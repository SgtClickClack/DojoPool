import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useEffect, useState } from 'react';

interface Event {
  id: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  venueId?: string;
  maxAttendees?: string;
  registrationDeadline?: string;
  eventType?: string;
  status: string;
  tags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface EventFormData {
  title: string;
  description: string;
  eventDate: Date | null;
  location: string;
  venueId: string;
  maxAttendees: string;
  registrationDeadline: Date | null;
  eventType: string;
  tags: string[];
  metadata: any;
}

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventDate: null,
    location: '',
    venueId: '',
    maxAttendees: '',
    registrationDeadline: null,
    eventType: 'TOURNAMENT',
    tags: [],
    metadata: {},
  });

  // Mock data for venues - in real app, fetch from API
  const mockVenues = [
    { id: '1', name: 'The Jade Tiger' },
    { id: '2', name: 'Pool Palace' },
    { id: '3', name: 'Billiards Central' },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // In real implementation, this would call the CMS API
      const response = await fetch('/api/cms/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.content || []);
      } else {
        // Mock data for development
        setEvents([
          {
            id: '1',
            title: 'Championship Tournament 2025',
            description: 'Annual championship tournament featuring top players',
            eventDate: '2025-02-15T14:00:00Z',
            location: 'The Jade Tiger',
            venueId: '1',
            maxAttendees: '64',
            registrationDeadline: '2025-02-10T23:59:59Z',
            eventType: 'TOURNAMENT',
            status: 'APPROVED',
            tags: ['tournament', 'championship', '2025'],
            metadata: { prizePool: '$10,000', format: 'Double Elimination' },
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z',
          },
          {
            id: '2',
            title: 'Pool Maintenance Day',
            description: 'Scheduled maintenance and equipment upgrades',
            eventDate: '2025-01-20T09:00:00Z',
            location: 'All Venues',
            maxAttendees: '0',
            eventType: 'MAINTENANCE',
            status: 'APPROVED',
            tags: ['maintenance', 'venue'],
            metadata: {
              duration: '4 hours',
              affectedServices: ['pool tables', 'lighting'],
            },
            createdAt: '2025-01-10T08:00:00Z',
            updatedAt: '2025-01-10T08:00:00Z',
          },
        ]);
      }
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      eventDate: null,
      location: '',
      venueId: '',
      maxAttendees: '',
      registrationDeadline: null,
      eventType: 'TOURNAMENT',
      tags: [],
      metadata: {},
    });
    setDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      eventDate: event.eventDate ? new Date(event.eventDate) : null,
      location: event.location || '',
      venueId: event.venueId || '',
      maxAttendees: event.maxAttendees || '',
      registrationDeadline: event.registrationDeadline
        ? new Date(event.registrationDeadline)
        : null,
      eventType: event.eventType || 'TOURNAMENT',
      tags: event.tags || [],
      metadata: event.metadata || {},
    });
    setDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/cms/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Event deleted successfully');
        fetchEvents();
      } else {
        setError('Failed to delete event');
      }
    } catch (err) {
      setError('Failed to delete event');
      console.error('Error deleting event:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      const eventData = {
        ...formData,
        eventDate: formData.eventDate?.toISOString(),
        registrationDeadline: formData.registrationDeadline?.toISOString(),
        tags: formData.tags.filter((tag) => tag.trim() !== ''),
        metadata: {
          ...formData.metadata,
          // Add any additional metadata based on event type
          ...(formData.eventType === 'TOURNAMENT' && {
            format: 'Single Elimination',
            entryFee: 50,
          }),
        },
      };

      const url = editingEvent
        ? `/api/cms/events/${editingEvent.id}`
        : '/api/cms/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        setSuccess(
          editingEvent
            ? 'Event updated successfully'
            : 'Event created successfully'
        );
        setDialogOpen(false);
        fetchEvents();
      } else {
        setError('Failed to save event');
      }
    } catch (err) {
      setError('Failed to save event');
      console.error('Error saving event:', err);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEvent(null);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'TOURNAMENT':
        return 'primary';
      case 'SOCIAL':
        return 'secondary';
      case 'MAINTENANCE':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading events...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" component="h2">
            Event Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateEvent}
          >
            Create Event
          </Button>
        </Box>

        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} md={6} lg={4} key={event.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{ flexGrow: 1 }}
                    >
                      {event.title}
                    </Typography>
                    <Chip
                      label={event.eventType || 'EVENT'}
                      color={
                        getEventTypeColor(event.eventType || 'EVENT') as any
                      }
                      size="small"
                    />
                  </Box>

                  {event.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {event.description}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    {event.eventDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon
                          sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }}
                        />
                        <Typography variant="body2">
                          {new Date(event.eventDate).toLocaleDateString()} at{' '}
                          {new Date(event.eventDate).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    )}

                    {event.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon
                          sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }}
                        />
                        <Typography variant="body2">
                          {event.location}
                        </Typography>
                      </Box>
                    )}

                    {event.maxAttendees && parseInt(event.maxAttendees) > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon
                          sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }}
                        />
                        <Typography variant="body2">
                          Max: {event.maxAttendees} attendees
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {event.tags && event.tags.length > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        mb: 2,
                      }}
                    >
                      {event.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleEditEvent(event)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteEvent(event.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Create/Edit Event Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                rows={3}
              />

              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={formData.eventType}
                  label="Event Type"
                  onChange={(e) =>
                    setFormData({ ...formData, eventType: e.target.value })
                  }
                >
                  <MenuItem value="TOURNAMENT">Tournament</MenuItem>
                  <MenuItem value="SOCIAL">Social Event</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="ANNOUNCEMENT">Announcement</MenuItem>
                </Select>
              </FormControl>

              <DateTimePicker
                label="Event Date & Time"
                value={formData.eventDate}
                onChange={(date) =>
                  setFormData({ ...formData, eventDate: date })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />

              <FormControl fullWidth>
                <InputLabel>Venue</InputLabel>
                <Select
                  value={formData.venueId}
                  label="Venue"
                  onChange={(e) =>
                    setFormData({ ...formData, venueId: e.target.value })
                  }
                >
                  {mockVenues.map((venue) => (
                    <MenuItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Location (if different from venue)"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />

              <TextField
                fullWidth
                label="Max Attendees"
                type="number"
                value={formData.maxAttendees}
                onChange={(e) =>
                  setFormData({ ...formData, maxAttendees: e.target.value })
                }
              />

              <DateTimePicker
                label="Registration Deadline"
                value={formData.registrationDeadline}
                onChange={(date) =>
                  setFormData({ ...formData, registrationDeadline: date })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />

              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={formData.tags.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter((tag) => tag),
                  })
                }
                helperText="Enter tags separated by commas"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingEvent ? 'Update' : 'Create'} Event
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default EventManagement;
