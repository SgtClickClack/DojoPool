import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Notifications,
  NotificationsOff,
  CloudSync,
  CloudOff,
  Wifi,
  WifiOff,
  Settings,
  Refresh,
  Download,
  Upload,
  Smartphone,
  Tablet,
  Laptop,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import tournamentMobileService, {
  MobileSettings,
  MobileNotification,
  SyncStatus,
} from '../../services/tournament/TournamentMobileService';

interface TournamentMobileIntegrationProps {
  tournamentId?: string;
}

const CyberpunkCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
  border: `2px solid ${alpha('#00ff88', 0.3)}`,
  borderRadius: 12,
  boxShadow: `0 0 20px ${alpha('#00ff88', 0.2)}`,
  backdropFilter: 'blur(10px)',
  '&:hover': {
    boxShadow: `0 0 30px ${alpha('#00ff88', 0.4)}`,
  },
}));

const NeonButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, #00ff88 30%, #00ccff 90%)`,
  border: 'none',
  borderRadius: 8,
  color: '#000',
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: `0 0 15px ${alpha('#00ff88', 0.5)}`,
  '&:hover': {
    background: `linear-gradient(45deg, #00ff88 10%, #00ccff 100%)`,
    boxShadow: `0 0 25px ${alpha('#00ff88', 0.7)}`,
  },
}));

const NotificationItem = styled(ListItem)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.7),
  borderRadius: 8,
  marginBottom: 8,
  border: `1px solid ${alpha('#00ff88', 0.2)}`,
  '&:hover': {
    background: alpha(theme.palette.background.paper, 0.9),
    border: `1px solid ${alpha('#00ff88', 0.4)}`,
  },
}));

