import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { withErrorBoundary } from '@/components/ErrorBoundary/withErrorBoundary';
import EventManagementHeader from './EventManagement/EventManagementHeader';
import EventGrid from './EventManagement/EventGrid';
import EventFormDialog from './EventManagement/EventFormDialog';
import EventManagementAlerts from './EventManagement/EventManagementAlerts';

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
  metadata?: Record<string, unknown>;
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
  metadata: Record<string, unknown>;
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
    void fetchEvents();
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
        void fetchEvents();
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
        void fetchEvents();
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading events...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <EventManagementAlerts
        error={error}
        success={success}
        onClearError={() => setError(null)}
        onClearSuccess={() => setSuccess(null)}
      />

      <EventManagementHeader onCreateEvent={handleCreateEvent} />

      <EventGrid
        events={events}
        onEditEvent={handleEditEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      <EventFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        editingEvent={editingEvent}
        formData={formData}
        onFormDataChange={setFormData}
        venues={mockVenues}
      />
    </Box>
  );
};

export default withErrorBoundary(EventManagement, {
  componentName: 'EventManagement',
  showRetry: true,
  showHome: true,
  showReport: true,
});