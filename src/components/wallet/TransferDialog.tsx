import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { formatCurrency } from '../../utils/format';

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  onTransfer: (recipientId: number, amount: number, description: string) => Promise<void>;
  maxAmount: number;
}

export const TransferDialog: React.FC<TransferDialogProps> = ({
  open,
  onClose,
  onTransfer,
  maxAmount
}) => {
  const [recipientId, setRecipientId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    const recipientIdNum = parseInt(recipientId, 10);
    const amountNum = parseFloat(amount);

    if (isNaN(recipientIdNum)) {
      setError('Please enter a valid recipient ID');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum > maxAmount) {
      setError('Amount exceeds your available balance');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for the transfer');
      return;
    }

    try {
      setIsSubmitting(true);
      await onTransfer(recipientIdNum, amountNum, description.trim());
      handleClose();
    } catch (err) {
      setError('Transfer failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRecipientId('');
    setAmount('');
    setDescription('');
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  const cyberDialogStyle = {
    '& .MuiDialog-paper': {
      background: 'rgba(10, 10, 10, 0.95)',
      border: '1px solid #00ff9d',
      borderRadius: '15px',
      boxShadow: '0 0 30px rgba(0, 255, 157, 0.3), inset 0 0 30px rgba(0, 255, 157, 0.1)',
      backdropFilter: 'blur(10px)',
      color: '#fff',
      minWidth: '400px',
    }
  };

  const cyberTextFieldStyle = {
    '& .MuiOutlinedInput-root': {
      background: 'rgba(16, 24, 39, 0.8)',
      border: '1px solid rgba(0, 255, 157, 0.3)',
      borderRadius: '8px',
      color: '#fff',
      '&:hover': {
        borderColor: 'rgba(0, 255, 157, 0.5)',
        boxShadow: '0 0 10px rgba(0, 255, 157, 0.2)',
      },
      '&.Mui-focused': {
        borderColor: '#00ff9d',
        boxShadow: '0 0 15px rgba(0, 255, 157, 0.4)',
      },
      '& .MuiOutlinedInput-notchedOutline': {
        border: 'none',
      },
      '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-focused': {
          color: '#00ff9d',
        },
      },
      '& .MuiInputBase-input': {
        color: '#fff',
        '&::placeholder': {
          color: 'rgba(255, 255, 255, 0.5)',
        },
      },
    },
  };

  const cyberButtonStyle = {
    background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    padding: '10px 20px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
      background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
    },
    '&:disabled': {
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.5)',
      transform: 'none',
      boxShadow: 'none',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: '0.5s',
    },
    '&:hover::before': {
      left: '100%',
    }
  };

  const cancelButtonStyle = {
    background: 'rgba(255, 56, 96, 0.2)',
    border: '1px solid #ff3860',
    borderRadius: '8px',
    color: '#ff3860',
    padding: '10px 20px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    '&:hover': {
      background: 'rgba(255, 56, 96, 0.3)',
      boxShadow: '0 0 15px rgba(255, 56, 96, 0.3)',
      transform: 'translateY(-2px)',
    },
    '&:disabled': {
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.5)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      transform: 'none',
      boxShadow: 'none',
    },
  };

  const neonTextStyle = {
    color: '#fff',
    textShadow: '0 0 10px rgba(0, 255, 157, 0.8), 0 0 20px rgba(0, 255, 157, 0.4)',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth sx={cyberDialogStyle}>
      <DialogTitle sx={neonTextStyle}>
        Transfer Dojo Coins
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                textShadow: '0 0 5px rgba(0, 255, 157, 0.5)',
                fontWeight: 600
              }}
              gutterBottom
            >
              Available Balance: {formatCurrency(maxAmount, 'DP')}
            </Typography>
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                background: 'rgba(255, 56, 96, 0.2)',
                border: '1px solid #ff3860',
                color: '#ff3860',
                '& .MuiAlert-icon': {
                  color: '#ff3860',
                }
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            label="Recipient ID"
            type="number"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            fullWidth
            required
            sx={{ ...cyberTextFieldStyle, mb: 3 }}
          />

          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            required
            inputProps={{
              min: 0,
              max: maxAmount,
              step: 0.01
            }}
            sx={{ ...cyberTextFieldStyle, mb: 3 }}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            sx={cyberTextFieldStyle}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleClose} 
            disabled={isSubmitting}
            sx={cancelButtonStyle}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={cyberButtonStyle}
          >
            {isSubmitting ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 