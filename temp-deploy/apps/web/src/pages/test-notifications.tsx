import { useNotifications } from '@/contexts/NotificationContext';
import { websocketService } from '@/services/WebSocketService';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import React from 'react';

const TestNotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const sendTestNotification = () => {
    const testNotification = {
      type: 'new_notification',
      data: {
        id: `test-${Date.now()}`,
        type: 'challenge' as const,
        title: 'Test Challenge',
        message:
          'This is a test notification sent at ' +
          new Date().toLocaleTimeString(),
        isRead: false,
        userId: 'test-user',
        createdAt: new Date().toISOString(),
      },
    };

    // Simulate WebSocket event
    websocketService.emit('new_notification', testNotification);
  };

  const sendTournamentNotification = () => {
    const testNotification = {
      type: 'new_notification',
      data: {
        id: `tournament-${Date.now()}`,
        type: 'tournament' as const,
        title: 'Tournament Starting Soon',
        message: 'The Spring Championship begins in 30 minutes!',
        isRead: false,
        userId: 'test-user',
        createdAt: new Date().toISOString(),
      },
    };

    websocketService.emit('new_notification', testNotification);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Notification System Test Page
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Controls
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={sendTestNotification}
                  color="primary"
                >
                  Send Test Notification
                </Button>
                <Button
                  variant="contained"
                  onClick={sendTournamentNotification}
                  color="secondary"
                >
                  Send Tournament Notification
                </Button>
                <Button
                  variant="outlined"
                  onClick={fetchNotifications}
                  disabled={isLoading}
                >
                  Refresh Notifications
                </Button>
                <Button
                  variant="outlined"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark All as Read
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Typography variant="body2">
                <strong>Total Notifications:</strong> {totalCount}
              </Typography>
              <Typography variant="body2">
                <strong>Unread Count:</strong> {unreadCount}
              </Typography>
              <Typography variant="body2">
                <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body2">
                <strong>WebSocket Connected:</strong>{' '}
                {websocketService.getConnectionStatus() ? 'Yes' : 'No'}
              </Typography>
              {error && (
                <Typography variant="body2" color="error">
                  <strong>Error:</strong> {error}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Notifications ({notifications.length})
              </Typography>
              {notifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No notifications to display
                </Typography>
              ) : (
                <Box>
                  {notifications.map((notification) => (
                    <Box
                      key={notification.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: notification.isRead
                          ? 'transparent'
                          : 'action.hover',
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={notification.isRead ? 'normal' : 'bold'}
                      >
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Type: {notification.type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notification.isRead ? 'Read' : 'Unread'}
                        </Typography>
                      </Box>
                      {!notification.isRead && (
                        <Button
                          size="small"
                          onClick={() => markAsRead(notification.id)}
                          sx={{ mt: 1 }}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestNotificationsPage;
