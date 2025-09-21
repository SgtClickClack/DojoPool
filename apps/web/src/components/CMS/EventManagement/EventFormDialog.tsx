import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Box,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
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

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editingEvent: Event | null;
  formData: EventFormData;
  onFormDataChange: (data: EventFormData) => void;
  venues: Array<{ id: string; name: string }>;
}

const EventFormDialog: React.FC<EventFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editingEvent,
  formData,
  onFormDataChange,
  venues,
}) => {
  const handleFormChange = (field: keyof EventFormData, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
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
              onChange={(e) => handleFormChange('title', e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              multiline
              rows={3}
            />

            <FormControl fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.eventType}
                label="Event Type"
                onChange={(e) => handleFormChange('eventType', e.target.value)}
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
              onChange={(date) => handleFormChange('eventDate', date)}
              slotProps={{ textField: { fullWidth: true } }}
            />

            <FormControl fullWidth>
              <InputLabel>Venue</InputLabel>
              <Select
                value={formData.venueId}
                label="Venue"
                onChange={(e) => handleFormChange('venueId', e.target.value)}
              >
                {venues.map((venue) => (
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
              onChange={(e) => handleFormChange('location', e.target.value)}
            />

            <TextField
              fullWidth
              label="Max Attendees"
              type="number"
              value={formData.maxAttendees}
              onChange={(e) => handleFormChange('maxAttendees', e.target.value)}
            />

            <DateTimePicker
              label="Registration Deadline"
              value={formData.registrationDeadline}
              onChange={(date) => handleFormChange('registrationDeadline', date)}
              slotProps={{ textField: { fullWidth: true } }}
            />

            <TextField
              fullWidth
              label="Tags (comma-separated)"
              value={formData.tags.join(', ')}
              onChange={(e) =>
                handleFormChange(
                  'tags',
                  e.target.value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter((tag) => tag)
                )
              }
              helperText="Enter tags separated by commas"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} variant="contained">
            {editingEvent ? 'Update' : 'Create'} Event
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EventFormDialog;
