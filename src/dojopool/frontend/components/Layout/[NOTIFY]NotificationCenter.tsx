import { useState, useEffect, useCallback } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Collapse,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  CheckCircle as ReadIcon,
  Delete as ClearIcon,
  NotificationsActive as ActiveIcon,
  NotificationsOff as MutedIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import notificationService from '../../services/notification';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter = ({ className }: NotificationCenterProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState(notificationService.getNotifications());
  const [unreadCount, setUnreadCount] = useState(notificationService.getUnreadCount());
  const [preferences, setPreferences] = useState(notificationService.getPreferences());
  const [showSettings, setShowSettings] = useState(false);

  const handleNotificationUpdate = useCallback((state) => {
    setNotifications(state.notifications);
    setUnreadCount(state.unreadCount);
    setPreferences(state.preferences);
  }, []);

  useEffect(() => {
    const unsubscribe = notificationService.addListener(handleNotificationUpdate);
    return () => unsubscribe();
  }, [handleNotificationUpdate]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
  };

  const handleClearAll = async () => {
    await notificationService.clear();
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handlePreferenceChange = async (key: string, value: any) => {
    await notificationService.updatePreferences({
      ...preferences,
      [key]: value,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const renderNotification = (notification: any) => (
    <ListItem
      key={notification.id}
      button
      onClick={() => handleNotificationClick(notification)}
      sx={{
        opacity: notification.read ? 0.7 : 1,
        backgroundColor: notification.read ? 'transparent' : 'action.hover',
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: 'action.selected',
        },
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              flexGrow: 1,
              fontWeight: notification.read ? 'normal' : 'bold',
            }}
          >
            {notification.title}
          </Typography>
          <Chip
            size="small"
            label={notification.type}
            color={notification.type === 'error' ? 'error' : 'default'}
            sx={{ ml: 1 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {notification.message}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(notification.timestamp), {
              addSuffix: true,
            })}
          </Typography>
          {notification.priority && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: getPriorityColor(notification.priority),
              }}
            />
          )}
        </Box>
      </Box>
    </ListItem>
  );

  const renderSettings = () => (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Settings
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.enabled}
              onChange={(e) => handlePreferenceChange('enabled', e.target.checked)}
            />
          }
          label="Enable Notifications"
        />
        <FormControlLabel
          control={
            <Switch
              checked={preferences.pushNotifications}
              onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
            />
          }
          label="Push Notifications"
        />
        <FormControlLabel
          control={
            <Switch
              checked={preferences.emailNotifications}
              onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
            />
          }
          label="Email Notifications"
        />
        <FormControlLabel
          control={
            <Switch
              checked={preferences.soundEnabled}
              onChange={(e) => handlePreferenceChange('soundEnabled', e.target.checked)}
            />
          }
          label="Sound Enabled"
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Do Not Disturb
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.doNotDisturb.enabled}
                onChange={(e) =>
                  handlePreferenceChange('doNotDisturb', {
                    ...preferences.doNotDisturb,
                    enabled: e.target.checked,
                  })
                }
              />
            }
            label="Enable Do Not Disturb"
          />
          {preferences.doNotDisturb.enabled && (
            <Box sx={{ pl: 2, mt: 1 }}>
              <Typography variant="caption" display="block" gutterBottom>
                From {preferences.doNotDisturb.startTime} to {preferences.doNotDisturb.endTime}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        className={className}
        size={isMobile ? 'small' : 'medium'}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 400,
            maxHeight: '80vh',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Notifications
            </Typography>
            <Tooltip title="Settings">
              <IconButton size="small" onClick={handleSettingsClick}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={settingsAnchorEl}
              open={Boolean(settingsAnchorEl)}
              onClose={handleSettingsClose}
            >
              <MenuItem onClick={() => setShowSettings(!showSettings)}>
                Notification Settings
              </MenuItem>
              <MenuItem onClick={handleMarkAllAsRead}>Mark All as Read</MenuItem>
              <MenuItem onClick={handleClearAll}>Clear All</MenuItem>
            </Menu>
          </Box>
          <Collapse in={showSettings}>{renderSettings()}</Collapse>
          {notifications.length > 0 ? (
            <List
              sx={{
                maxHeight: showSettings ? '30vh' : '60vh',
                overflow: 'auto',
              }}
            >
              {notifications.map(renderNotification)}
            </List>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No notifications</Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationCenter;
