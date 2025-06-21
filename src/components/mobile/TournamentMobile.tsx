import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  Slider,
  IconButton,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Notifications,
  NotificationsOff,
  CloudOff,
  CloudSync,
  Smartphone,
  Wifi,
  WifiOff,
  Storage,
  Settings,
  Sync,
  Clear,
  Download,
  Upload,
  ExpandMore,
  CheckCircle,
  Error,
  Warning,
  Info,
  Vibration,
  VolumeUp,
  VolumeOff,
  DarkMode,
  LightMode,
  Security,
  LocationOn,
  LocationOff,
  CameraAlt,
  CameraOff,
} from '@mui/icons-material';
import TournamentMobileService, {
  PushNotification,
  OfflineData,
  MobileConfig,
  DeviceInfo,
  SyncStatus,
} from '../../services/mobile/TournamentMobileService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mobile-tabpanel-${index}`}
      aria-labelledby={`mobile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentMobile: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState<MobileConfig | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const mobileService = TournamentMobileService.getInstance();

  useEffect(() => {
    const interval = setInterval(() => {
      setConfig(mobileService.getConfig());
      setDeviceInfo(mobileService.getDeviceInfo());
      setSyncStatus(mobileService.getSyncStatus());
      setNotifications(mobileService.getNotifications());
      setOfflineData(mobileService.getOfflineData());
      setIsOnline(mobileService.isOnline());
    }, 2000);

    return () => clearInterval(interval);
  }, [mobileService]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleConfigChange = (key: keyof MobileConfig, value: any) => {
    if (!config) return;
    
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    mobileService.updateConfig(newConfig);
  };

  const handleSync = async () => {
    setSyncing(true);
    await mobileService.syncData();
    setTimeout(() => setSyncing(false), 2000);
  };

  const handleClearCache = () => {
    mobileService.clearCache();
  };

  const handleMarkAsRead = (notificationId: string) => {
    mobileService.markNotificationAsRead(notificationId);
  };

  const handleClearNotifications = () => {
    mobileService.clearNotifications();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return <CheckCircle color="success" />;
      case 'match':
        return <Info color="info" />;
      case 'social':
        return <Warning color="warning" />;
      case 'achievement':
        return <CheckCircle color="primary" />;
      default:
        return <Info color="info" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'tournament':
        return '#00ff9d';
      case 'match':
        return '#00a8ff';
      case 'social':
        return '#feca57';
      case 'achievement':
        return '#ff6b6b';
      default:
        return '#888';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#00ff9d' }}>
          Mobile Integration
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#00a8ff', mb: 2 }}>
          Push notifications, offline capabilities, and mobile-specific features
        </Typography>
        
        <Alert 
          severity={isOnline ? 'success' : 'error'} 
          sx={{ mb: 2 }}
          icon={isOnline ? <Wifi /> : <WifiOff />}
        >
          {isOnline ? 'Online - Real-time sync enabled' : 'Offline - Using cached data'}
        </Alert>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ 
            '& .MuiTab-root': { 
              color: '#ffffff',
              '&.Mui-selected': { color: '#00ff9d' }
            }
          }}
        >
          <Tab label="Overview" icon={<Smartphone />} iconPosition="start" />
          <Tab label="Notifications" icon={<Notifications />} iconPosition="start" />
          <Tab label="Offline" icon={<CloudOff />} iconPosition="start" />
          <Tab label="Settings" icon={<Settings />} iconPosition="start" />
          <Tab label="Device" icon={<Info />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  Sync Status
                </Typography>
                
                {syncStatus && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        Last Sync: {formatDate(syncStatus.lastSync)}
                      </Typography>
                      <Chip 
                        label={syncStatus.isOnline ? 'Online' : 'Offline'} 
                        color={syncStatus.isOnline ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Sync Progress
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={syncStatus.syncProgress} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: '#333',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#00ff9d'
                          }
                        }} 
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        Pending Actions: {syncStatus.pendingActions}
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleSync}
                        disabled={syncing}
                        startIcon={syncing ? <CircularProgress size={16} /> : <Sync />}
                        sx={{
                          bgcolor: '#00ff9d',
                          color: '#000',
                          '&:hover': { bgcolor: '#00cc7d' },
                          '&:disabled': { bgcolor: '#333' }
                        }}
                      >
                        {syncing ? 'Syncing...' : 'Sync Now'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Quick Actions
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleClearCache}
                      sx={{
                        borderColor: '#00ff9d',
                        color: '#00ff9d',
                        '&:hover': { borderColor: '#00a8ff', color: '#00a8ff' }
                      }}
                    >
                      <Storage sx={{ mr: 1 }} />
                      Clear Cache
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleClearNotifications}
                      sx={{
                        borderColor: '#feca57',
                        color: '#feca57',
                        '&:hover': { borderColor: '#ff6b6b', color: '#ff6b6b' }
                      }}
                    >
                      <Clear sx={{ mr: 1 }} />
                      Clear Notifications
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                    Push Notifications
                  </Typography>
                  <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                    <Notifications />
                  </Badge>
                </Box>
                
                <List>
                  {notifications.length === 0 ? (
                    <ListItem>
                      <ListItemText 
                        primary="No notifications" 
                        sx={{ color: '#888', textAlign: 'center' }}
                      />
                    </ListItem>
                  ) : (
                    notifications.map((notification) => (
                      <React.Fragment key={notification.id}>
                        <ListItem 
                          sx={{ 
                            bgcolor: notification.read ? 'transparent' : 'rgba(0,255,157,0.1)',
                            borderRadius: 1,
                            mb: 1
                          }}
                        >
                          <ListItemIcon>
                            {getNotificationIcon(notification.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography sx={{ color: '#ffffff', fontWeight: notification.read ? 400 : 600 }}>
                                {notification.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography sx={{ color: '#888', mb: 1 }}>
                                  {notification.body}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                    {formatDate(notification.timestamp)}
                                  </Typography>
                                  <Chip 
                                    label={notification.type} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: getNotificationColor(notification.type),
                                      color: '#000',
                                      fontWeight: 600
                                    }}
                                  />
                                </Box>
                              </Box>
                            }
                          />
                          {!notification.read && (
                            <IconButton
                              onClick={() => handleMarkAsRead(notification.id)}
                              sx={{ color: '#00ff9d' }}
                            >
                              <CheckCircle />
                            </IconButton>
                          )}
                        </ListItem>
                        <Divider sx={{ bgcolor: '#333' }} />
                      </React.Fragment>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Offline Data
                </Typography>
                
                {offlineData && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Last Sync: {formatDate(offlineData.lastSync)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Tournaments: {offlineData.tournaments.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Matches: {offlineData.matches.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Pending Actions: {offlineData.pendingActions.length}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Cache Size: {formatBytes(config?.cacheSize || 0)}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((offlineData.tournaments.length + offlineData.matches.length) / 100 * 100, 100)} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: '#333',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#00a8ff'
                          }
                        }} 
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#feca57', mb: 2 }}>
                  Pending Actions
                </Typography>
                
                {offlineData?.pendingActions.length === 0 ? (
                  <Typography sx={{ color: '#888', textAlign: 'center' }}>
                    No pending actions
                  </Typography>
                ) : (
                  <List>
                    {offlineData?.pendingActions.slice(0, 5).map((action) => (
                      <ListItem key={action.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: '#ffffff', fontSize: '0.9rem' }}>
                              {action.type} {action.entity}
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>
                              {formatDate(action.timestamp)} • Retries: {action.retryCount}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 3 }}>
                  Mobile Settings
                </Typography>
                
                {config && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Accordion sx={{ bgcolor: 'transparent', color: '#ffffff' }}>
                        <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#00ff9d' }} />}>
                          <Typography sx={{ color: '#00ff9d' }}>Notifications</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={config.enablePushNotifications}
                                onChange={(e) => handleConfigChange('enablePushNotifications', e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#00ff9d',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#00ff9d',
                                  },
                                }}
                              />
                            }
                            label="Push Notifications"
                            sx={{ color: '#ffffff' }}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={config.enableHapticFeedback}
                                onChange={(e) => handleConfigChange('enableHapticFeedback', e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#00ff9d',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#00ff9d',
                                  },
                                }}
                              />
                            }
                            label="Haptic Feedback"
                            sx={{ color: '#ffffff' }}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={config.enableSoundEffects}
                                onChange={(e) => handleConfigChange('enableSoundEffects', e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#00ff9d',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#00ff9d',
                                  },
                                }}
                              />
                            }
                            label="Sound Effects"
                            sx={{ color: '#ffffff' }}
                          />
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Accordion sx={{ bgcolor: 'transparent', color: '#ffffff' }}>
                        <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#00ff9d' }} />}>
                          <Typography sx={{ color: '#00ff9d' }}>Offline & Sync</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={config.enableOfflineMode}
                                onChange={(e) => handleConfigChange('enableOfflineMode', e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#00ff9d',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#00ff9d',
                                  },
                                }}
                              />
                            }
                            label="Offline Mode"
                            sx={{ color: '#ffffff' }}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={config.enableBackgroundSync}
                                onChange={(e) => handleConfigChange('enableBackgroundSync', e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#00ff9d',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#00ff9d',
                                  },
                                }}
                              />
                            }
                            label="Background Sync"
                            sx={{ color: '#ffffff' }}
                          />
                          <Box sx={{ mt: 2 }}>
                            <Typography sx={{ color: '#888', mb: 1 }}>
                              Sync Interval: {config.syncInterval / 1000}s
                            </Typography>
                            <Slider
                              value={config.syncInterval / 1000}
                              onChange={(e, value) => handleConfigChange('syncInterval', (value as number) * 1000)}
                              min={10}
                              max={300}
                              sx={{
                                color: '#00ff9d',
                                '& .MuiSlider-thumb': {
                                  bgcolor: '#00ff9d',
                                },
                              }}
                            />
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Performance
                </Typography>
                
                {config && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Cache Size: {formatBytes(config.cacheSize)}
                      </Typography>
                      <Slider
                        value={config.cacheSize / (1024 * 1024)}
                        onChange={(e, value) => handleConfigChange('cacheSize', (value as number) * 1024 * 1024)}
                        min={10}
                        max={500}
                        sx={{
                          color: '#00a8ff',
                          '& .MuiSlider-thumb': {
                            bgcolor: '#00a8ff',
                          },
                        }}
                      />
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.dataCompression}
                          onChange={(e) => handleConfigChange('dataCompression', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#00a8ff',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#00a8ff',
                            },
                          }}
                        />
                      }
                      label="Data Compression"
                      sx={{ color: '#ffffff' }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  Device Information
                </Typography>
                
                {deviceInfo && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Platform: {deviceInfo.platform.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Version: {deviceInfo.version}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Device ID: {deviceInfo.deviceId}
                      </Typography>
                    </Box>
                    
                    <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                      Capabilities
                    </Typography>
                    
                    <Grid container spacing={1}>
                      {Object.entries(deviceInfo.capabilities).map(([key, value]) => (
                        <Grid item xs={6} key={key}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {value ? <CheckCircle color="success" /> : <Error color="error" />}
                            <Typography variant="body2" sx={{ color: '#ffffff', ml: 1 }}>
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#feca57', mb: 2 }}>
                  System Status
                </Typography>
                
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      {isOnline ? <Wifi color="success" /> : <WifiOff color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Network Connection"
                      secondary={isOnline ? 'Connected' : 'Disconnected'}
                      sx={{ color: '#ffffff' }}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      {config?.enableOfflineMode ? <CloudOff color="info" /> : <CloudSync color="warning" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Offline Mode"
                      secondary={config?.enableOfflineMode ? 'Enabled' : 'Disabled'}
                      sx={{ color: '#ffffff' }}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      {config?.enablePushNotifications ? <Notifications color="success" /> : <NotificationsOff color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Push Notifications"
                      secondary={config?.enablePushNotifications ? 'Enabled' : 'Disabled'}
                      sx={{ color: '#ffffff' }}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      {config?.enableBackgroundSync ? <Sync color="success" /> : <Error color="warning" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Background Sync"
                      secondary={config?.enableBackgroundSync ? 'Enabled' : 'Disabled'}
                      sx={{ color: '#ffffff' }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default TournamentMobile; 