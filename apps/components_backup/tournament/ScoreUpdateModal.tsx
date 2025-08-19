import { EmojiEvents, SportsEsports } from '@mui/icons-material';
import {
  Alert,
  Box,
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
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface ScoreUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (scoreA: number, scoreB: number, winnerId: string) => void;
  match: {
    id: string;
    playerA: {
      id: string;
      username: string;
    };
    playerB: {
      id: string;
      username: string;
    };
  };
  isSubmitting?: boolean;
  error?: string | null;
}

const ScoreUpdateModal: React.FC<ScoreUpdateModalProps> = ({
  open,
  onClose,
  onSubmit,
  match,
  isSubmitting = false,
  error = null,
}) => {
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [winnerId, setWinnerId] = useState<string>('');

  const handleSubmit = () => {
    if (scoreA < 0 || scoreB < 0) {
      return;
    }
    if (!winnerId) {
      return;
    }
    onSubmit(scoreA, scoreB, winnerId);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setScoreA(0);
      setScoreB(0);
      setWinnerId('');
      onClose();
    }
  };

  const getWinnerOptions = () => {
    const options = [];

    if (scoreA > scoreB) {
      options.push({
        id: match.playerA.id,
        username: match.playerA.username,
        reason: 'Higher Score',
      });
    } else if (scoreB > scoreA) {
      options.push({
        id: match.playerB.id,
        username: match.playerB.username,
        reason: 'Higher Score',
      });
    } else {
      // Tie - both players are options
      options.push(
        {
          id: match.playerA.id,
          username: match.playerA.username,
          reason: 'Tie - Player Choice',
        },
        {
          id: match.playerB.id,
          username: match.playerB.username,
          reason: 'Tie - Player Choice',
        }
      );
    }

    return options;
  };

  const winnerOptions = getWinnerOptions();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
          color: '#000',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <SportsEsports />
        Update Match Score
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ color: '#00ff9d', mb: 2, fontWeight: 600 }}
          >
            {match.playerA.username} vs {match.playerB.username}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#888', mb: 1 }}>
            Enter the final scores for each player:
          </Typography>

          <Box display="flex" gap={2} alignItems="center">
            <Box flex={1}>
              <Typography variant="body2" sx={{ color: '#00ff9d', mb: 1 }}>
                {match.playerA.username}
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={scoreA}
                onChange={(e) =>
                  setScoreA(Math.max(0, parseInt(e.target.value) || 0))
                }
                placeholder="0"
                inputProps={{ min: 0 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: '#00ff9d',
                    },
                    '&:hover fieldset': {
                      borderColor: '#00a8ff',
                    },
                  },
                }}
              />
            </Box>

            <Typography variant="h5" sx={{ color: '#888', fontWeight: 600 }}>
              vs
            </Typography>

            <Box flex={1}>
              <Typography variant="body2" sx={{ color: '#00a8ff', mb: 1 }}>
                {match.playerB.username}
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={scoreB}
                onChange={(e) =>
                  setScoreB(Math.max(0, parseInt(e.target.value) || 0))
                }
                placeholder="0"
                inputProps={{ min: 0 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: '#00a8ff',
                    },
                    '&:hover fieldset': {
                      borderColor: '#00ff9d',
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#888', mb: 1 }}>
            Select the winner:
          </Typography>

          <FormControl fullWidth>
            <InputLabel sx={{ color: '#888' }}>Winner</InputLabel>
            <Select
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              sx={{
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#333',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#00ff9d',
                },
              }}
            >
              {winnerOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmojiEvents sx={{ color: '#ffd700', fontSize: 16 }} />
                    <Typography>{option.username}</Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: '#888', ml: 'auto' }}
                    >
                      {option.reason}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            p: 2,
            background: 'rgba(0, 255, 157, 0.1)',
            borderRadius: 1,
            border: '1px solid #00ff9d',
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: '#00ff9d', textAlign: 'center' }}
          >
            <strong>Note:</strong> After submitting the score, the tournament
            bracket will automatically advance to the next round.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            color: '#888',
            borderColor: '#333',
            '&:hover': {
              borderColor: '#666',
              color: '#fff',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !winnerId}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
            color: '#000',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
            },
            '&:disabled': {
              background: '#333',
              color: '#666',
            },
          }}
        >
          {isSubmitting ? 'Updating...' : 'Update Score'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScoreUpdateModal;
