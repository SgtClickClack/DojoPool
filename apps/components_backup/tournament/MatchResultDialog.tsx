import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { type TournamentMatch } from '@/types/tournament';

interface MatchResultDialogProps {
  open: boolean;
  match: TournamentMatch | null;
  onClose: () => void;
  onSubmit: (matchId: string, winnerId: number) => Promise<void>;
}

const MatchResultDialog: React.FC<MatchResultDialogProps> = ({
  open,
  match,
  onClose,
  onSubmit,
}) => {
  const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWinnerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedWinnerId(Number(event.target.value));
  };

  const handleSubmit = async () => {
    if (!match || selectedWinnerId === null) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(match.id, selectedWinnerId);
      onClose();
    } catch (err) {
      console.error('Error submitting match result:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to submit match result'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when dialog opens with a new match
  React.useEffect(() => {
    if (open && match) {
      setSelectedWinnerId(null);
      setError(null);
    }
  }, [open, match]);

  if (!match) return null;

  const player1Name = match.player1Name || `Player ${match.player1Id}`;
  const player2Name = match.player2Name || `Player ${match.player2Id}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          background: 'rgba(10, 10, 10, 0.95)',
          border: '1px solid #00ff9d',
          borderRadius: '15px',
          boxShadow: '0 0 30px rgba(0, 255, 157, 0.2)',
          color: '#fff',
          minWidth: '350px',
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid rgba(0, 255, 157, 0.3)',
          color: '#00ff9d',
          textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
          fontWeight: 700,
          textAlign: 'center',
        }}
      >
        Report Match Result
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
          {player1Name} vs {player2Name}
        </Typography>

        <Typography
          variant="body1"
          sx={{ mb: 3, color: '#aaa', textAlign: 'center' }}
        >
          Select the winner of this match:
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid #ff4444',
              color: '#ff4444',
            }}
          >
            {error}
          </Alert>
        )}

        <RadioGroup
          value={selectedWinnerId || ''}
          onChange={handleWinnerChange}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <FormControlLabel
              value={match.player1Id}
              control={
                <Radio
                  sx={{
                    color: '#00a8ff',
                    '&.Mui-checked': {
                      color: '#00ff9d',
                    },
                  }}
                />
              }
              label={
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid rgba(0, 168, 255, 0.3)',
                    borderRadius: 2,
                    width: '100%',
                    transition: 'all 0.3s ease',
                    ...(selectedWinnerId === match.player1Id
                      ? {
                          borderColor: '#00ff9d',
                          background: 'rgba(0, 255, 157, 0.1)',
                          boxShadow: '0 0 15px rgba(0, 255, 157, 0.2)',
                        }
                      : {}),
                  }}
                >
                  <Typography sx={{ fontWeight: 'bold' }}>
                    {player1Name}
                  </Typography>
                </Box>
              }
              sx={{
                alignItems: 'flex-start',
                margin: 0,
              }}
              disabled={isSubmitting}
            />

            <FormControlLabel
              value={match.player2Id}
              control={
                <Radio
                  sx={{
                    color: '#00a8ff',
                    '&.Mui-checked': {
                      color: '#00ff9d',
                    },
                  }}
                />
              }
              label={
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid rgba(0, 168, 255, 0.3)',
                    borderRadius: 2,
                    width: '100%',
                    transition: 'all 0.3s ease',
                    ...(selectedWinnerId === match.player2Id
                      ? {
                          borderColor: '#00ff9d',
                          background: 'rgba(0, 255, 157, 0.1)',
                          boxShadow: '0 0 15px rgba(0, 255, 157, 0.2)',
                        }
                      : {}),
                  }}
                >
                  <Typography sx={{ fontWeight: 'bold' }}>
                    {player2Name}
                  </Typography>
                </Box>
              }
              sx={{
                alignItems: 'flex-start',
                margin: 0,
              }}
              disabled={isSubmitting}
            />
          </Box>
        </RadioGroup>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: '1px solid rgba(0, 255, 157, 0.3)',
          padding: '16px 24px',
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: '#888',
            '&:hover': {
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={selectedWinnerId === null || isSubmitting}
          sx={{
            background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
            color: '#000',
            fontWeight: 'bold',
            px: 3,
            '&:hover': {
              background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
              boxShadow: '0 0 15px rgba(0, 255, 157, 0.4)',
            },
            '&.Mui-disabled': {
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} sx={{ color: '#000' }} />
          ) : (
            'Submit Result'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MatchResultDialog;
