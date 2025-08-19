import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import React, { useEffect, useState } from 'react';
import TournamentForm from './TournamentForm';

interface Venue {
  id: string;
  name: string;
}

interface CreateTournamentFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchVenues();
    }
  }, [open]);

  const fetchVenues = async () => {
    setIsLoadingVenues(true);
    try {
      const response = await fetch('http://localhost:8080/v1/territories');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setVenues(data);
    } catch (err) {
      console.error('Failed to fetch venues:', err);
      setError('Failed to load venues. Please try again.');
    } finally {
      setIsLoadingVenues(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/v1/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          status: 'OPEN',
          participants: '[]',
          matches: '[]',
          finalStandings: '[]',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tournament');
      }

      const newTournament = await response.json();
      console.log('Tournament created:', newTournament);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create tournament:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create tournament'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
          color: '#000',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        Create New Tournament
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <TournamentForm
          venues={venues}
          isLoadingVenues={isLoadingVenues}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          mode="create"
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateTournamentForm;
