import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Notifications,
  CheckCircle,
  Error,
  Info,
  Warning,
  Bell,
  BellOff,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useTournamentNotifications } from '../hooks/useTournamentNotifications';

interface TournamentNotificationsProps {
  tournamentId: string;
}

const TournamentNotifications: React.FC<TournamentNotificationsProps> = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { tournament, loading, error } = useTournament(tournamentId);
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    loading: notificationsLoading,
    error: notificationsError,
    unreadCount,
  } = useTournamentNotifications(tournamentId);
  const [tab, setTab] = React.useState(0);
  const [selectedNotification, setSelectedNotification] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setDialogOpen(true);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  if (loading || notificationsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notificationsError) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error || notificationsError}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Tournament Notifications
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournament Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  max={99}
                  sx={{ mb: 1 }}
                >
                  <Bell color="primary" sx={{ fontSize: 40 }} />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {notifications.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Notifications
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {notifications.filter((n) => n.read).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Read
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Error color="error" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {notifications.filter((n) => !n.read).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unread
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Info color="info" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {notifications.filter((n) => n.type === 'info').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Info
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ p: 2 }}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<Bell />} label="All" />
          <Tab icon={<BellOff />} label="Unread" />
          <Tab icon={<CheckCircle />} label="Read" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {tab === 0 && (
          <Grid container spacing={3}>
            {notifications.map((notification) => (
              <Grid item xs={12} key={notification.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">
                        {notification.title}
                      </Typography>
                      <IconButton
                        onClick={() => handleMarkAsRead(notification.id)}
                        color={notification.read ? 'primary' : 'error'}
                      >
                        <CheckCircle />
                      </IconButton>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Type: {notification.type}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 1 && (
          <Grid container spacing={3}>
            {notifications
              .filter((n) => !n.read)
              .map((notification) => (
                <Grid item xs={12} key={notification.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6">
                          {notification.title}
                        </Typography>
                        <IconButton
                          onClick={() => handleMarkAsRead(notification.id)}
                          color="error"
                        >
                          <CheckCircle />
                        </IconButton>
                      </Box>
                      <Typography variant="body1" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(notification.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Type: {notification.type}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        )}

        {tab === 2 && (
          <Grid container spacing={3}>
            {notifications
              .filter((n) => n.read)
              .map((notification) => (
                <Grid item xs={12} key={notification.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6">
                          {notification.title}
                        </Typography>
                        <IconButton
                          onClick={() => handleMarkAsRead(notification.id)}
                          color="success"
                        >
                          <CheckCircle />
                        </IconButton>
                      </Box>
                      <Typography variant="body1" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(notification.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Type: {notification.type}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        )}
      </Box>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleMarkAllAsRead}
        sx={{ mt: 3 }}
      >
        Mark All as Read
      </Button>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>All Notifications Marked as Read</DialogTitle>
        <DialogContent>
          <Typography>
            All notifications have been marked as read. You can still view them in
            the read tab.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentNotifications;
