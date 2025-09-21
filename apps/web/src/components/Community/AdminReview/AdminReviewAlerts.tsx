import { Alert, Box, Paper, Typography } from '@mui/material';
import React from 'react';

interface AdminReviewAlertsProps {
  error: string | null;
  success: string | null;
  onClearError: () => void;
  onClearSuccess: () => void;
}

const AdminReviewAlerts: React.FC<AdminReviewAlertsProps> = ({
  error,
  success,
  onClearError,
  onClearSuccess,
}) => {
  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={onClearError}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={onClearSuccess}
        >
          {success}
        </Alert>
      )}
    </>
  );
};

export default AdminReviewAlerts;
