import { useNotifications } from '@/contexts/NotificationContext';
import {
  Close as CloseIcon,
  DoneAll as MarkAllReadIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import React from 'react';

interface NotificationsProps {
  onClose?: () => void;
  compact?: boolean;
}

export const Notifications: React.FC<NotificationsProps> = ({
  onClose,
  compact = false,
}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'challenge':
      case 'challenge_received':
        return '⚔️';
      case 'match_result':
        return '🏆';
      case 'tournament_update':
      case 'tournament_invite':
        return '🎮';
      case 'achievement':
      case 'achievement_unlocked':
        return '🎯';
      case 'clan_invite':
      case 'clan_war_update':
        return '⚔️';
      case 'friend_request':
        return '🤝';
      case 'territory_changed':
        return '🏰';
      case 'venue_checkin':
        return '📍';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load notifications: {error}
      </Alert>
    );
  }

  return (
    <Card
      sx={{
        width: compact ? 350 : 400,
        maxHeight: 500,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: 3,
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
        border: '1px solid #00d4ff',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid #00d4ff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="primary" max={99}>
            <NotificationsIcon sx={{ color: '#00d4ff' }} />
          </Badge>
          <Typography
            variant="h6"
            sx={{ color: '#00d4ff', fontWeight: 'bold' }}
          >
            Notifications
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {unreadCount > 0 && (
            <IconButton
              size="small"
              onClick={handleMarkAllRead}
              disabled={isLoading}
              sx={{ color: '#00d4ff' }}
            >
              <MarkAllReadIcon />
            </IconButton>
          )}
          {onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: '#00d4ff' }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Content */}
      <CardContent sx={{ flex: 1, p: 0, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              Loading notifications...
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              No notifications yet
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              You'll see updates here when things happen in your Dojo world
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 2,
                    backgroundColor: notification.isRead
                      ? 'transparent'
                      : 'rgba(0, 212, 255, 0.1)',
                    borderLeft: notification.isRead
                      ? 'none'
                      : '3px solid #00d4ff',
                    cursor: notification.isRead ? 'default' : 'pointer',
                    '&:hover': {
                      backgroundColor: notification.isRead
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 212, 255, 0.15)',
                    },
                  }}
                  onClick={() =>
                    !notification.isRead && handleMarkAsRead(notification.id)
                  }
                >
                  <Box sx={{ mr: 2, fontSize: '1.5rem' }}>
                    {getNotificationIcon(notification.type)}
                  </Box>

                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: notification.isRead ? '#b0b0b0' : '#ffffff',
                          fontWeight: notification.isRead ? 'normal' : 'bold',
                          mb: 0.5,
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: notification.isRead ? '#888' : '#cccccc',
                            lineHeight: 1.3,
                            mb: 1,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#666',
                            fontSize: '0.7rem',
                          }}
                        >
                          {formatTimestamp(notification.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />

                  {!notification.isRead && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#00d4ff',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </ListItem>
                {index < notifications.length - 1 && (
                  <Divider sx={{ bgcolor: 'rgba(0, 212, 255, 0.2)' }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>

      {/* Footer */}
      {notifications.length > 0 && !compact && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 212, 255, 0.2)' }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={onClose}
            sx={{
              color: '#00d4ff',
              borderColor: '#00d4ff',
              '&:hover': {
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
              },
            }}
          >
            View All Notifications
          </Button>
        </Box>
      )}
    </Card>
  );
};

export default Notifications;
