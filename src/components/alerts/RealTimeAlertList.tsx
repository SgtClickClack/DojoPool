import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Chip, Paper, Typography, LinearProgress, Snackbar, useTheme, useMediaQuery } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { useWebSocketWithReconnect } from '../../hooks/useWebSocketWithReconnect';
import { AlertActions } from './AlertActions';
import { Alert, AlertType, AlertStatus } from '../../types/alert';
import { OfflineStorageService } from '../../services/OfflineStorageService';
import { MemoryProfilerService } from '../../services/MemoryProfilerService';

interface AlertListData {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  onFlag: (id: string) => void;
}

interface WebSocketMessage {
  type: string;
  payload: Alert;
}

interface WebSocketError {
  message: string;
}

const getAlertColor = (type: string) => {
  switch (type) {
    case 'ERROR':
      return 'error.main';
    case 'WARNING':
      return 'warning.main';
    case 'SUCCESS':
      return 'success.main';
    case 'INFO':
    default:
      return 'info.main';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'error.main';
    case 'ACKNOWLEDGED':
      return 'warning.main';
    case 'RESOLVED':
      return 'success.main';
    case 'DISMISSED':
    default:
      return 'text.disabled';
  }
};

const AlertItem = React.memo(({ 
  data, 
  index, 
  style 
}: ListChildComponentProps<AlertListData>) => {
  const { alerts, onAcknowledge, onDismiss, onFlag } = data;
  const alert = alerts[index];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
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
  }, [alert.id, onAcknowledge, onDismiss, onFlag]);

  return (
    <Box 
      style={style}
      role="listitem"
      aria-label={`Alert ${index + 1} of ${alerts.length}`}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 2,
          '&:focus-within': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px'
          }
        }}
        tabIndex={0}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1
          }}
        >
          <Box>
            <Typography 
              variant="h6" 
              component="h3"
              id={`alert-title-${alert.id}`}
            >
              {alert.title}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              id={`alert-timestamp-${alert.id}`}
            >
              {new Date(alert.timestamp).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={alert.type} 
              size="small"
              color={alert.type === 'error' ? 'error' : 
                     alert.type === 'warning' ? 'warning' : 
                     alert.type === 'success' ? 'success' : 'default'}
              aria-label={`Alert type: ${alert.type}`}
            />
            <Chip 
              label={alert.status} 
              size="small"
              color={alert.status === 'open' ? 'primary' : 
                     alert.status === 'acknowledged' ? 'info' : 'default'}
              aria-label={`Alert status: ${alert.status}`}
            />
          </Box>
        </Box>

        <Typography 
          variant="body1"
          id={`alert-message-${alert.id}`}
          aria-labelledby={`alert-title-${alert.id}`}
        >
          {alert.message}
        </Typography>

        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            mt: 2,
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}
        >
          <AlertActions
            alert={alert}
            onAcknowledge={onAcknowledge}
            onDismiss={onDismiss}
            onFlag={onFlag}
            onKeyPress={handleKeyPress}
          />
        </Box>
      </Paper>
    </Box>
  );
});

AlertItem.displayName = 'AlertItem';

export const RealTimeAlertList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const listRef = useRef<FixedSizeList>(null);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const {
    connect,
    disconnect,
    isConnected,
    connectionStatus,
    reconnectAttempt
  } = useWebSocketWithReconnect({
    endpoint: process.env.NEXT_PUBLIC_WS_URL || 'wss://api.dojopool.com/ws',
    onMessage: (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        if (data.type === 'alert') {
          setAlerts(prev => [data.payload, ...prev]);
          setSnackbar({
            open: true,
            message: 'New alert received',
            severity: 'info'
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    },
    onError: (error: WebSocketError) => {
      console.error('WebSocket error:', error);
      setSnackbar({
        open: true,
        message: 'Connection error. Attempting to reconnect...',
        severity: 'error'
      });
    },
    onReconnect: () => {
      setSnackbar({
        open: true,
        message: 'Reconnected successfully',
        severity: 'success'
      });
    }
  });

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleAcknowledge = useCallback((id: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id 
          ? { ...alert, status: 'acknowledged' as AlertStatus }
          : alert
      )
    );
    setSnackbar({
      open: true,
      message: 'Alert acknowledged',
      severity: 'success'
    });
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    setSnackbar({
      open: true,
      message: 'Alert dismissed',
      severity: 'success'
    });
  }, []);

  const handleFlag = useCallback((id: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id 
          ? { ...alert, isFlagged: !alert.isFlagged }
          : alert
      )
    );
    setSnackbar({
      open: true,
      message: 'Alert flag toggled',
      severity: 'info'
    });
  }, []);

  const listData = useMemo<AlertListData>(() => ({
    alerts,
    onAcknowledge: handleAcknowledge,
    onDismiss: handleDismiss,
    onFlag: handleFlag
  }), [alerts, handleAcknowledge, handleDismiss, handleFlag]);

  if (connectionStatus === 'reconnecting') {
    return (
      <Paper 
        elevation={3} 
        sx={{ height: '100%', p: 2 }}
        role="status"
        aria-label="Reconnecting to alert system"
        aria-live="polite"
      >
        <Typography gutterBottom>
          Reconnecting to alert system... (Attempt {reconnectAttempt})
        </Typography>
        <LinearProgress aria-label="Reconnection progress" />
      </Paper>
    );
  }

  if (!isConnected) {
    return (
      <Paper 
        elevation={3} 
        sx={{ height: '100%', p: 2 }}
        role="status"
        aria-label="Disconnected from alert system"
        aria-live="polite"
      >
        <Typography color="error">
          Disconnected from alert system. Please check your connection.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box 
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      role="region"
      aria-label="Real-time alert list"
    >
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <FixedSizeList
          ref={listRef}
          height={400}
          width="100%"
          itemCount={alerts.length}
          itemSize={150}
          itemData={listData}
          overscanCount={5}
          role="list"
          aria-label="List of alerts"
        >
          {AlertItem}
        </FixedSizeList>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          role="alert"
          aria-live="polite"
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}; 