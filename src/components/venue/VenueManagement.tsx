import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Slider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Business,
  Settings,
  Analytics,
  Build,
  Videocam,
  Sensors,
  DisplaySettings,
  TableBar,
  Security,
  Payment,
  Lightbulb,
  AcUnit,
  Warning,
  CheckCircle,
  Error,
  Add,
  Edit,
  Delete,
  Refresh,
  TrendingUp,
  People,
  AttachMoney,
  Schedule,
  LocationOn,
  Phone,
  Email,
  Language,
  Star,
  StarBorder,
} from '@mui/icons-material';
import VenueManagementService, {
  VenueInfo,
  HardwareDevice,
  TableInfo,
  VenueAnalytics,
  MaintenanceSchedule,
  VenueConfig,
} from '../../services/venue/VenueManagementService';

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
      id={`venue-tabpanel-${index}`}
      aria-labelledby={`venue-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const VenueManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [hardwareDevices, setHardwareDevices] = useState<HardwareDevice[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [analytics, setAnalytics] = useState<VenueAnalytics[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [config, setConfig] = useState<VenueConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [addVenueDialog, setAddVenueDialog] = useState(false);
  const [addDeviceDialog, setAddDeviceDialog] = useState(false);
  const [addTableDialog, setAddTableDialog] = useState(false);

  const venueService = VenueManagementService.getInstance();

  useEffect(() => {
    const interval = setInterval(() => {
      setVenues(venueService.getVenues());
      setHardwareDevices(venueService.getHardwareDevices(selectedVenue));
      setTables(venueService.getTables(selectedVenue));
      setAnalytics(venueService.getAnalytics(selectedVenue || 'v1'));
      setMaintenanceSchedules(venueService.getMaintenanceSchedules(selectedVenue));
      setConfig(venueService.getConfig());
      setIsConnected(venueService.isConnected());
    }, 2000);

    return () => clearInterval(interval);
  }, [venueService, selectedVenue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleVenueSelect = (venueId: string) => {
    setSelectedVenue(venueId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'online':
      case 'available':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'inactive':
      case 'offline':
      case 'occupied':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'online':
      case 'available':
        return <CheckCircle color="success" />;
      case 'maintenance':
        return <Build color="warning" />;
      case 'inactive':
      case 'offline':
      case 'occupied':
        return <Error color="error" />;
      default:
        return <Warning color="info" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'camera':
        return <Videocam />;
      case 'sensor':
        return <Sensors />;
      case 'display':
        return <DisplaySettings />;
      case 'table':
        return <TableBar />;
      case 'security':
        return <Security />;
      case 'payment':
        return <Payment />;
      case 'lighting':
        return <Lightbulb />;
      case 'audio':
        return <AcUnit />;
      default:
        return <Settings />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#00ff9d' }}>
          Venue Management
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#00a8ff', mb: 2 }}>
          Advanced venue management and hardware integration system
        </Typography>
        
        <Alert 
          severity={isConnected ? 'success' : 'error'} 
          sx={{ mb: 2 }}
          icon={isConnected ? <CheckCircle /> : <Error />}
        >
          {isConnected ? 'Connected to venue management service' : 'Disconnected from venue management service'}
        </Alert>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ 
            '& .MuiTab-root': { 
              color: '#ffffff',
              '&.Mui-selected': { color: '#00ff9d' }
            }
          }}
        >
          <Tab label="Venues" icon={<Business />} iconPosition="start" />
          <Tab label="Hardware" icon={<Settings />} iconPosition="start" />
          <Tab label="Tables" icon={<TableBar />} iconPosition="start" />
          <Tab label="Analytics" icon={<Analytics />} iconPosition="start" />
          <Tab label="Maintenance" icon={<Build />} iconPosition="start" />
          <Tab label="Configuration" icon={<Settings />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                Venues ({venues.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddVenueDialog(true)}
                sx={{ bgcolor: '#00ff9d', color: '#000' }}
              >
                Add Venue
              </Button>
            </Box>
          </Grid>

          {venues.map((venue) => (
            <Grid item xs={12} md={6} lg={4} key={venue.id}>
              <Card 
                sx={{ 
                  bgcolor: '#1a1a1a', 
                  border: '1px solid #333',
                  cursor: 'pointer',
                  '&:hover': { borderColor: '#00ff9d' }
                }}
                onClick={() => handleVenueSelect(venue.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ color: '#00a8ff', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff', flex: 1 }}>
                      {venue.name}
                    </Typography>
                    <Chip 
                      label={venue.status} 
                      color={getStatusColor(venue.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                    {venue.address}, {venue.city}, {venue.state}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    <TableBar sx={{ fontSize: 16, mr: 0.5 }} />
                    {venue.tableCount} tables • {venue.capacity} capacity
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Star sx={{ color: '#feca57', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {venue.rating} ({venue.reviewCount} reviews)
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#00ff9d' }}>
                      {formatCurrency(venue.revenue)}/month
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ff6b6b' }}>
                      {formatCurrency(venue.expenses)}/month
                    </Typography>
                  </Box>

                  <LinearProgress 
                    variant="determinate" 
                    value={(venue.profit / venue.revenue) * 100} 
                    sx={{ mt: 1, bgcolor: '#333', '& .MuiLinearProgress-bar': { bgcolor: '#00ff9d' } }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                Hardware Devices ({hardwareDevices.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDeviceDialog(true)}
                sx={{ bgcolor: '#00ff9d', color: '#000' }}
              >
                Add Device
              </Button>
            </Box>
          </Grid>

          {hardwareDevices.map((device) => (
            <Grid item xs={12} md={6} lg={4} key={device.id}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#00a8ff', mr: 2 }}>
                      {getDeviceIcon(device.type)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ color: '#ffffff' }}>
                        {device.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        {device.manufacturer} {device.model}
                      </Typography>
                    </Box>
                    <Chip 
                      label={device.status} 
                      color={getStatusColor(device.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    Location: {device.location}
                  </Typography>

                  {device.ipAddress && (
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      IP: {device.ipAddress}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Temperature: {device.health.temperature}°C
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Uptime: {Math.floor(device.health.uptime / 60)}h
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#ff6b6b' }}>
                      Errors: {device.health.errors}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#feca57' }}>
                      Warnings: {device.health.warnings}
                    </Typography>
                  </Box>

                  <LinearProgress 
                    variant="determinate" 
                    value={100 - (device.health.errors / 10) * 100} 
                    sx={{ mt: 1, bgcolor: '#333', '& .MuiLinearProgress-bar': { bgcolor: '#00ff9d' } }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                Tables ({tables.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddTableDialog(true)}
                sx={{ bgcolor: '#00ff9d', color: '#000' }}
              >
                Add Table
              </Button>
            </Box>
          </Grid>

          {tables.map((table) => (
            <Grid item xs={12} md={6} lg={4} key={table.id}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TableBar sx={{ color: '#00a8ff', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff', flex: 1 }}>
                      Table {table.number}
                    </Typography>
                    <Chip 
                      label={table.status} 
                      color={getStatusColor(table.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    {table.brand} {table.model} • {table.size} • {table.type}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#00ff9d', mb: 1 }}>
                    {formatCurrency(table.hourlyRate)}/hour
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Usage: {table.usageHours}h
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Revenue: {formatCurrency(table.revenue)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Temp: {table.sensors.temperature}°C
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Humidity: {table.sensors.humidity}%
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#888', mr: 1 }}>
                      Lighting:
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={table.sensors.lighting} 
                      sx={{ flex: 1, bgcolor: '#333', '& .MuiLinearProgress-bar': { bgcolor: '#feca57' } }}
                    />
                  </Box>

                  {table.sensors.occupancy && (
                    <Chip 
                      label="Occupied" 
                      color="error" 
                      size="small" 
                      icon={<People />}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {analytics.map((analytics) => (
            <Grid item xs={12} key={analytics.venueId}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                    Venue Analytics - {new Date(analytics.date).toLocaleDateString()}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#ffffff' }}>
                          {analytics.totalVisitors}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888' }}>
                          Total Visitors
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#00a8ff' }}>
                          {formatPercentage(analytics.tableUtilization / 100)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888' }}>
                          Table Utilization
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#00ff9d' }}>
                          {formatCurrency(analytics.revenue)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888' }}>
                          Revenue
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#ff6b6b' }}>
                          {formatCurrency(analytics.profit)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888' }}>
                          Profit
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2, borderColor: '#333' }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Average Session Time: {analytics.averageSessionTime}h
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Customer Satisfaction: {analytics.customerSatisfaction}/5
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Maintenance Issues: {analytics.maintenanceIssues}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Peak Hours: {analytics.peakHours.join(', ')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Popular Tables: {analytics.popularTables.join(', ')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                        Hardware Alerts: {analytics.hardwareAlerts}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
              Maintenance Schedules ({maintenanceSchedules.length})
            </Typography>
          </Grid>

          {maintenanceSchedules.map((maintenance) => (
            <Grid item xs={12} md={6} lg={4} key={maintenance.id}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Build sx={{ color: '#feca57', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff', flex: 1 }}>
                      {maintenance.type} Maintenance
                    </Typography>
                    <Chip 
                      label={maintenance.status} 
                      color={getStatusColor(maintenance.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    {maintenance.description}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    Scheduled: {new Date(maintenance.scheduledDate).toLocaleDateString()}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#00ff9d', mb: 1 }}>
                    {formatCurrency(maintenance.cost)}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={maintenance.priority} 
                      size="small"
                      sx={{ 
                        bgcolor: maintenance.priority === 'critical' ? '#ff6b6b' : 
                               maintenance.priority === 'high' ? '#feca57' : '#00a8ff',
                        color: '#000'
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {maintenance.estimatedDuration}min
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  System Configuration
                </Typography>

                {config && (
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enableHardwareMonitoring}
                          onChange={(e) => venueService.updateConfig({ enableHardwareMonitoring: e.target.checked })}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ff9d' } }}
                        />
                      }
                      label="Hardware Monitoring"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enableAutomatedMaintenance}
                          onChange={(e) => venueService.updateConfig({ enableAutomatedMaintenance: e.target.checked })}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ff9d' } }}
                        />
                      }
                      label="Automated Maintenance"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enableSmartLighting}
                          onChange={(e) => venueService.updateConfig({ enableSmartLighting: e.target.checked })}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ff9d' } }}
                        />
                      }
                      label="Smart Lighting"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enableClimateControl}
                          onChange={(e) => venueService.updateConfig({ enableClimateControl: e.target.checked })}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ff9d' } }}
                        />
                      }
                      label="Climate Control"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enableSecurityMonitoring}
                          onChange={(e) => venueService.updateConfig({ enableSecurityMonitoring: e.target.checked })}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ff9d' } }}
                        />
                      }
                      label="Security Monitoring"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enablePaymentIntegration}
                          onChange={(e) => venueService.updateConfig({ enablePaymentIntegration: e.target.checked })}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ff9d' } }}
                        />
                      }
                      label="Payment Integration"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enableAnalytics}
                          onChange={(e) => venueService.updateConfig({ enableAnalytics: e.target.checked })}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ff9d' } }}
                        />
                      }
                      label="Analytics"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Alert Thresholds
                </Typography>

                {config && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Temperature Range: {config.alertThresholds.temperature.min}°C - {config.alertThresholds.temperature.max}°C
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Humidity Range: {config.alertThresholds.humidity.min}% - {config.alertThresholds.humidity.max}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Occupancy Threshold: {config.alertThresholds.occupancy}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Revenue Alert: {formatCurrency(config.alertThresholds.revenue)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Error Threshold: {config.alertThresholds.errors}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default VenueManagement; 