import { useAuth } from '@/hooks/useAuth';
import challengeService, {
  ChallengeRequest,
} from '@/services/challengeService';
import marketplaceService, { UserBalance } from '@/services/marketplaceService';
import { CoinIcon } from '@mui/icons-material/AttachMoney';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface ChallengeModalProps {
  open: boolean;
  onClose: () => void;
  challengedPlayerId: string;
  challengedPlayerName: string;
  onChallengeSent?: (challenge: any) => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  open,
  onClose,
  challengedPlayerId,
  challengedPlayerName,
  onChallengeSent,
}) => {
  const { user } = useAuth();
  const [wagerAmount, setWagerAmount] = useState<number>(0);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchUserBalance();
    }
  }, [open, user]);

  const fetchUserBalance = async () => {
    try {
      setIsBalanceLoading(true);
      const balance = await marketplaceService.getUserBalance();
      setUserBalance(balance);
    } catch (error) {
      console.error('Failed to fetch user balance:', error);
      setError('Failed to load your balance');
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const handleWagerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 0;
    setWagerAmount(Math.max(0, value));
    setError('');
  };

  const canAffordWager = (): boolean => {
    if (!userBalance || wagerAmount === 0) return true;
    return userBalance.dojoCoins >= wagerAmount;
  };

  const getWagerValidationError = (): string => {
    if (wagerAmount === 0) return '';
    if (!userBalance) return 'Unable to verify balance';
    if (userBalance.dojoCoins < wagerAmount) {
      return `Insufficient funds. You have ${userBalance.dojoCoins} DojoCoins`;
    }
    return '';
  };

  const handleSendChallenge = async () => {
    if (!canAffordWager()) {
      setError(getWagerValidationError());
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const challengeRequest: ChallengeRequest = {
        challengedPlayerId,
        wagerAmount: wagerAmount > 0 ? wagerAmount : undefined,
      };

      const response = await challengeService.sendMockChallenge(
        challengeRequest
      );

      if (response.success) {
        onChallengeSent?.(response.challenge);
        onClose();
        // Reset form
        setWagerAmount(0);
        setError('');
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setWagerAmount(0);
      setError('');
      onClose();
    }
  };

  const getWagerDisplayText = (): string => {
    if (wagerAmount === 0) return 'No wager (friendly match)';
    return `${wagerAmount} DojoCoins`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          🎯 Challenge Player
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            You are challenging <strong>{challengedPlayerName}</strong> to a
            match.
          </Typography>
        </Box>

        {/* User Balance Display */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Your Balance
          </Typography>
          {isBalanceLoading ? (
            <CircularProgress size={20} />
          ) : userBalance ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CoinIcon sx={{ color: '#ffd700' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {userBalance.dojoCoins.toLocaleString()} DojoCoins
              </Typography>
            </Box>
          ) : (
            <Typography color="error">Unable to load balance</Typography>
          )}
        </Box>

        {/* Wager Input */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Wager Amount (Optional)
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="DojoCoins to wager"
            value={wagerAmount || ''}
            onChange={handleWagerChange}
            disabled={isLoading}
            InputProps={{
              startAdornment: <CoinIcon sx={{ color: '#ffd700', mr: 1 }} />,
              endAdornment: (
                <Typography variant="body2" color="text.secondary">
                  DC
                </Typography>
              ),
            }}
            helperText={
              wagerAmount > 0
                ? `Total cost: ${wagerAmount} DojoCoins`
                : 'Enter 0 for a friendly match'
            }
            error={!!getWagerValidationError()}
          />
        </Box>

        {/* Wager Summary */}
        {wagerAmount > 0 && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: 'primary.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.200',
            }}
          >
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Wager Summary
            </Typography>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography>Wager Amount:</Typography>
              <Chip
                icon={<CoinIcon sx={{ color: '#ffd700' }} />}
                label={`${wagerAmount} DojoCoins`}
                color="primary"
                variant="outlined"
              />
            </Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 1 }}
            >
              <Typography>Remaining Balance:</Typography>
              <Typography
                variant="body2"
                color={canAffordWager() ? 'success.main' : 'error.main'}
              >
                {userBalance
                  ? (userBalance.dojoCoins - wagerAmount).toLocaleString()
                  : 'Unknown'}{' '}
                DojoCoins
              </Typography>
            </Box>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Challenge Preview */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Challenge Preview
          </Typography>
          <Typography variant="body2">
            You will challenge <strong>{challengedPlayerName}</strong> to a
            match
            {wagerAmount > 0 && (
              <>
                {' '}
                for <strong>{wagerAmount} DojoCoins</strong>
              </>
            )}
            .
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSendChallenge}
          variant="contained"
          color="primary"
          disabled={isLoading || !canAffordWager()}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
        >
          {isLoading
            ? 'Sending...'
            : `Send Challenge${wagerAmount > 0 ? ` (${wagerAmount} DC)` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChallengeModal;
