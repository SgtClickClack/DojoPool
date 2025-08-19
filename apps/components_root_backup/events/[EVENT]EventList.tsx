import React, { useState } from 'react';
import {
  List,
  ListItem,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Box,
} from '@mui/material';
import { Add as PlusIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import moment from 'moment';

import { createEvent, registerForEvent } from '../../api/venues';
import { type VenueEvent } from '../../types/venue';
import { useAuth } from '../../hooks/useAuth';

interface EventListProps {
  events?: VenueEvent[];
  loading?: boolean;
  venueId: number;
}

// Date picker will be implemented with Material-UI components

const EventList: React.FC<EventListProps> = ({
  events = [],
  loading,
  venueId,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: '',
    start_time: '',
    end_time: '',
    registration_deadline: '',
    max_participants: 0,
    entry_fee: 0,
    prize_pool: 0,
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const createEventMutation = useMutation(createEvent, {
    onSuccess: () => {
      setNotification({
        open: true,
        message: 'Event created successfully',
        severity: 'success',
      });
      setCreateModalVisible(false);
      setFormData({
        name: '',
        description: '',
        event_type: '',
        start_time: '',
        end_time: '',
        registration_deadline: '',
        max_participants: 0,
        entry_fee: 0,
        prize_pool: 0,
      });
      queryClient.invalidateQueries(['venueEvents', venueId]);
    },
    onError: (error: any) => {
      setNotification({
        open: true,
        message: error.message || 'Failed to create event',
        severity: 'error',
      });
    },
  });

  const registerMutation = useMutation(registerForEvent, {
    onSuccess: () => {
      setNotification({
        open: true,
        message: 'Successfully registered for event',
        severity: 'success',
      });
      queryClient.invalidateQueries(['venueEvents', venueId]);
    },
    onError: (error: any) => {
      setNotification({
        open: true,
        message: error.message || 'Failed to register for event',
        severity: 'error',
      });
    },
  });

  const handleCreateEvent = () => {
    createEventMutation.mutate({
      venueId,
      name: formData.name,
      description: formData.description,
      event_type: formData.event_type,
      start_time: formData.start_time,
      end_time: formData.end_time,
      registration_deadline: formData.registration_deadline,
      max_participants: formData.max_participants,
      entry_fee: formData.entry_fee,
      prize_pool: formData.prize_pool,
    });
  };

  const handleRegister = (eventId: number) => {
    if (!user) {
      setNotification({
        open: true,
        message: 'Please log in to register for events',
        severity: 'error',
      });
      return;
    }
    registerMutation.mutate(eventId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'blue';
      case 'in_progress':
        return 'green';
      case 'completed':
        return 'gray';
      case 'cancelled':
        return 'red';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <CircularProgress size={40} />
      </div>
    );
  }

  return (
    <div className="event-list">
      {user && (
        <Button
          type="primary"
          startIcon={<PlusIcon />}
          onClick={() => setCreateModalVisible(true)}
          style={{ marginBottom: 16 }}
        >
          Create Event
        </Button>
      )}

      <List
        grid={{
          gutter: 16,
          xs: 1,
          sm: 2,
          md: 3,
          lg: 3,
          xl: 4,
          xxl: 4,
        }}
        dataSource={events}
        renderItem={(event) => (
          <ListItem>
            <Card
              title={event.name}
              extra={
                <Chip label={event.status} color={getStatusColor(event.status) as any} />
              }
            >
              <p>{event.description}</p>
              <p>
                <strong>Type:</strong> {event.event_type}
              </p>
              <p>
                <strong>Date:</strong>{' '}
                {moment(event.start_time).format('MMM D, YYYY')}
              </p>
              <p>
                <strong>Time:</strong>{' '}
                {moment(event.start_time).format('h:mm A')} -{' '}
                {moment(event.end_time).format('h:mm A')}
              </p>
              {event.entry_fee > 0 && (
                <p>
                  <strong>Entry Fee:</strong> ${event.entry_fee}
                </p>
              )}
              {event.prize_pool > 0 && (
                <p>
                  <strong>Prize Pool:</strong> ${event.prize_pool}
                </p>
              )}
              {event.max_participants && (
                <p>
                  <strong>Spots:</strong> {event.participants?.length || 0}/
                  {event.max_participants}
                </p>
              )}
              {event.status === 'upcoming' && (
                <Button
                  type="primary"
                  block
                  onClick={() => handleRegister(event.id)}
                  loading={registerMutation.isLoading}
                  disabled={
                    !user ||
                    event.participants?.some((p) => p.user_id === user.id)
                  }
                >
                  {event.participants?.some((p) => p.user_id === user?.id)
                    ? 'Registered'
                    : 'Register'}
                </Button>
              )}
            </Card>
          </ListItem>
        )}
      />

      <Dialog
        open={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Event</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Event Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Event Type"
              value={formData.event_type}
              onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Start Time"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Time"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Registration Deadline"
              type="datetime-local"
              value={formData.registration_deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Maximum Participants"
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 0 }))}
              required
              fullWidth
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Entry Fee"
              type="number"
              value={formData.entry_fee}
              onChange={(e) => setFormData(prev => ({ ...prev, entry_fee: parseFloat(e.target.value) || 0 }))}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Prize Pool"
              type="number"
              value={formData.prize_pool}
              onChange={(e) => setFormData(prev => ({ ...prev, prize_pool: parseFloat(e.target.value) || 0 }))}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalVisible(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateEvent}
            disabled={createEventMutation.isLoading}
          >
            {createEventMutation.isLoading ? 'Creating...' : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EventList;
