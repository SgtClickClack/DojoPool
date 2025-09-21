import { Alert } from '@mui/material';
import React from 'react';

interface EventManagementAlertsProps {
  error: string | null;
  success: string | null;
  onClearError: () => void;
  onClearSuccess: () => void;
}

const EventManagementAlerts: React.FC<EventManagementAlertsProps> = ({
  error,
  success,
  onClearError,
  onClearSuccess,
}) => {
  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={onClearError}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={onClearSuccess}
        >
          {success}
        </Alert>
      )}
    </>
  );
};

export default EventManagementAlerts;
