import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  alpha,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Videocam,
  Sensors,
  Memory,
  DisplaySettings,
  NetworkCheck,
  VolumeUp,
  Lightbulb,
  CheckCircle,
  Warning,
  Error,
  Build,
  Refresh,
  Settings,
  Analytics,
  Timeline,
  Speed,
  Storage,
  Wifi,
  SignalCellular4Bar,
  Battery90,
  Thermostat,
  Opacity,
  LightMode,
  Mic,
  Compress,
  Expand,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import venueHardwareService, {
  HardwareDevice,
  HardwareDeviceType,
  DeviceStatus,
  SensorData,
  CameraData,
  VenueHardwareStatus,
  AlertType,
  AlertSeverity,
} from '../../services/venue/VenueHardwareService';

interface VenueHardwareIntegrationProps {
  venueId?: string;
}

const CyberpunkCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
  border: `2px solid ${alpha('#00ff88', 0.3)}`,
  borderRadius: 12,
  boxShadow: `0 0 20px ${alpha('#00ff88', 0.2)}`,
  backdropFilter: 'blur(10px)',
  '&:hover': {
    boxShadow: `0 0 30px ${alpha('#00ff88', 0.4)}`,
  },
}));

const DeviceCard = styled(Card)(({ theme, status }: { theme: any; status: DeviceStatus }) => {
  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.ONLINE: return '#00ff88';
      case DeviceStatus.OFFLINE: return '#ff0044';
      case DeviceStatus.MAINTENANCE: return '#ffcc00';
      case DeviceStatus.ERROR: return '#ff0044';
      case DeviceStatus.CALIBRATING: return '#00ccff';
      default: return '#666666';
    }
  };

  return {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
    border: `2px solid ${alpha(getStatusColor(status), 0.3)}`,
    borderRadius: 12,
    boxShadow: `0 0 20px ${alpha(getStatusColor(status), 0.2)}`,
    backdropFilter: 'blur(10px)',
    '&:hover': {
      boxShadow: `0 0 30px ${alpha(getStatusColor(status), 0.4)}`,
    },
  };
});

const NeonButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #00ff88 30%, #00ccff 90%)',
  border: 'none',
  borderRadius: 8,
  color: '#000',
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: `0 0 15px ${alpha('#00ff88', 0.5)}`,
  '&:hover': {
    background: 'linear-gradient(45deg, #00ff88 10%, #00ccff 100%)',
    boxShadow: `0 0 25px ${alpha('#00ff88', 0.7)}`,
  },
}));

const getDeviceIcon = (type: HardwareDeviceType) => {
  switch (type) {
    case HardwareDeviceType.CAMERA: return <Videocam />;
    case HardwareDeviceType.SENSOR: return <Sensors />;
    case HardwareDeviceType.PROCESSOR: return <Memory />;
    case HardwareDeviceType.DISPLAY: return <DisplaySettings />;
    case HardwareDeviceType.NETWORK: return <NetworkCheck />;
    case HardwareDeviceType.AUDIO: return <VolumeUp />;
    case HardwareDeviceType.LIGHTING: return <Lightbulb />;
    default: return <Settings />;
  }
};

const getStatusIcon = (status: DeviceStatus) => {
  switch (status) {
    case DeviceStatus.ONLINE: return <CheckCircle sx={{ color: '#00ff88' }} />;
    case DeviceStatus.OFFLINE: return <Error sx={{ color: '#ff0044' }} />;
    case DeviceStatus.MAINTENANCE: return <Build sx={{ color: '#ffcc00' }} />;
    case DeviceStatus.ERROR: return <Error sx={{ color: '#ff0044' }} />;
    case DeviceStatus.CALIBRATING: return <Refresh sx={{ color: '#00ccff' }} />;
    default: return <Warning sx={{ color: '#ffcc00' }} />;
  }
};

