import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert as MuiAlert,
  Collapse,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { Alert } from "../../alerts/AlertManager";
import { TransitionGroup } from "react-transition-group";

interface AlertsPanelProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onDismiss,
}) => {
  const sortedAlerts = [...alerts].sort((a, b) => {
    // Sort by severity (critical first) then by timestamp (newest first)
    if (a.type === b.type) {
      return b.timestamp - a.timestamp;
    }
    return a.type === "critical" ? -1 : 1;
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Active Alerts {alerts.length > 0 && `(${alerts.length})`}
      </Typography>
      <List>
        <TransitionGroup>
          {sortedAlerts.map((alert) => (
            <Collapse key={alert.id}>
              <ListItem
                sx={{
                  mb: 1,
                  "&:last-child": { mb: 0 },
                }}
              >
                <MuiAlert
                  severity={alert.type === "critical" ? "error" : "warning"}
                  action={
                    onDismiss && (
                      <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={() => onDismiss(alert.id)}
                      >
                        <CloseIcon fontSize="inherit" />
                      </IconButton>
                    )
                  }
                  sx={{ width: "100%" }}
                >
                  <ListItemText
                    primary={alert.message}
                    secondary={
                      <>
                        Threshold: {alert.threshold} | Value:{" "}
                        {alert.value.toFixed(2)} |{" "}
                        {new Date(alert.timestamp).toLocaleString()}
                      </>
                    }
                  />
                </MuiAlert>
              </ListItem>
            </Collapse>
          ))}
        </TransitionGroup>
        {alerts.length === 0 && (
          <ListItem>
            <ListItemText
              primary="No active alerts"
              secondary="The system is operating normally"
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
};
