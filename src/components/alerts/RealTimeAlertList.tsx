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

const Row = React.memo(({ data, index, style }: ListChildComponentProps<AlertListData>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const alert = data.alerts[index];
  if (!alert) return null;

  const alertType = alert.type.toLowerCase();
  const severity = alertType === 'error' || alertType === 'warning' || alertType === 'info' || alertType === 'success'
    ? alertType as 'error' | 'warning' | 'info' | 'success'
    : 'info';

  return (
    <Box 
      role="article"
      aria-label={`Alert ${alert.message}`}
      style={style}
      sx={{
        p: { xs: 0.5, sm: 1 },
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <MuiAlert 
        severity={severity}
        icon={false}
        sx={{ width: '100%' }}
      >
        <Box 
          display="flex" 
          flexDirection={isMobile ? 'column' : 'row'} 
          justifyContent="space-between" 
          alignItems={isMobile ? 'flex-start' : 'center'}
          gap={isMobile ? 1 : 0}
        >
          <Box flex={1}>
            <Typography 
              variant={isMobile ? 'body1' : 'subtitle1'} 
              component="div"
              sx={{ 
                wordBreak: 'break-word',
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {alert.message}
            </Typography>
            <Box 
              display="flex" 
              gap={0.5} 
              mt={0.5}
              flexWrap="wrap"
              alignItems="center"
            >
              <Chip 
                size="small" 
                label={alert.type} 
                sx={{ 
                  backgroundColor: getAlertColor(alert.type),
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }} 
              />
              <Chip 
                size="small" 
                label={alert.status} 
                sx={{ 
                  backgroundColor: getStatusColor(alert.status),
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }} 
              />
              <Typography 
                component="time" 
                dateTime={alert.timestamp}
                variant="caption"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                {new Date(alert.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: isMobile ? 1 : 0, width: isMobile ? '100%' : 'auto' }}>
            <AlertActions alert={alert} isMobile={isMobile} />
          </Box>
        </Box>
      </MuiAlert>
    </Box>
  );
}, (prevProps, nextProps) => {
  const prevAlert = prevProps.data.alerts[prevProps.index];
  const nextAlert = nextProps.data.alerts[nextProps.index];
  return prevAlert?.id === nextAlert?.id && 
         prevAlert?.status === nextAlert?.status &&
         prevAlert?.type === nextAlert?.type &&
         prevAlert?.message === nextAlert?.message;
});

Row.displayName = 'Row';

export const RealTimeAlertList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isConnected, connectionStatus, reconnectAttempt, send } = useWebSocketWithReconnect({
    initialDelay: 1000,
    maxDelay: 15000,
    maxAttempts: 5
  });
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [showOfflineNotification, setShowOfflineNotification] = React.useState(false);
  const [showMemoryWarning, setShowMemoryWarning] = React.useState(false);
  const offlineStorage = useMemo(() => OfflineStorageService.getInstance(), []);
  const memoryProfiler = useMemo(() => MemoryProfilerService.getInstance(), []);
  const alertsRef = useRef<Alert[]>([]);

  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  useEffect(() => {
    const cleanup = memoryProfiler.addListener((stats) => {
      const { warning, critical } = memoryProfiler.checkMemoryUsage();
      if (warning || critical) {
        setShowMemoryWarning(true);
        if (critical) {
          setAlerts(prev => prev.slice(-50));
        }
      }
    });

    memoryProfiler.startProfiling();

    return () => {
      cleanup();
      memoryProfiler.stopProfiling();
    };
  }, []);

  const batchUpdateTimeout = useRef<number | null>(null);
  const pendingUpdates = useRef<Array<{ alert: Alert; type: 'add' | 'update' | 'delete' }>>([]);

  const processBatchUpdates = useCallback(() => {
    if (pendingUpdates.current.length === 0) return;

    setAlerts(prev => {
      const updates = pendingUpdates.current;
      pendingUpdates.current = [];

      return updates.reduce((acc, { alert, type }) => {
        switch (type) {
          case 'add':
            return [alert, ...acc];
          case 'update':
            return acc.map(a => a.id === alert.id ? alert : a);
          case 'delete':
            return acc.filter(a => a.id !== alert.id);
          default:
            return acc;
        }
      }, [...prev]);
    });
  }, []);

  const queueUpdate = useCallback((update: { alert: Alert; type: 'add' | 'update' | 'delete' }) => {
    pendingUpdates.current.push(update);

    if (batchUpdateTimeout.current !== null) {
      window.clearTimeout(batchUpdateTimeout.current);
    }

    batchUpdateTimeout.current = window.setTimeout(() => {
      processBatchUpdates();
      batchUpdateTimeout.current = null;
    }, 100);
  }, [processBatchUpdates]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineActions();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const loadCachedAlerts = async () => {
      if (!isConnected) {
        const cachedAlerts = await offlineStorage.getCachedAlerts();
        if (cachedAlerts.length > 0) {
          setAlerts(cachedAlerts);
        }
      }
    };

    loadCachedAlerts();
  }, [isConnected]);

  useEffect(() => {
    if (isConnected && alerts.length > 0) {
      offlineStorage.cacheAlerts(alerts);
    }
  }, [isConnected, alerts]);

  const syncOfflineActions = async () => {
    if (isConnected) {
      const queuedActions = await offlineStorage.getQueuedActions();
      for (const action of queuedActions) {
        send({ type: `alert.${action.type}`, data: { id: action.alertId } });
      }
      await offlineStorage.clearQueuedActions();
    }
  };

  const handleAlertAction = async (type: 'acknowledge' | 'dismiss' | 'flag', id: string) => {
    if (isConnected) {
      send({ type: `alert.${type}`, data: { id } });
    } else {
      await offlineStorage.queueAction({
        type,
        alertId: id,
        timestamp: Date.now()
      });
      setAlerts(prev => prev.map(alert => 
        alert.id === id 
          ? { ...alert, status: type === 'acknowledge' ? 'ACKNOWLEDGED' : type === 'dismiss' ? 'DISMISSED' : alert.status }
          : alert
      ));
      setShowOfflineNotification(true);
    }
  };

  const handleAcknowledge = useCallback((id: string) => {
    handleAlertAction('acknowledge', id);
  }, [isConnected]);

  const handleDismiss = useCallback((id: string) => {
    handleAlertAction('dismiss', id);
  }, [isConnected]);

  const handleFlag = useCallback((id: string) => {
    handleAlertAction('flag', id);
  }, [isConnected]);

  useEffect(() => {
    const handleAlertUpdate = (data: { alert: Alert; type: 'add' | 'update' | 'delete' }) => {
      queueUpdate(data);
    };

    const subscription = send({ type: 'subscribe', channel: 'alerts' });
    
    return () => {
      if (subscription && typeof subscription === 'function') {
        subscription();
      }
      if (batchUpdateTimeout.current !== null) {
        window.clearTimeout(batchUpdateTimeout.current);
      }
    };
  }, [send, queueUpdate]);

  if (connectionStatus === 'reconnecting') {
    return (
      <Paper 
        elevation={3} 
        sx={{ height: '100%', p: 2 }}
        role="status"
        aria-label="Reconnecting to alert system"
      >
        <Typography gutterBottom>
          Reconnecting to alert system... (Attempt {reconnectAttempt})
        </Typography>
        <LinearProgress />
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
      >
        <Typography color="error">
          Disconnected from alert system. Please check your connection.
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper 
        elevation={3} 
        sx={{ 
          height: '100%', 
          overflow: 'hidden',
          borderRadius: { xs: 0, sm: 1 }
        }}
        role="region"
        aria-label="Real-time alerts"
      >
        {connectionStatus === 'reconnecting' ? (
          <Box p={isMobile ? 1 : 2}>
            <Typography 
              gutterBottom
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Reconnecting to alert system... (Attempt {reconnectAttempt})
            </Typography>
            <LinearProgress />
          </Box>
        ) : !isConnected && !isOffline ? (
          <Box p={isMobile ? 1 : 2}>
            <Typography 
              color="error"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Disconnected from alert system. Please check your connection.
            </Typography>
          </Box>
        ) : (
          <FixedSizeList
            height={isMobile ? window.innerHeight - 56 : 400}
            width="100%"
            itemCount={alerts.length}
            itemSize={isMobile ? 140 : 100}
            itemData={{
              alerts,
              onAcknowledge: handleAcknowledge,
              onDismiss: handleDismiss,
              onFlag: handleFlag
            }}
          >
            {Row}
          </FixedSizeList>
        )}
      </Paper>
      <Snackbar
        open={showOfflineNotification}
        autoHideDuration={6000}
        onClose={() => setShowOfflineNotification(false)}
        anchorOrigin={{ 
          vertical: isMobile ? 'top' : 'bottom', 
          horizontal: 'center' 
        }}
      >
        <MuiAlert 
          elevation={6} 
          variant="filled" 
          severity="warning"
          onClose={() => setShowOfflineNotification(false)}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {isOffline 
            ? "You're offline. Actions will be synced when connection is restored."
            : "Connection restored. Syncing offline actions..."}
        </MuiAlert>
      </Snackbar>
      <Snackbar
        open={showMemoryWarning}
        autoHideDuration={6000}
        onClose={() => setShowMemoryWarning(false)}
        anchorOrigin={{ 
          vertical: isMobile ? 'top' : 'bottom', 
          horizontal: 'center' 
        }}
      >
        <MuiAlert 
          elevation={6} 
          variant="filled" 
          severity="warning"
          onClose={() => setShowMemoryWarning(false)}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          High memory usage detected. Some older alerts may be cleared to improve performance.
        </MuiAlert>
      </Snackbar>
    </>
  );
}; 
}; 