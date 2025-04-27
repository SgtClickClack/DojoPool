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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transfer Coins</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Available Balance: {formatCurrency(maxAmount, 'DP')}
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
            sx={{ mb: 2 }}
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
            sx={{ mb: 2 }}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            multiline
            rows={2}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 