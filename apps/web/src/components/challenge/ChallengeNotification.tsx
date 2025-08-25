import challengeService, { Challenge } from '@/services/challengeService';
import { Cancel, CheckCircle } from '@mui/icons-material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney.js';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface ChallengeNotificationProps {
  challenge: Challenge;
  onChallengeAccepted?: (challenge: Challenge) => void;
  onChallengeDeclined?: (challenge: Challenge) => void;
  onClose?: () => void;
}

export const ChallengeNotification: React.FC<ChallengeNotificationProps> = ({
  challenge,
  onChallengeAccepted,
  onChallengeDeclined,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string>('');

  const handleAcceptClick = () => {
    if (challenge.wagerAmount && challenge.wagerAmount > 0) {
      setShowConfirmDialog(true);
    } else {
      handleAcceptChallenge();
    }
  };

  const handleAcceptChallenge = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const response = await challengeService.acceptMockChallenge(challenge.id);

      if (response.success) {
        onChallengeAccepted?.(challenge);
        onClose?.();
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to accept challenge');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineChallenge = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const response = await challengeService.declineChallenge(challenge.id);

      if (response.success) {
        onChallengeDeclined?.(challenge);
        onClose?.();
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to decline challenge');
    } finally {
      setIsProcessing(false);
    }
  };

  const getWagerDisplay = () => {
    if (!challenge.wagerAmount || challenge.wagerAmount === 0) {
      return (
        <Chip
          label="Friendly Match"
          color="success"
          variant="outlined"
          size="small"
        />
      );
    }

    return (
      <Box display="flex" alignItems="center" gap={1}>
        <AttachMoneyIcon sx={{ color: '#ffd700', fontSize: 16 }} />
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {challenge.wagerAmount} DojoCoins
        </Typography>
      </Box>
    );
  };

  const getChallengeMessage = () => {
    const baseMessage = `${challenge.challengerUsername} challenges you to a match`;

    if (challenge.wagerAmount && challenge.wagerAmount > 0) {
      return `${baseMessage} for ${challenge.wagerAmount} DojoCoins!`;
    }

    return `${baseMessage}!`;
  };

  return (
    <>
      <Card sx={{ mb: 2, border: '1px solid', borderColor: 'primary.200' }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={2}
          >
            <Box flex={1}>
              <Typography variant="h6" gutterBottom>
                🎯 New Challenge
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {getChallengeMessage()}
              </Typography>

              <Box display="flex" gap={1} alignItems="center" mb={2}>
                {getWagerDisplay()}
                <Typography variant="caption" color="text.secondary">
                  Expires: {new Date(challenge.expiresAt).toLocaleString()}
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="success"
              startIcon={
                isProcessing ? <CircularProgress size={16} /> : <CheckCircle />
              }
              onClick={handleAcceptClick}
              disabled={isProcessing}
              fullWidth
            >
              {isProcessing ? 'Processing...' : 'Accept Challenge'}
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={
                isProcessing ? <CircularProgress size={16} /> : <Cancel />
              }
              onClick={handleDeclineChallenge}
              disabled={isProcessing}
              fullWidth
            >
              {isProcessing ? 'Processing...' : 'Decline'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Wager Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogTitle>🎯 Confirm Wager Challenge</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to accept a challenge from{' '}
            <strong>{challenge.challengerUsername}</strong>.
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'warning.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'warning.200',
            }}
          >
            <Typography variant="subtitle1" color="warning.main" gutterBottom>
              ⚠️ Wager Amount: {challenge.wagerAmount ?? 0} DojoCoins
            </Typography>
            <Typography variant="body2" color="text.secondary">
              By accepting this challenge, you agree to wager{' '}
              {challenge.wagerAmount ?? 0} DojoCoins. The winner will receive
              the total pot of {(challenge.wagerAmount ?? 0) * 2} DojoCoins.
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ mt: 2 }}>
            Are you sure you want to accept this challenge?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAcceptChallenge}
            variant="contained"
            color="success"
            startIcon={
              isProcessing ? <CircularProgress size={16} /> : <CheckCircle />
            }
            disabled={isProcessing}
          >
            Accept & Confirm Wager
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChallengeNotification;