export const VenueHardwareIntegration: React.FC<VenueHardwareIntegrationProps> = ({
  venueId = 'venue_001',
}) => {
  const theme = useTheme();
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [status, setStatus] = useState<VenueHardwareStatus | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<HardwareDevice | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [cameraData, setCameraData] = useState<CameraData[]>([]);
  const [calibrationDialog, setCalibrationDialog] = useState(false);
  const [configDialog, setConfigDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  useEffect(() => {
    // Load initial data
    setDevices(venueHardwareService.getDevices(venueId));
    setStatus(venueHardwareService.getVenueStatus(venueId));

    // Subscribe to updates
    const unsubscribeDeviceStatus = venueHardwareService.subscribe('device_status_changed', (data) => {
      setDevices(venueHardwareService.getDevices(venueId));
      setStatus(venueHardwareService.getVenueStatus(venueId));
    });

    const unsubscribeSensorData = venueHardwareService.subscribe('sensor_data', (data: SensorData) => {
      if (data.deviceId === selectedDevice?.id) {
        setSensorData(venueHardwareService.getSensorData(data.deviceId));
      }
    });

    const unsubscribeCameraData = venueHardwareService.subscribe('camera_data', (data: CameraData) => {
      if (data.deviceId === selectedDevice?.id) {
        setCameraData(venueHardwareService.getCameraData(data.deviceId));
      }
    });

    return () => {
      unsubscribeDeviceStatus();
      unsubscribeSensorData();
      unsubscribeCameraData();
    };
  }, [venueId, selectedDevice?.id]);

  const handleDeviceSelect = (device: HardwareDevice) => {
    setSelectedDevice(device);
    setSensorData(venueHardwareService.getSensorData(device.id));
    setCameraData(venueHardwareService.getCameraData(device.id));
  };

  const handleCalibrate = async () => {
    if (!selectedDevice) return;
    
    setLoading(true);
    setCalibrationDialog(false);
    
    try {
      await venueHardwareService.calibrateDevice(selectedDevice.id);
    } catch (error) {
      console.error('Calibration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (config: any) => {
    if (!selectedDevice) return;
    
    setLoading(true);
    setConfigDialog(false);
    
    try {
      await venueHardwareService.updateDeviceConfiguration(selectedDevice.id, config);
    } catch (error) {
      console.error('Configuration update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (value: number, thresholds: { low: number; medium: number; high: number }) => {
    if (value <= thresholds.low) return neonColors.primary;
    if (value <= thresholds.medium) return neonColors.warning;
    return neonColors.error;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Build sx={{ color: neonColors.info, mr: 2, fontSize: 32 }} />
        <Typography variant="h5" sx={{ color: neonColors.info, fontWeight: 'bold' }}>
          Venue Hardware Integration
        </Typography>
      </Box>

      {/* Venue Status Overview */}
      {status && (
        <CyberpunkCard sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Analytics sx={{ color: neonColors.primary, mr: 1 }} />
              <Typography variant="h6" sx={{ color: neonColors.primary, flex: 1 }}>
                Venue Hardware Status
              </Typography>
              <Chip
                label={`${status.onlineDevices}/${status.totalDevices} Online`}
                sx={{ 
                  background: status.onlineDevices === status.totalDevices ? neonColors.primary : neonColors.warning, 
                  color: '#000',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: neonColors.primary }}>
                    {status.onlineDevices}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Online Devices
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: neonColors.warning }}>
                    {status.offlineDevices}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Offline Devices
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: neonColors.error }}>
                    {status.errorDevices}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Error Devices
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: neonColors.info }}>
                    {status.alerts.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Active Alerts
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Performance Metrics */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ color: neonColors.info, mb: 1 }}>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Avg Latency
                    </Typography>
                    <Typography variant="h6" sx={{ color: neonColors.primary }}>
                      {status.performance.averageLatency.toFixed(1)}ms
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Uptime
                    </Typography>
                    <Typography variant="h6" sx={{ color: neonColors.primary }}>
                      {(status.performance.uptime / 3600).toFixed(1)}h
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Error Rate
                    </Typography>
                    <Typography variant="h6" sx={{ color: getHealthColor(status.performance.errorRate * 100, { low: 5, medium: 10, high: 15 }) }}>
                      {(status.performance.errorRate * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Calibration Accuracy
                    </Typography>
                    <Typography variant="h6" sx={{ color: neonColors.primary }}>
                      {(status.performance.calibrationAccuracy * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </CyberpunkCard>
      )}

      {/* Device Grid */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: neonColors.secondary, mb: 2 }}>
          Hardware Devices
        </Typography>
        <Grid container spacing={2}>
          {devices.map((device) => (
            <Grid item xs={12} md={6} lg={4} key={device.id}>
              <DeviceCard
                theme={theme}
                status={device.status}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleDeviceSelect(device)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getDeviceIcon(device.type)}
                    <Box sx={{ ml: 1, flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {device.model}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {device.type}
                      </Typography>
                    </Box>
                    {getStatusIcon(device.status)}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Health Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Tooltip title="Temperature">
                        <Thermostat sx={{ 
                          color: getHealthColor(device.health.temperature, { low: 40, medium: 60, high: 70 }),
                          fontSize: 16
                        }} />
                      </Tooltip>
                      <Tooltip title="CPU Usage">
                        <Memory sx={{ 
                          color: getHealthColor(device.health.cpuUsage, { low: 30, medium: 60, high: 80 }),
                          fontSize: 16
                        }} />
                      </Tooltip>
                      <Tooltip title="Memory Usage">
                        <Storage sx={{ 
                          color: getHealthColor(device.health.memoryUsage, { low: 50, medium: 70, high: 90 }),
                          fontSize: 16
                        }} />
                      </Tooltip>
                      <Tooltip title="Network Latency">
                        <Wifi sx={{ 
                          color: getHealthColor(device.health.networkLatency, { low: 5, medium: 15, high: 25 }),
                          fontSize: 16
                        }} />
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <NeonButton
                      size="small"
                      startIcon={<Build />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDevice(device);
                        setCalibrationDialog(true);
                      }}
                      sx={{ flex: 1 }}
                    >
                      Calibrate
                    </NeonButton>
                    <NeonButton
                      size="small"
                      startIcon={<Settings />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDevice(device);
                        setConfigDialog(true);
                      }}
                      sx={{ flex: 1 }}
                    >
                      Config
                    </NeonButton>
                  </Box>
                </CardContent>
              </DeviceCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Selected Device Details */}
      {selectedDevice && (
        <CyberpunkCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getDeviceIcon(selectedDevice.type)}
              <Typography variant="h6" sx={{ color: neonColors.primary, ml: 1, flex: 1 }}>
                {selectedDevice.model} - {selectedDevice.id}
              </Typography>
              {getStatusIcon(selectedDevice.status)}
            </Box>

            <Grid container spacing={3}>
              {/* Device Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: neonColors.info, mb: 1 }}>
                  Device Information
                </Typography>
                <TableContainer component={Paper} sx={{ background: 'transparent' }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary' }}>Status</TableCell>
                        <TableCell>
                          <Chip
                            label={selectedDevice.status}
                            size="small"
                            sx={{ 
                              background: selectedDevice.status === DeviceStatus.ONLINE ? neonColors.primary : neonColors.error,
                              color: '#000'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary' }}>IP Address</TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>{selectedDevice.ipAddress}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary' }}>Firmware</TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>{selectedDevice.firmwareVersion}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary' }}>Last Seen</TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>
                          {selectedDevice.lastSeen.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Health Metrics */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: neonColors.warning, mb: 1 }}>
                  Health Metrics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Temperature
                      </Typography>
                      <Typography variant="body2" sx={{ color: getHealthColor(selectedDevice.health.temperature, { low: 40, medium: 60, high: 70 }) }}>
                        {selectedDevice.health.temperature.toFixed(1)}°C
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(selectedDevice.health.temperature / 80) * 100}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: alpha(neonColors.error, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getHealthColor(selectedDevice.health.temperature, { low: 40, medium: 60, high: 70 }),
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        CPU Usage
                      </Typography>
                      <Typography variant="body2" sx={{ color: getHealthColor(selectedDevice.health.cpuUsage, { low: 30, medium: 60, high: 80 }) }}>
                        {selectedDevice.health.cpuUsage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={selectedDevice.health.cpuUsage}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: alpha(neonColors.error, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getHealthColor(selectedDevice.health.cpuUsage, { low: 30, medium: 60, high: 80 }),
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Memory Usage
                      </Typography>
                      <Typography variant="body2" sx={{ color: getHealthColor(selectedDevice.health.memoryUsage, { low: 50, medium: 70, high: 90 }) }}>
                        {selectedDevice.health.memoryUsage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={selectedDevice.health.memoryUsage}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: alpha(neonColors.error, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getHealthColor(selectedDevice.health.memoryUsage, { low: 50, medium: 70, high: 90 }),
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Recent Sensor Data */}
            {sensorData.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ color: neonColors.info, mb: 1 }}>
                  Recent Sensor Data
                </Typography>
                <TableContainer component={Paper} sx={{ background: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Timestamp</TableCell>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Motion</TableCell>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Temperature</TableCell>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Humidity</TableCell>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Light</TableCell>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Sound</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sensorData.slice(-5).map((data, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {data.timestamp.toLocaleTimeString()}
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {data.values.motion ? 'Yes' : 'No'}
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {data.values.temperature.toFixed(1)}°C
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {data.values.humidity.toFixed(1)}%
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {data.values.light.toFixed(0)} lux
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {data.values.sound.toFixed(1)} dB
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Recent Camera Data */}
            {cameraData.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ color: neonColors.info, mb: 1 }}>
                  Recent Camera Analysis
                </Typography>
                <TableContainer component={Paper} sx={{ background: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Timestamp</TableCell>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Objects Detected</TableCell>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Motion</TableCell>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Image Quality</TableCell>
                        <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Processing Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cameraData.slice(-5).map((data, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {data.timestamp.toLocaleTimeString()}
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {data.analysis.objects.length} objects
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {data.analysis.motion.detected ? 'Yes' : 'No'}
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {(data.analysis.quality.overall * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>
                            {data.analysis.processing.processingTime.toFixed(1)}ms
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        </CyberpunkCard>
      )}

      {/* Calibration Dialog */}
      <Dialog open={calibrationDialog} onClose={() => setCalibrationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: neonColors.warning, fontWeight: 'bold' }}>
          Calibrate Device
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            This will calibrate the {selectedDevice?.model} device. The process may take several minutes.
          </Typography>
          <Alert severity="info" sx={{ background: neonColors.info, color: '#000' }}>
            Device will be temporarily unavailable during calibration.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalibrationDialog(false)}>Cancel</Button>
          <NeonButton onClick={handleCalibrate} disabled={loading}>
            Start Calibration
          </NeonButton>
        </DialogActions>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: neonColors.info, fontWeight: 'bold' }}>
          Device Configuration
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Update configuration for {selectedDevice?.model}
          </Typography>
          {/* Add configuration form here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Cancel</Button>
          <NeonButton onClick={() => handleUpdateConfig({})} disabled={loading}>
            Update Configuration
          </NeonButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 