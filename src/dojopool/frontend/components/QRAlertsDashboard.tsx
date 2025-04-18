import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { api } from "../services/api";

interface QRAlertsDashboardProps {
  venueId?: string;
  tableId?: string;
  onExport?: () => void;
}

interface AlertData {
  id: number;
  type: string;
  severity: string;
  message: string;
  venue_id?: string;
  table_id?: string;
  timestamp: string;
  details: any;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export const QRAlertsDashboard: React.FC<QRAlertsDashboardProps> = ({
  venueId,
  tableId,
  onExport,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [venueId, tableId, severityFilter, acknowledgedFilter, refreshInterval]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/qr/alerts", {
        params: {
          venue_id: venueId,
          table_id: tableId,
          severity: severityFilter !== "all" ? severityFilter : undefined,
          include_acknowledged: acknowledgedFilter,
        },
      });
      setAlerts(response.data);
    } catch (error) {
      console.error("Error loading alerts:", error);
      enqueueSnackbar("Failed to load alerts", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alert: AlertData) => {
    try {
      await api.post(`/qr/alerts/${alert.id}/acknowledge`);
      enqueueSnackbar("Alert acknowledged", { variant: "success" });
      loadAlerts();
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      enqueueSnackbar("Failed to acknowledge alert", { variant: "error" });
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/qr/export", {
        params: {
          venue_id: venueId,
          table_id: tableId,
          format: "json",
          include_errors: true,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `qr_alerts_${new Date().toISOString()}.json`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      enqueueSnackbar("Alerts exported successfully", { variant: "success" });
    } catch (error) {
      console.error("Error exporting alerts:", error);
      enqueueSnackbar("Failed to export alerts", { variant: "error" });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <ErrorIcon color="error" />;
      case "error":
        return <ErrorIcon color="error" />;
      case "warning":
        return <WarningIcon color="warning" />;
      case "info":
        return <InfoIcon color="info" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "error";
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <FormControl size="small">
          <InputLabel>Severity</InputLabel>
          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            label="Severity"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={acknowledgedFilter}
            onChange={(e) => setAcknowledgedFilter(e.target.value as boolean)}
            label="Status"
          >
            <MenuItem value={false}>Active</MenuItem>
            <MenuItem value={true}>All</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Refresh</InputLabel>
          <Select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value as number)}
            label="Refresh"
          >
            <MenuItem value={30}>30 seconds</MenuItem>
            <MenuItem value={60}>1 minute</MenuItem>
            <MenuItem value={300}>5 minutes</MenuItem>
          </Select>
        </FormControl>

        <Box flex={1} />

        <IconButton onClick={loadAlerts} title="Refresh">
          <RefreshIcon />
        </IconButton>

        <IconButton onClick={handleExport} title="Export">
          <DownloadIcon />
        </IconButton>
      </Box>

      {/* Alert Summary */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Alerts
              </Typography>
              <Typography variant="h4">{alerts.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Critical/Error
              </Typography>
              <Typography variant="h4" color="error">
                {
                  alerts.filter((a) =>
                    ["critical", "error"].includes(a.severity),
                  ).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Warnings
              </Typography>
              <Typography variant="h4" color="warning">
                {alerts.filter((a) => a.severity === "warning").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Unacknowledged
              </Typography>
              <Typography variant="h4">
                {alerts.filter((a) => !a.acknowledged).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Severity</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow
                key={alert.id}
                sx={{
                  backgroundColor: alert.acknowledged
                    ? "inherit"
                    : "action.hover",
                }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getSeverityIcon(alert.severity)}
                    <Typography>{alert.severity.toUpperCase()}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{alert.type}</TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>
                  {new Date(alert.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={alert.acknowledged ? "Acknowledged" : "Active"}
                    color={alert.acknowledged ? "success" : "warning"}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedAlert(alert);
                      setDetailsOpen(true);
                    }}
                  >
                    Details
                  </Button>
                  {!alert.acknowledged && (
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleAcknowledge(alert)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Alert Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {getSeverityIcon(selectedAlert.severity)}
                Alert Details
              </Box>
            </DialogTitle>

            <DialogContent>
              <Alert
                severity={getSeverityColor(selectedAlert.severity) as any}
                sx={{ mb: 2 }}
              >
                <AlertTitle>{selectedAlert.type}</AlertTitle>
                {selectedAlert.message}
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Timestamp
                  </Typography>
                  <Typography>
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </Typography>
                </Grid>

                {selectedAlert.venue_id && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Venue ID
                    </Typography>
                    <Typography>{selectedAlert.venue_id}</Typography>
                  </Grid>
                )}

                {selectedAlert.table_id && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Table ID
                    </Typography>
                    <Typography>{selectedAlert.table_id}</Typography>
                  </Grid>
                )}

                {selectedAlert.acknowledged && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Acknowledged By
                      </Typography>
                      <Typography>{selectedAlert.acknowledged_by}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Acknowledged At
                      </Typography>
                      <Typography>
                        {new Date(
                          selectedAlert.acknowledged_at!,
                        ).toLocaleString()}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>

              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Details
                </Typography>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(selectedAlert.details, null, 2)}
                </pre>
              </Box>
            </DialogContent>

            <DialogActions>
              {!selectedAlert.acknowledged && (
                <Button
                  color="primary"
                  onClick={() => {
                    handleAcknowledge(selectedAlert);
                    setDetailsOpen(false);
                  }}
                >
                  Acknowledge
                </Button>
              )}
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
