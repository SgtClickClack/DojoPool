import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';

interface Venue {
  id: string;
  name: string;
}

interface TournamentFormData {
  name: string;
  format: string;
  venueId: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
}

interface TournamentFormProps {
  initialData?: TournamentFormData;
  venues: Venue[];
  isLoadingVenues: boolean;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: TournamentFormData) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

const TournamentForm: React.FC<TournamentFormProps> = ({
  initialData,
  venues,
  isLoadingVenues,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  mode,
}) => {
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    format: 'SINGLE_ELIMINATION',
    venueId: '',
    startDate: '',
    endDate: '',
    maxParticipants: 16,
    entryFee: 0,
    prizePool: 0,
    ...initialData,
  });

  const tournamentFormats = [
    'SINGLE_ELIMINATION',
    'DOUBLE_ELIMINATION',
    'ROUND_ROBIN',
    'SWISS_SYSTEM',
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.venueId !== '' &&
      formData.startDate !== '' &&
      formData.endDate !== '' &&
      formData.maxParticipants >= 2
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Tournament Name"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        required
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Tournament Format</InputLabel>
        <Select
          value={formData.format}
          label="Tournament Format"
          onChange={(e) => handleInputChange('format', e.target.value)}
        >
          {tournamentFormats.map((format) => (
            <MenuItem key={format} value={format}>
              {format.replace(/_/g, ' ')}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Venue (Dojo)</InputLabel>
        <Select
          value={formData.venueId}
          label="Venue (Dojo)"
          onChange={(e) => handleInputChange('venueId', e.target.value)}
          required
          disabled={isLoadingVenues}
        >
          {isLoadingVenues ? (
            <MenuItem disabled>
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                Loading venues...
              </Box>
            </MenuItem>
          ) : (
            venues.map((venue) => (
              <MenuItem key={venue.id} value={venue.id}>
                {venue.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <Box display="flex" gap={2} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Start Date"
          type="datetime-local"
          value={formData.startDate}
          onChange={(e) => handleInputChange('startDate', e.target.value)}
          required
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          fullWidth
          label="End Date"
          type="datetime-local"
          value={formData.endDate}
          onChange={(e) => handleInputChange('endDate', e.target.value)}
          required
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <Box display="flex" gap={2} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Max Participants"
          type="number"
          value={formData.maxParticipants}
          onChange={(e) =>
            handleInputChange('maxParticipants', parseInt(e.target.value))
          }
          required
          inputProps={{ min: 2, max: 128 }}
        />
        <TextField
          fullWidth
          label="Entry Fee (coins)"
          type="number"
          value={formData.entryFee}
          onChange={(e) =>
            handleInputChange('entryFee', parseFloat(e.target.value))
          }
          inputProps={{ min: 0, step: 0.01 }}
        />
      </Box>

      <TextField
        fullWidth
        label="Prize Pool (coins)"
        type="number"
        value={formData.prizePool}
        onChange={(e) =>
          handleInputChange('prizePool', parseFloat(e.target.value))
        }
        inputProps={{ min: 0, step: 0.01 }}
        sx={{ mb: 2 }}
      />

      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button
          onClick={onCancel}
          disabled={isSubmitting}
          startIcon={<CloseIcon />}
          sx={{ color: '#666' }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || !isFormValid()}
          startIcon={
            isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />
          }
          sx={{
            background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
            color: '#000',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
            },
          }}
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
            ? 'Create Tournament'
            : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default TournamentForm;
