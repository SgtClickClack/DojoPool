import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Build,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Inventory,
  HealthAndSafety,
  Analytics,
  Add,
  Edit,
  Delete,
  Visibility,
  Refresh,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  CalendarToday,
  Person,
  Business,
} from '@mui/icons-material';
import {
  EquipmentManagementService,
  type Equipment,
  type EquipmentInventory,
  type MaintenanceTask,
  type EquipmentAlert,
  type PerformanceMetrics,
} from '../../services/venue/EquipmentManagementService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`equipment-tabpanel-${index}`}
      aria-labelledby={`equipment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EquipmentManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [inventory, setInventory] = useState<EquipmentInventory | null>(null);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(
    []
  );
  const [alerts, setAlerts] = useState<EquipmentAlert[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetrics[]
  >([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState('v1');
  const [addEquipmentDialog, setAddEquipmentDialog] = useState(false);
  const [scheduleMaintenanceDialog, setScheduleMaintenanceDialog] =
    useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );

  const equipmentService = EquipmentManagementService.getInstance();

  useEffect(() => {
    const interval = setInterval(() => {
      setEquipment(equipmentService.getEquipment(selectedVenue));
      setInventory(equipmentService.getInventory(selectedVenue));
      setMaintenanceTasks(
        equipmentService.getMaintenanceSchedule(selectedVenue)
      );
      setAlerts(equipmentService.getCriticalAlerts(selectedVenue));
      setPerformanceMetrics(
        equipmentService.getPerformanceMetrics(selectedVenue)
      );
      setIsConnected(equipmentService.getConnectionStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, [equipmentService, selectedVenue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'offline':
        return 'error';
      case 'retired':
        return 'default';
      default:
        return 'default';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'success';
    if (health >= 60) return 'warning';
    return 'error';
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getOverdueTasks = () => {
    return maintenanceTasks.filter((task) => task.status === 'overdue');
  };

  const getUpcomingTasks = () => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return maintenanceTasks.filter(
      (task) =>
        task.nextDue >= now &&
        task.nextDue <= weekFromNow &&
        task.status !== 'completed'
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main' }}>
          Equipment Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            icon={isConnected ? <CheckCircle /> : <Error />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddEquipmentDialog(true)}
            sx={{
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF5252, #26A69A)',
              },
            }}
          >
            Add Equipment
          </Button>
        </Box>
      </Box>

      {/* Connection Status */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Equipment Management Service is disconnected. Some features may be
          limited.
        </Alert>
      )}

      {/* Inventory Summary */}
      {inventory && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Equipment
                </Typography>
                <Typography variant="h4">{inventory.totalEquipment}</Typography>
                <Typography variant="body2">
                  Total Value: {formatCurrency(inventory.totalValue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Operational
                </Typography>
                <Typography variant="h4">
                  {inventory.operationalEquipment}
                </Typography>
                <Typography variant="body2">
                  {(
                    (inventory.operationalEquipment /
                      inventory.totalEquipment) *
                    100
                  ).toFixed(1)}
                  % of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Maintenance
                </Typography>
                <Typography variant="h4">
                  {inventory.maintenanceEquipment}
                </Typography>
                <Typography variant="body2">
                  Monthly Cost: {formatCurrency(inventory.maintenanceCost)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Critical Alerts
                </Typography>
                <Typography variant="h4">{alerts.length}</Typography>
                <Typography variant="body2">Requires attention</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Content */}
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="equipment management tabs"
          >
            <Tab icon={<Inventory />} label="Inventory" />
            <Tab icon={<HealthAndSafety />} label="Health" />
            <Tab icon={<Schedule />} label="Maintenance" />
            <Tab icon={<Analytics />} label="Performance" />
            <Tab icon={<Warning />} label="Alerts" />
          </Tabs>
        </Box>

        {/* Inventory Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Equipment Inventory</Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer
            component={Paper}
            sx={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Health</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Last Maintenance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipment.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{eq.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {eq.serialNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={eq.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={eq.status}
                        color={getStatusColor(eq.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={eq.health.overallHealth}
                          color={getHealthColor(eq.health.overallHealth) as any}
                          sx={{ width: 60 }}
                        />
                        <Typography variant="body2">
                          {eq.health.overallHealth}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{eq.location}</TableCell>
                    <TableCell>
                      {eq.maintenance.lastMaintenance
                        ? formatDate(eq.maintenance.lastMaintenance)
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedEquipment(eq)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Schedule Maintenance">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedEquipment(eq);
                              setScheduleMaintenanceDialog(true);
                            }}
                          >
                            <Build />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Health Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Equipment Health Overview
          </Typography>

          <Grid container spacing={3}>
            {equipment.map((eq) => (
              <Grid item xs={12} sm={6} md={4} key={eq.id}>
                <Card
                  sx={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: `2px solid ${eq.health.overallHealth >= 80 ? '#4caf50' : eq.health.overallHealth >= 60 ? '#ff9800' : '#f44336'}`,
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">{eq.name}</Typography>
                      <Chip
                        label={`${eq.health.overallHealth}%`}
                        color={getHealthColor(eq.health.overallHealth) as any}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Temperature: {eq.health.temperature}°C
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Uptime: {Math.floor(eq.health.uptime / 3600)}h{' '}
                        {Math.floor((eq.health.uptime % 3600) / 60)}m
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Last Check: {formatDate(eq.health.lastCheck)}
                      </Typography>
                    </Box>

                    {eq.health.alerts.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Active Alerts (
                          {eq.health.alerts.filter((a) => !a.resolved).length})
                        </Typography>
                        {eq.health.alerts.slice(0, 2).map((alert) => (
                          <Chip
                            key={alert.id}
                            label={alert.message}
                            color={getAlertColor(alert.type) as any}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Maintenance Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h6">Maintenance Schedule</Typography>
            <Button
              variant="contained"
              startIcon={<Schedule />}
              onClick={() => setScheduleMaintenanceDialog(true)}
            >
              Schedule Maintenance
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Overdue Tasks */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background:
                    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Overdue Tasks ({getOverdueTasks().length})
                  </Typography>
                  <List>
                    {getOverdueTasks()
                      .slice(0, 5)
                      .map((task) => (
                        <ListItem key={task.id}>
                          <ListItemIcon>
                            <Warning color="error" />
                          </ListItemIcon>
                          <ListItemText
                            primary={task.name}
                            secondary={`Due: ${formatDate(task.nextDue)}`}
                          />
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Tasks */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background:
                    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upcoming Tasks ({getUpcomingTasks().length})
                  </Typography>
                  <List>
                    {getUpcomingTasks()
                      .slice(0, 5)
                      .map((task) => (
                        <ListItem key={task.id}>
                          <ListItemIcon>
                            <CalendarToday color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={task.name}
                            secondary={`Due: ${formatDate(task.nextDue)}`}
                          />
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* All Tasks */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    All Maintenance Tasks
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Task</TableCell>
                          <TableCell>Equipment</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {maintenanceTasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>{task.name}</TableCell>
                            <TableCell>{task.description}</TableCell>
                            <TableCell>
                              <Chip
                                label={task.status}
                                color={
                                  task.status === 'overdue'
                                    ? 'error'
                                    : task.status === 'completed'
                                      ? 'success'
                                      : 'warning'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{formatDate(task.nextDue)}</TableCell>
                            <TableCell>{task.estimatedDuration} min</TableCell>
                            <TableCell>
                              <Button size="small" variant="outlined">
                                Complete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Performance Metrics
          </Typography>

          <Grid container spacing={3}>
            {performanceMetrics.map((metrics, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Overview
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">Utilization</Typography>
                        <Typography variant="body2">
                          {metrics.utilization}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metrics.utilization}
                        color={
                          metrics.utilization >= 80
                            ? 'success'
                            : metrics.utilization >= 60
                              ? 'warning'
                              : 'error'
                        }
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">Efficiency</Typography>
                        <Typography variant="body2">
                          {metrics.efficiency}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metrics.efficiency}
                        color={
                          metrics.efficiency >= 80
                            ? 'success'
                            : metrics.efficiency >= 60
                              ? 'warning'
                              : 'error'
                        }
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">Reliability</Typography>
                        <Typography variant="body2">
                          {metrics.reliability}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metrics.reliability}
                        color={
                          metrics.reliability >= 80
                            ? 'success'
                            : metrics.reliability >= 60
                              ? 'warning'
                              : 'error'
                        }
                      />
                    </Box>

                    <Typography variant="body2" color="textSecondary">
                      Last Updated: {formatDate(metrics.lastUpdated)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Alerts Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Critical Alerts
          </Typography>

          {alerts.length === 0 ? (
            <Alert severity="success">
              No critical alerts at this time. All equipment is operating
              normally.
            </Alert>
          ) : (
            <List>
              {alerts.map((alert) => (
                <ListItem key={alert.id} sx={{ mb: 2 }}>
                  <Card
                    sx={{
                      width: '100%',
                      background:
                        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="h6" color="error">
                            {alert.message}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {formatDate(alert.timestamp)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              equipmentService.acknowledgeAlert(
                                alert.id,
                                alert.id
                              )
                            }
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() =>
                              equipmentService.resolveAlert(alert.id, alert.id)
                            }
                          >
                            Resolve
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </Card>

      {/* Add Equipment Dialog */}
      <Dialog
        open={addEquipmentDialog}
        onClose={() => setAddEquipmentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Equipment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Equipment Name" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Equipment Type</InputLabel>
                <Select label="Equipment Type">
                  <MenuItem value="table">Pool Table</MenuItem>
                  <MenuItem value="camera">Camera</MenuItem>
                  <MenuItem value="sensor">Sensor</MenuItem>
                  <MenuItem value="display">Display</MenuItem>
                  <MenuItem value="processor">Processor</MenuItem>
                  <MenuItem value="network">Network</MenuItem>
                  <MenuItem value="lighting">Lighting</MenuItem>
                  <MenuItem value="climate">Climate Control</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Serial Number" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Model" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Manufacturer" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Location" />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Installation Date"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddEquipmentDialog(false)}>Cancel</Button>
          <Button variant="contained">Add Equipment</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog
        open={scheduleMaintenanceDialog}
        onClose={() => setScheduleMaintenanceDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Schedule Maintenance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Maintenance Task Name" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={3} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select label="Frequency">
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Duration (minutes)"
                type="number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Instructions" multiline rows={4} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scheduled Date"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleMaintenanceDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained">Schedule Maintenance</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EquipmentManagement;
