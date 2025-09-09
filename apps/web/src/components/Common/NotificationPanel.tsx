import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification } from '@/types/notification';
import {
  Star as AchievementIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Group as ClanIcon,
  Close as CloseIcon,
  SportsEsports as GameIcon,
  Notifications as NotificationsIcon,
  Info as SystemIcon,
  EmojiEvents as TournamentIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Typography,
} from '@mui/material';
import React from 'react';

interface NotificationPanelProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  open,
  anchorEl,
  onClose,
}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearError,
  } = useNotifications();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'tournament':
        return <TournamentIcon color="primary" />;
      case 'clan':
        return <ClanIcon color="secondary" />;
      case 'challenge':
      case 'match_result':
        return <GameIcon color="success" />;
      case 'achievement':
        return <AchievementIcon color="warning" />;
      case 'system':
      default:
        return <SystemIcon color="info" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'tournament':
        return 'primary';
      case 'clan':
        return 'secondary';
      case 'challenge':
      case 'match_result':
        return 'success';
      case 'achievement':
        return 'warning';
      case 'system':
      default:
        return 'info';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    // Navigation implementation - placeholder
    onClose();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
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
          width: 400,
          maxHeight: 600,
          mt: 1,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div">
            Notifications
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {unreadCount > 0 && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleMarkAllAsRead}
              startIcon={<CheckCircleIcon />}
            >
              Mark all as read
            </Button>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <NotificationsIcon
              sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: notification.isRead
                    ? 'transparent'
                    : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  borderRadius: 1,
                  mb: 1,
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {notification.isRead ? (
                    <CircleIcon color="disabled" />
                  ) : (
                    <CircleIcon color="primary" />
                  )}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getNotificationIcon(notification.type)}
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.isRead ? 'normal' : 'bold',
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Chip
                        label={notification.type}
                        size="small"
                        color={
                          getNotificationColor(notification.type) as
                            | 'default'
                            | 'primary'
                            | 'secondary'
                            | 'error'
                            | 'info'
                            | 'success'
                            | 'warning'
                        }
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontWeight: notification.isRead ? 'normal' : 'medium',
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(notification.createdAt)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Popover>
  );
};

export default NotificationPanel;
