import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Collapse,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as AcknowledgeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { Alert as AlertType } from '../../types/monitoring';
import { gameMetricsMonitor } from '../../utils/monitoring';

interface AlertPanelProps {
  gameId?: string;
  onAlertAcknowledge?: (alert: AlertType) => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  gameId,
  onAlertAcknowledge,
}) => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [acknowledgeNote, setAcknowledgeNote] = useState('');

  useEffect(() => {
    // Subscribe to alerts
    const unsubscribe = gameMetricsMonitor.subscribeToAlerts((alert: AlertType) => {
      setAlerts(prev => [alert, ...prev].slice(0, 100)); // Keep last 100 alerts
    });

    return () => unsubscribe();
  }, []);

  const handleExpandClick = (alertId: string) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId);
  };

  const handleAcknowledgeClick = (alert: AlertType) => {
    setSelectedAlert(alert);
    setAcknowledgeDialogOpen(true);
  };

  const handleAcknowledgeConfirm = () => {
    if (selectedAlert) {
      const acknowledgedAlert = {
        ...selectedAlert,
        acknowledged: true,
        details: {
          ...selectedAlert.details,
          acknowledgeNote,
          acknowledgeTime: Date.now(),
        },
      };

      onAlertAcknowledge?.(acknowledgedAlert);
      setAlerts(prev =>
        prev.map(a => (a.id === selectedAlert.id ? acknowledgedAlert : a))
      );

      setAcknowledgeDialogOpen(false);
      setAcknowledgeNote('');
      setSelectedAlert(null);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getAlertsByType = () => {
    return alerts.reduce(
      (acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Active Alerts
        </Typography>

        {/* Alert Summary */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          {Object.entries(getAlertsByType()).map(([severity, count]) => (
            <Chip
              key={severity}
              icon={getSeverityIcon(severity)}
              label={`${severity}: ${count}`}
              color={severity as 'error' | 'warning' | 'info'}
            />
          ))}
        </Box>

        {/* Alert List */}
        <List>
          {alerts.map(alert => (
            <React.Fragment key={alert.id}>
              <ListItem
                sx={{
                  bgcolor: alert.acknowledged
                    ? 'action.selected'
                    : 'background.paper',
                }}
              >
                <ListItemIcon>{getSeverityIcon(alert.severity)}</ListItemIcon>
                <ListItemText
                  primary={alert.message}
                  secondary={formatTimestamp(alert.timestamp)}
                />
                <Box display="flex" alignItems="center" gap={1}>
                  {!alert.acknowledged && (
                    <IconButton
                      size="small"
                      onClick={() => handleAcknowledgeClick(alert)}
                      title="Acknowledge"
                    >
                      <AcknowledgeIcon />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleExpandClick(alert.id)}
                  >
                    {expandedAlert === alert.id ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                </Box>
              </ListItem>
              <Collapse in={expandedAlert === alert.id} timeout="auto" unmountOnExit>
                <Box p={2}>
                  <Alert severity={alert.severity as 'error' | 'warning' | 'info'}>
                    <Typography variant="subtitle2" gutterBottom>
                      Alert Details
                    </Typography>
                    <Box component="pre" sx={{ mt: 1, overflow: 'auto' }}>
                      {JSON.stringify(alert.details, null, 2)}
                    </Box>
                    {alert.acknowledged && alert.details?.acknowledgeNote && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Acknowledgment Note
                        </Typography>
                        <Typography variant="body2">
                          {alert.details.acknowledgeNote}
                        </Typography>
                        <Typography variant="caption" display="block" mt={1}>
                          Acknowledged at: {formatTimestamp(alert.details.acknowledgeTime)}
                        </Typography>
                      </Box>
                    )}
                  </Alert>
                </Box>
              </Collapse>
            </React.Fragment>
          ))}
        </List>

        {/* Acknowledge Dialog */}
        <Dialog
          open={acknowledgeDialogOpen}
          onClose={() => setAcknowledgeDialogOpen(false)}
        >
          <DialogTitle>Acknowledge Alert</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Acknowledgment Note"
              fullWidth
              multiline
              rows={4}
              value={acknowledgeNote}
              onChange={e => setAcknowledgeNote(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAcknowledgeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAcknowledgeConfirm} variant="contained">
              Acknowledge
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}; 