export const TournamentMobileIntegration: React.FC<TournamentMobileIntegrationProps> = ({
  tournamentId,
}) => {
  const theme = useTheme();
  const [settings, setSettings] = useState<MobileSettings | null>(null);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  useEffect(() => {
    // Load initial data
    setSettings(tournamentMobileService.getSettings());
    setNotifications(tournamentMobileService.getNotifications());
    setSyncStatus(tournamentMobileService.getSyncStatus());
    setIsOnline(tournamentMobileService.isOnlineStatus());

    // Subscribe to updates
    const unsubscribeSettings = tournamentMobileService.subscribe('settings_updated', (newSettings) => {
      setSettings(newSettings);
    });

    const unsubscribeNotifications = tournamentMobileService.subscribe('notification_received', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    const unsubscribeSync = tournamentMobileService.subscribe('sync_status_changed', (status) => {
      setSyncStatus(status);
    });

    const unsubscribeOnline = tournamentMobileService.subscribe('online_status_changed', (status) => {
      setIsOnline(status.isOnline);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeNotifications();
      unsubscribeSync();
      unsubscribeOnline();
    };
  }, []);

  const handleSettingChange = (category: keyof MobileSettings, setting: string, value: any) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value,
      },
    };

    tournamentMobileService.updateSettings(newSettings);
  };

  const handleSync = async () => {
    setLoading(true);
    await tournamentMobileService.syncData();
    setLoading(false);
  };

  const handleNotificationPermission = async () => {
    await tournamentMobileService.requestNotificationPermission();
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    tournamentMobileService.markNotificationAsRead(notificationId);
    setNotifications(tournamentMobileService.getNotifications());
  };

  const handleClearNotifications = () => {
    tournamentMobileService.clearAllNotifications();
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tournament_start':
        return <CheckCircle sx={{ color: neonColors.primary }} />;
      case 'match_update':
        return <Info sx={{ color: neonColors.info }} />;
      case 'bracket_progress':
        return <CheckCircle sx={{ color: neonColors.warning }} />;
      case 'stream_start':
        return <Info sx={{ color: neonColors.secondary }} />;
      case 'achievement':
        return <CheckCircle sx={{ color: neonColors.primary }} />;
      case 'reminder':
        return <Warning sx={{ color: neonColors.warning }} />;
      default:
        return <Info sx={{ color: neonColors.info }} />;
    }
  };

  if (!settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress sx={{ color: neonColors.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Smartphone sx={{ color: neonColors.primary, mr: 2, fontSize: 32 }} />
        <Typography variant="h5" sx={{ color: neonColors.primary, fontWeight: 'bold' }}>
          Mobile Integration
        </Typography>
      </Box>

      {/* Connection Status */}
      <CyberpunkCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {isOnline ? (
              <Wifi sx={{ color: neonColors.primary, mr: 1 }} />
            ) : (
              <WifiOff sx={{ color: neonColors.error, mr: 1 }} />
            )}
            <Typography variant="h6" sx={{ color: isOnline ? neonColors.primary : neonColors.error }}>
              {isOnline ? 'Online' : 'Offline'}
            </Typography>
          </Box>

          {syncStatus && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label={`Last Sync: ${syncStatus.lastSync.toLocaleTimeString()}`}
                size="small"
                sx={{ background: neonColors.info, color: '#000' }}
              />
              {syncStatus.pendingChanges > 0 && (
                <Chip
                  label={`${syncStatus.pendingChanges} pending changes`}
                  size="small"
                  sx={{ background: neonColors.warning, color: '#000' }}
                />
              )}
              {syncStatus.syncInProgress && (
                <CircularProgress size={20} sx={{ color: neonColors.primary }} />
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <NeonButton
              startIcon={<Refresh />}
              onClick={handleSync}
              disabled={syncStatus?.syncInProgress || !isOnline}
              size="small"
            >
              Sync Now
            </NeonButton>
            <NeonButton
              startIcon={<Download />}
              onClick={() => tournamentMobileService.cacheTournamentData([], [])}
              disabled={!isOnline}
              size="small"
              sx={{ background: `linear-gradient(45deg, ${neonColors.info} 30%, ${neonColors.primary} 90%)` }}
            >
              Cache Data
            </NeonButton>
          </Box>

          {syncStatus?.error && (
            <Alert severity="error" sx={{ mt: 2, background: neonColors.error, color: '#fff' }}>
              {syncStatus.error}
            </Alert>
          )}
        </CardContent>
      </CyberpunkCard>

      {/* Push Notifications */}
      <CyberpunkCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Notifications sx={{ color: neonColors.secondary, mr: 1 }} />
            <Typography variant="h6" sx={{ color: neonColors.secondary, flex: 1 }}>
              Push Notifications
            </Typography>
            <IconButton onClick={handleNotificationPermission} sx={{ color: neonColors.info }}>
              <Settings />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications.tournamentUpdates}
                  onChange={(e) => handleSettingChange('pushNotifications', 'tournamentUpdates', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.primary,
                    },
                  }}
                />
              }
              label="Tournament Updates"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications.matchResults}
                  onChange={(e) => handleSettingChange('pushNotifications', 'matchResults', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.primary,
                    },
                  }}
                />
              }
              label="Match Results"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications.streamAlerts}
                  onChange={(e) => handleSettingChange('pushNotifications', 'streamAlerts', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.primary,
                    },
                  }}
                />
              }
              label="Stream Alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications.achievements}
                  onChange={(e) => handleSettingChange('pushNotifications', 'achievements', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.primary,
                    },
                  }}
                />
              }
              label="Achievements"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications.reminders}
                  onChange={(e) => handleSettingChange('pushNotifications', 'reminders', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.primary,
                    },
                  }}
                />
              }
              label="Reminders"
            />
          </Box>
        </CardContent>
      </CyberpunkCard>

      {/* Offline Mode */}
      <CyberpunkCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CloudSync sx={{ color: neonColors.warning, mr: 1 }} />
            <Typography variant="h6" sx={{ color: neonColors.warning }}>
              Offline Mode
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.offlineMode.enabled}
                  onChange={(e) => handleSettingChange('offlineMode', 'enabled', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.primary,
                    },
                  }}
                />
              }
              label="Enable Offline Mode"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.offlineMode.autoSync}
                  onChange={(e) => handleSettingChange('offlineMode', 'autoSync', e.target.checked)}
                  disabled={!settings.offlineMode.enabled}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.primary,
                    },
                  }}
                />
              }
              label="Auto Sync"
            />
          </Box>
        </CardContent>
      </CyberpunkCard>

      {/* Performance Settings */}
      <CyberpunkCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Settings sx={{ color: neonColors.info, mr: 1 }} />
            <Typography variant="h6" sx={{ color: neonColors.info }}>
              Performance
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.performance.lowDataMode}
                  onChange={(e) => handleSettingChange('performance', 'lowDataMode', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.primary,
                    },
                  }}
                />
              }
              label="Low Data Mode"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.performance.autoPlayVideos}
                  onChange={(e) => handleSettingChange('performance', 'autoPlayVideos', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.primary,
                    },
                  }}
                />
              }
              label="Auto-play Videos"
            />
          </Box>
        </CardContent>
      </CyberpunkCard>

      {/* Recent Notifications */}
      <CyberpunkCard>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Notifications sx={{ color: neonColors.secondary, mr: 1 }} />
            <Typography variant="h6" sx={{ color: neonColors.secondary, flex: 1 }}>
              Recent Notifications
            </Typography>
            <IconButton onClick={handleClearNotifications} size="small" sx={{ color: neonColors.error }}>
              <NotificationsOff />
            </IconButton>
          </Box>

          {notifications.length === 0 ? (
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center', py: 2 }}>
              No notifications yet
            </Typography>
          ) : (
            <List dense>
              {notifications.slice(0, 5).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  onClick={() => handleMarkNotificationRead(notification.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {notification.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                  />
                  {!notification.read && (
                    <Chip
                      label="New"
                      size="small"
                      sx={{ background: neonColors.error, color: '#fff', fontSize: '0.7rem' }}
                    />
                  )}
                </NotificationItem>
              ))}
            </List>
          )}
        </CardContent>
      </CyberpunkCard>
    </Box>
  );
}; 