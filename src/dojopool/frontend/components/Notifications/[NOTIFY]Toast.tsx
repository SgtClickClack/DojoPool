import {
  Alert,
  type AlertColor,
  Box,
  Snackbar,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';

interface ToastProps {
  autoHideDuration?: number;
}

export const Toast: React.FC<ToastProps> = ({ autoHideDuration = 6000 }) => {
  const { notifications, removeNotification } = useNotifications();
  const activeNotification = notifications[0]; // Show only the first notification

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    if (activeNotification) {
      removeNotification(activeNotification.id);
    }
  };

  if (!activeNotification) {
    return null;
  }

  return (
    <Snackbar
      open={!!activeNotification}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={activeNotification.type as AlertColor}
        variant="filled"
        elevation={6}
        sx={{ width: '100%', minWidth: '300px' }}
      >
        <Box>
          {activeNotification.title && (
            <Typography
              variant="subtitle2"
              component="div"
              sx={{ fontWeight: 'bold' }}
            >
              {activeNotification.title}
            </Typography>
          )}
          <Typography variant="body2">{activeNotification.message}</Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};
