import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useState } from 'react';

interface CreateTournamentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (tournamentData: TournamentData) => void;
  loading?: boolean;
}

interface TournamentData {
  name: string;
  description: string;
  gameType: string;
  tournamentType: 'single_elimination' | 'double_elimination' | 'round_robin';
  bracketType: 'elimination' | 'swiss' | 'groups';
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  startDate: Date;
  endDate?: Date;
  rules: Record<string, any>;
}

const GAME_TYPES = [
  '8-ball',
  '9-ball',
  '10-ball',
  'Straight Pool',
  'One Pocket',
  'Bank Pool',
];

const TOURNAMENT_TYPES = [
  {
    value: 'single_elimination',
    label: 'Single Elimination',
    description: 'Traditional knockout format',
  },
  {
    value: 'double_elimination',
    label: 'Double Elimination',
    description: 'Players need two losses to be eliminated',
  },
  {
    value: 'round_robin',
    label: 'Round Robin',
    description: 'Everyone plays everyone once',
  },
];

const BRACKET_TYPES = [
  {
    value: 'elimination',
    label: 'Elimination',
    description: 'Standard bracket elimination',
  },
  {
    value: 'swiss',
    label: 'Swiss System',
    description: 'Players matched by skill level',
  },
  {
    value: 'groups',
    label: 'Group Stage',
    description: 'Initial group stage followed by elimination',
  },
];

export const CreateTournamentDialog: React.FC<CreateTournamentDialogProps> = ({
  open,
  onClose,
  onCreate,
  loading = false,
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState<TournamentData>({
    name: '',
    description: '',
    gameType: '8-ball',
    tournamentType: 'single_elimination',
    bracketType: 'elimination',
    maxParticipants: 16,
    entryFee: 100,
    prizePool: 500,
    startDate: new Date(Date.now() + 86400000), // Tomorrow
    endDate: undefined,
    rules: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof TournamentData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tournament name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'Must have at least 2 participants';
    }

    if (formData.entryFee < 0) {
      newErrors.entryFee = 'Entry fee cannot be negative';
    }

    if (formData.prizePool < 0) {
      newErrors.prizePool = 'Prize pool cannot be negative';
    }

    if (formData.startDate <= new Date()) {
      newErrors.startDate = 'Start date must be in the future';
    }

    if (formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalPrizePool = () => {
    return formData.prizePool + formData.entryFee * formData.maxParticipants;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onCreate(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      gameType: '8-ball',
      tournamentType: 'single_elimination',
      bracketType: 'elimination',
      maxParticipants: 16,
      entryFee: 100,
      prizePool: 500,
      startDate: new Date(Date.now() + 86400000),
      endDate: undefined,
      rules: {},
    });
    setErrors({});
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Typography variant="h5">🏆 Create New Tournament</Typography>
          <Typography variant="body2" color="text.secondary">
            Set up a new pool tournament for players to compete in
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tournament Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                  placeholder="Describe the tournament rules, prizes, and special conditions..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Game Type</InputLabel>
                  <Select
                    value={formData.gameType}
                    onChange={(e) =>
                      handleInputChange('gameType', e.target.value)
                    }
                    label="Game Type"
                  >
                    {GAME_TYPES.map((game) => (
                      <MenuItem key={game} value={game}>
                        {game}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Tournament Structure */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Tournament Structure
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tournament Type</InputLabel>
                  <Select
                    value={formData.tournamentType}
                    onChange={(e) =>
                      handleInputChange('tournamentType', e.target.value)
                    }
                    label="Tournament Type"
                  >
                    {TOURNAMENT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box>
                          <Typography variant="body1">{type.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Bracket Type</InputLabel>
                  <Select
                    value={formData.bracketType}
                    onChange={(e) =>
                      handleInputChange('bracketType', e.target.value)
                    }
                    label="Bracket Type"
                  >
                    {BRACKET_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box>
                          <Typography variant="body1">{type.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Participants"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    handleInputChange(
                      'maxParticipants',
                      parseInt(e.target.value)
                    )
                  }
                  error={!!errors.maxParticipants}
                  helperText={errors.maxParticipants}
                  inputProps={{ min: 2, max: 128, step: 2 }}
                />
              </Grid>

              {/* Monetary Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Entry & Prizes
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Entry Fee (coins)"
                  value={formData.entryFee}
                  onChange={(e) =>
                    handleInputChange('entryFee', parseInt(e.target.value))
                  }
                  error={!!errors.entryFee}
                  helperText={errors.entryFee}
                  inputProps={{ min: 0, step: 10 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Prize Pool (coins)"
                  value={formData.prizePool}
                  onChange={(e) =>
                    handleInputChange('prizePool', parseInt(e.target.value))
                  }
                  error={!!errors.prizePool}
                  helperText={errors.prizePool}
                  inputProps={{ min: 0, step: 50 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Total Prize Pool:</strong>{' '}
                    {calculateTotalPrizePool()} coins
                    <br />
                    <em>
                      Entry fees ({formData.entryFee} ×{' '}
                      {formData.maxParticipants}) + Your contribution (
                      {formData.prizePool})
                    </em>
                  </Typography>
                </Alert>
              </Grid>

              {/* Scheduling */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Scheduling
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={formData.startDate}
                  onChange={(date) => handleInputChange('startDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.startDate,
                      helperText: errors.startDate,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="End Date & Time (Optional)"
                  value={formData.endDate}
                  onChange={(date) => handleInputChange('endDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.endDate,
                      helperText: errors.endDate,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            size="large"
          >
            {loading ? 'Creating...' : 'Create Tournament'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
