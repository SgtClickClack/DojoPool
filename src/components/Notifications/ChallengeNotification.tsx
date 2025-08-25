import { Alert, Box, Button, Snackbar, Stack, Typography } from '@mui/material';
import React from 'react';
import { respondToChallenge } from '../../services/APIService';
import { getTimeUntilExpiration } from '../../utils/challengeUtils';

interface ChallengeNotificationProps {
  open: boolean;
  challenge: {
    challengeId: string;
    challengerId: string;
    challengerName?: string;
    stakeCoins: number;
    expiresAt?: string;
  };
  onClose: () => void;
  onResponse: (challengeId: string, status: 'ACCEPTED' | 'DECLINED') => void;
}

export const ChallengeNotification: React.FC<ChallengeNotificationProps> = ({
  open,
  challenge,
  onClose,
  onResponse,
}) => {
  const handleAccept = async () => {
    try {
      await respondToChallenge(challenge.challengeId, 'ACCEPTED');
      onResponse(challenge.challengeId, 'ACCEPTED');
      onClose();
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  const handleDecline = async () => {
    try {
      await respondToChallenge(challenge.challengeId, 'DECLINED');
      onResponse(challenge.challengeId, 'DECLINED');
      onClose();
    } catch (error) {
      console.error('Error declining challenge:', error);
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={null}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity="info"
        variant="filled"
        elevation={6}
        sx={{ width: '100%', minWidth: '350px' }}
      >
        <Box>
          <Typography
            variant="subtitle2"
            component="div"
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            New Challenge!
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {challenge.challengerName || 'A player'} has challenged you to a
            match!
            {challenge.stakeCoins > 0 &&
              ` Stakes: ${challenge.stakeCoins} coins`}
          </Typography>

          {/* Expiration Information */}
          {challenge.expiresAt && (
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                color: 'white',
                fontWeight: 'medium',
                fontSize: '0.875rem',
              }}
            >
              ⏰ {getTimeUntilExpiration(challenge.expiresAt)}
            </Typography>
          )}

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={handleAccept}
            >
              Accept
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={handleDecline}
            >
              Decline
            </Button>
          </Stack>
        </Box>
      </Alert>
    </Snackbar>
  );
};
