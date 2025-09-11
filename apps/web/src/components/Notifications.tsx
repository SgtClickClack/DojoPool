import { useNotifications } from '@/contexts/NotificationContext';
import {
  Close as CloseIcon,
  DoneAll as MarkAllReadIcon,
  Notifications as NotificationsIcon,
  PlayArrow as PlayIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
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
import { useTheme } from '@mui/material/styles';
import React from 'react';

interface NotificationsProps {
  onClose?: () => void;
  compact?: boolean;
}

export const Notifications: React.FC<NotificationsProps> = ({
  onClose,
  compact = false,
}) => {
  const theme = useTheme();
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

  const getNotificationIcon = (type: string): JSX.Element => {
    switch (type.toLowerCase()) {
      case 'challenge':
      case 'challenge_received':
        return (
          <PlayIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
        );
      case 'match_result':
      case 'tournament_win':
        return (
          <TrophyIcon
            sx={{ color: theme.palette.success.main, fontSize: 20 }}
          />
        );
      case 'tournament_update':
      case 'tournament_invite':
      case 'tournament_started':
        return (
          <PlayIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
        );
      case 'achievement':
      case 'achievement_unlocked':
        return (
          <TrophyIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
        );
      case 'battle_pass':
      case 'battle_pass_unlocked':
      case 'battle_pass_progress':
        return (
          <StarIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
        );
      case 'clan_invite':
      case 'clan_war_update':
        return (
          <PlayIcon
            sx={{ color: theme.palette.secondary.main, fontSize: 20 }}
          />
        );
      case 'friend_request':
        return (
          <TrophyIcon
            sx={{ color: theme.palette.success.main, fontSize: 20 }}
          />
        );
      case 'territory_changed':
        return (
          <PlayIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
        );
      case 'venue_checkin':
        return (
          <TrophyIcon
            sx={{ color: theme.palette.primary.main, fontSize: 20 }}
          />
        );
      case 'system':
        return (
          <NotificationsIcon
            sx={{ color: theme.palette.error.main, fontSize: 20 }}
          />
        );
      default:
        return (
          <NotificationsIcon
            sx={{ color: theme.palette.primary.main, fontSize: 20 }}
          />
        );
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
        background: theme.cyberpunk.gradients.card,
        border: `1px solid ${theme.palette.primary.main}`,
        boxShadow: `0 0 20px ${theme.palette.primary.main}30`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.primary.main}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="primary" max={99}>
            <NotificationsIcon sx={{ color: theme.palette.primary.main }} />
          </Badge>
          <Typography
            variant="h6"
            sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}
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
              sx={{ color: theme.palette.primary.main }}
            >
              <MarkAllReadIcon />
            </IconButton>
          )}
          {onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: theme.palette.primary.main }}
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
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Loading notifications...
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              No notifications yet
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.disabled }}
            >
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
                      : `${theme.palette.primary.main}20`,
                    borderLeft: notification.isRead
                      ? 'none'
                      : `3px solid ${theme.palette.primary.main}`,
                    cursor: notification.isRead ? 'default' : 'pointer',
                    '&:hover': {
                      backgroundColor: notification.isRead
                        ? 'rgba(255, 255, 255, 0.05)'
                        : `${theme.palette.primary.main}30`,
                    },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() =>
                    !notification.isRead && handleMarkAsRead(notification.id)
                  }
                >
                  <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                    {getNotificationIcon(notification.type)}
                  </Box>

                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: notification.isRead
                            ? theme.palette.text.secondary
                            : theme.palette.text.primary,
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
                            color: notification.isRead
                              ? theme.palette.text.disabled
                              : theme.palette.text.secondary,
                            lineHeight: 1.3,
                            mb: 1,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.disabled,
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
                        backgroundColor: theme.palette.primary.main,
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${theme.palette.primary.main}80`,
                      }}
                    />
                  )}
                </ListItem>
                {index < notifications.length - 1 && (
                  <Divider
                    sx={{ bgcolor: `${theme.palette.primary.main}30` }}
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>

      {/* Footer */}
      {notifications.length > 0 && !compact && (
        <Box
          sx={{ p: 2, borderTop: `1px solid ${theme.palette.primary.main}30` }}
        >
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={onClose}
            sx={{
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: `${theme.palette.primary.main}20`,
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
