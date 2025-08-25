import { initiateShadowRun } from '@/services/APIService';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface ShadowRunModalProps {
  open: boolean;
  onClose: () => void;
  targetVenueId: string;
  targetVenueName: string;
}

const missionTypes = [
  { value: 'data_heist', label: 'Data Heist', cost: 100 },
  { value: 'sabotage', label: 'Sabotage', cost: 200 },
];

export const ShadowRunModal: React.FC<ShadowRunModalProps> = ({
  open,
  onClose,
  targetVenueId,
  targetVenueName,
}) => {
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!selectedType) return;
    setIsLoading(true);
    setError('');
    try {
      await initiateShadowRun(targetVenueId, selectedType);
      onClose();
    } catch (err) {
      setError('Failed to initiate shadow run');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMission = missionTypes.find((m) => m.value === selectedType);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Initiate Shadow Run</DialogTitle>
      <DialogContent>
        <Typography>Target: {targetVenueName}</Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Mission Type</InputLabel>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as string)}
          >
            {missionTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label} ({type.cost} DojoCoins)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {error && <Typography color="error">{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading || !selectedType}
          variant="contained"
        >
          {isLoading ? <CircularProgress size={24} /> : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
