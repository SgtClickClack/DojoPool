import { Alert, Snackbar } from '@mui/material';

interface ProfileInventoryNotificationProps {
  notification: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  };
  onClose: () => void;
}

export const ProfileInventoryNotification: React.FC<
  ProfileInventoryNotificationProps
> = ({ notification, onClose }) => {
  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={notification.severity}
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};
