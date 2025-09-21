import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import React from 'react';

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

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete }) => {
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

  return (
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
              getEventTypeColor(event.eventType || 'EVENT') as 'primary' | 'secondary' | 'warning' | 'default'
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
          onClick={() => onEdit(event)}
          color="primary"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onDelete(event.id)}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

interface EventGridProps {
  events: Event[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventGrid: React.FC<EventGridProps> = ({ events, onEditEvent, onDeleteEvent }) => {
  return (
    <Grid container spacing={3}>
      {events.map((event) => (
        <Grid item xs={12} md={6} lg={4} key={event.id}>
          <EventCard
            event={event}
            onEdit={onEditEvent}
            onDelete={onDeleteEvent}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default EventGrid;
