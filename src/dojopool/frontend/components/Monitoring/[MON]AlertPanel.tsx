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

export const AlertPanel: React.FC<AlertPanelProps> = ({ gameId, onAlertAcknowledge }) => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [acknowledgeNote, setAcknowledgeNote] = useState('');

  useEffect(() => {
    // Subscribe to alerts
    const unsubscribe = gameMetricsMonitor.subscribeToAlerts((alert: AlertType) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 100)); // Keep last 100 alerts
    });

    // Return cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  const handleExpandClick = (alertId: string) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId);
  };

  const handleAcknowledgeClick = (alert: AlertType) => {
    setSelectedAlert(alert);
    setAcknowledgeDialogOpen(true);
  };

  const handleAcknowledgeConfirm = () => {
    if (selectedAlert && gameId) {
      gameMetricsMonitor.acknowledgeAlert(selectedAlert.id, gameId);
      if (onAlertAcknowledge) {
        onAlertAcknowledge(selectedAlert);
      }
    }
    setAcknowledgeDialogOpen(false);
    setSelectedAlert(null);
    setAcknowledgeNote('');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatTimestamp = (timestamp: Date | number) => {
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  const getAlertsByType = () => {
    const result: Record<string, AlertType[]> = {};
    alerts.forEach((alert) => {
      if (!result[alert.type]) {
        result[alert.type] = [];
      }
      result[alert.type].push(alert);
    });
    return result;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Active Alerts
        </Typography>

        {Object.entries(getAlertsByType()).map(([type, typeAlerts]) => (
          <Box key={type} mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              {type.charAt(0).toUpperCase() + type.slice(1)} Alerts
            </Typography>
            <List>
              {typeAlerts.map((alert) => (
                <React.Fragment key={alert.id}>
                  <ListItem
                    secondaryAction={
                      <Box display="flex" alignItems="center" gap={1}>
                        {!alert.acknowledged && (
                          <IconButton
                            edge="end"
                            onClick={() => handleAcknowledgeClick(alert)}
                            size="small"
                          >
                            <AcknowledgeIcon />
                          </IconButton>
                        )}
                        <IconButton
                          edge="end"
                          onClick={() => handleExpandClick(alert.id)}
                          size="small"
                        >
                          {expandedAlert === alert.id ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemIcon>{getSeverityIcon(alert.severity)}</ListItemIcon>
                    <ListItemText
                      primary={alert.message}
                      secondary={formatTimestamp(alert.timestamp)}
                    />
                  </ListItem>
                  <Collapse in={expandedAlert === alert.id} timeout="auto" unmountOnExit>
                    <Box pl={9} pr={2} pb={2}>
                      <Alert severity={alert.severity as any}>
                        <Typography variant="subtitle2" gutterBottom>
                          Alert Details
                        </Typography>
                        <pre>{JSON.stringify(alert.details, null, 2)}</pre>
                        {alert.acknowledged && (
                          <Box mt={1}>
                            <Typography variant="caption" display="block">
                              Acknowledged by: {alert.acknowledgedBy}
                            </Typography>
                            <Typography variant="caption" display="block">
                              At: {formatTimestamp(alert.acknowledgedAt!)}
                            </Typography>
                          </Box>
                        )}
                      </Alert>
                    </Box>
                  </Collapse>
                </React.Fragment>
              ))}
            </List>
          </Box>
        ))}

        <Dialog
          open={acknowledgeDialogOpen}
          onClose={() => setAcknowledgeDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Acknowledge Alert</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Are you sure you want to acknowledge this alert?
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Note (optional)"
              fullWidth
              multiline
              rows={3}
              value={acknowledgeNote}
              onChange={(e) => setAcknowledgeNote(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAcknowledgeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAcknowledgeConfirm} variant="contained" color="primary">
              Acknowledge
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
