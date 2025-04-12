import React from 'react';
import { Button, Box } from '@mui/material';
import { Alert, AlertStatus } from '../../types/alert';

interface AlertActionsProps {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  onFlag: (id: string) => void;
  isLoading: boolean;
}

export const AlertActions: React.FC<AlertActionsProps> = ({
  alert,
  onAcknowledge,
  onDismiss,
  onFlag,
  isLoading
}) => {
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.currentTarget.getAttribute('data-action') === 'acknowledge') {
        onAcknowledge(alert.id);
      } else if (event.currentTarget.getAttribute('data-action') === 'dismiss') {
        onDismiss(alert.id);
      } else if (event.currentTarget.getAttribute('data-action') === 'flag') {
        onFlag(alert.id);
      }
    }
  };

  const handleAcknowledge = () => {
    onAcknowledge(alert.id);
  };

  const handleDismiss = () => {
    onDismiss(alert.id);
  };

  const handleFlag = () => {
    onFlag(alert.id);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {alert.status === 'open' && (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={handleAcknowledge}
          onKeyPress={handleKeyPress}
          data-action="acknowledge"
          disabled={isLoading}
          aria-label="Acknowledge alert"
        >
          Acknowledge
        </Button>
      )}
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        onClick={handleDismiss}
        onKeyPress={handleKeyPress}
        data-action="dismiss"
        disabled={isLoading}
        aria-label="Dismiss alert"
      >
        Dismiss
      </Button>
      <Button
        variant="outlined"
        color="error"
        size="small"
        onClick={handleFlag}
        onKeyPress={handleKeyPress}
        data-action="flag"
        disabled={isLoading}
        aria-label={alert.isFlagged ? "Unflag alert" : "Flag alert"}
      >
        {alert.isFlagged ? 'Unflag' : 'Flag'}
      </Button>
    </Box>
  );
}; 