import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  LinearProgress,
  Chip,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Speed,
  Memory,
  Storage,
  NetworkCheck,
  Settings,
  PlayArrow,
  Stop,
  Refresh,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  Tune,
  Analytics,
  Cache,
  MemoryOutlined,
  SpeedOutlined,
  NetworkCheckOutlined,
} from '@mui/icons-material';
import TournamentPerformanceService, {
  PerformanceMetrics,
  CacheStats,
  OptimizationConfig,
} from '../../services/performance/TournamentPerformanceService';

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
      id={`performance-tabpanel-${index}`}
      aria-labelledby={`performance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentPerformance: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [config, setConfig] = useState<OptimizationConfig | null>(null);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [tempConfig, setTempConfig] = useState<OptimizationConfig | null>(null);

  const performanceService = TournamentPerformanceService.getInstance();

  useEffect(() => {
    loadInitialData();
    return () => {
      performanceService.stopMonitoring();
    };
  }, []);

  const loadInitialData = () => {
    setCacheStats(performanceService.getCacheStats());
    setConfig(performanceService.getConfig());
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      performanceService.stopMonitoring();
      setIsMonitoring(false);
    } else {
      performanceService.startMonitoring();
      setIsMonitoring(true);
    }
  };

  const refreshData = () => {
    setMetrics(performanceService.getLatestMetrics());
    setCacheStats(performanceService.getCacheStats());
  };

  const clearCache = () => {
    performanceService.clearCache();
    setCacheStats(performanceService.getCacheStats());
  };

  const openConfig = () => {
    setTempConfig(performanceService.getConfig());
    setOpenConfigDialog(true);
  };

  const saveConfig = () => {
    if (tempConfig) {
      performanceService.updateConfig(tempConfig);
      setConfig(tempConfig);
    }
    setOpenConfigDialog(false);
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return '#ff6b6b';
    if (value >= threshold * 0.8) return '#feca57';
    return '#00ff9d';
  };

  const getPerformanceStatus = (value: number, threshold: number) => {
    if (value >= threshold) return 'Critical';
    if (value >= threshold * 0.8) return 'Warning';
    return 'Good';
  };

  const renderPerformanceMetrics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card
          sx={{
            background: 'rgba(20, 20, 20, 0.9)',
            border: '2px solid #00ff9d',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: '#00ff9d',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 2,
                textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
              }}
            >
              System Performance
            </Typography>

            {metrics ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      CPU Usage
                    </Typography>
                    <Typography variant="body2" sx={{ color: getPerformanceColor(metrics.cpuUsage, 80) }}>
                      {metrics.cpuUsage.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.cpuUsage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPerformanceColor(metrics.cpuUsage, 80),
                        boxShadow: `0 0 10px ${getPerformanceColor(metrics.cpuUsage, 80)}`,
                      },
                    }}
                  />
                  <Chip
                    label={getPerformanceStatus(metrics.cpuUsage, 80)}
                    size="small"
                    sx={{
                      backgroundColor: getPerformanceColor(metrics.cpuUsage, 80),
                      color: '#000',
                      fontWeight: 600,
                      mt: 1,
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      Memory Usage
                    </Typography>
                    <Typography variant="body2" sx={{ color: getPerformanceColor(metrics.memoryUsage * 100, 80) }}>
                      {(metrics.memoryUsage * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.memoryUsage * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPerformanceColor(metrics.memoryUsage * 100, 80),
                        boxShadow: `0 0 10px ${getPerformanceColor(metrics.memoryUsage * 100, 80)}`,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      Network Latency
                    </Typography>
                    <Typography variant="body2" sx={{ color: getPerformanceColor(metrics.networkLatency, 200) }}>
                      {metrics.networkLatency.toFixed(0)}ms
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(metrics.networkLatency / 300) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPerformanceColor(metrics.networkLatency, 200),
                        boxShadow: `0 0 10px ${getPerformanceColor(metrics.networkLatency, 200)}`,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      Response Time
                    </Typography>
                    <Typography variant="body2" sx={{ color: getPerformanceColor(metrics.responseTime, 300) }}>
                      {metrics.responseTime.toFixed(0)}ms
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(metrics.responseTime / 500) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPerformanceColor(metrics.responseTime, 300),
                        boxShadow: `0 0 10px ${getPerformanceColor(metrics.responseTime, 300)}`,
                      },
                    }}
                  />
                </Box>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: '#ccc', textAlign: 'center' }}>
                Start monitoring to see performance metrics
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card
          sx={{
            background: 'rgba(20, 20, 20, 0.9)',
            border: '2px solid #00a8ff',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: '#00a8ff',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 2,
                textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
              }}
            >
              System Statistics
            </Typography>

            {metrics ? (
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <NetworkCheckOutlined sx={{ color: '#00a8ff' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Active Connections"
                    secondary={`${metrics.activeConnections} connections`}
                    sx={{ color: '#fff' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Storage sx={{ color: '#00a8ff' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Database Queries"
                    secondary={`${metrics.databaseQueries} queries/min`}
                    sx={{ color: '#fff' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <TrendingUp sx={{ color: '#00a8ff' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cache Hit Rate"
                    secondary={`${(metrics.cacheHitRate * 100).toFixed(1)}%`}
                    sx={{ color: '#fff' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Error sx={{ color: '#00a8ff' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Error Rate"
                    secondary={`${(metrics.errorRate * 100).toFixed(2)}%`}
                    sx={{ color: '#fff' }}
                  />
                </ListItem>
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: '#ccc', textAlign: 'center' }}>
                Start monitoring to see system statistics
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCacheManagement = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card
          sx={{
            background: 'rgba(20, 20, 20, 0.9)',
            border: '2px solid #feca57',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(254, 202, 87, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: '#feca57',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 2,
                textShadow: '0 0 10px rgba(254, 202, 87, 0.5)',
              }}
            >
              Cache Statistics
            </Typography>

            {cacheStats ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
                    Cache Hit Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={cacheStats.hitRate * 100}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#feca57',
                        boxShadow: '0 0 10px rgba(254, 202, 87, 0.5)',
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
                    {(cacheStats.hitRate * 100).toFixed(1)}% Hit Rate
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#00ff9d', fontWeight: 700 }}>
                        {cacheStats.totalEntries}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Total Entries
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#00a8ff', fontWeight: 700 }}>
                        {cacheStats.evictions}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Evictions
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
                    Memory Usage
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={cacheStats.memoryUsage * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPerformanceColor(cacheStats.memoryUsage * 100, 80),
                        boxShadow: `0 0 10px ${getPerformanceColor(cacheStats.memoryUsage * 100, 80)}`,
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
                    {(cacheStats.memoryUsage * 100).toFixed(1)}% Memory Usage
                  </Typography>
                </Box>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: '#ccc', textAlign: 'center' }}>
                Loading cache statistics...
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card
          sx={{
            background: 'rgba(20, 20, 20, 0.9)',
            border: '2px solid #ff9ff3',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(255, 159, 243, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: '#ff9ff3',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 2,
                textShadow: '0 0 10px rgba(255, 159, 243, 0.5)',
              }}
            >
              Cache Actions
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={refreshData}
                sx={{
                  background: 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                  color: '#000',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                  },
                }}
              >
                Refresh Cache Stats
              </Button>

              <Button
                variant="contained"
                startIcon={<Storage />}
                onClick={clearCache}
                sx={{
                  background: 'linear-gradient(45deg, #ff6b6b 0%, #feca57 100%)',
                  color: '#000',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #feca57 0%, #ff6b6b 100%)',
                  },
                }}
              >
                Clear Cache
              </Button>

              <Button
                variant="contained"
                startIcon={<Tune />}
                onClick={openConfig}
                sx={{
                  background: 'linear-gradient(45deg, #feca57 0%, #ff9ff3 100%)',
                  color: '#000',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ff9ff3 0%, #feca57 100%)',
                  },
                }}
              >
                Configure Cache
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderConfiguration = () => (
    <Card
      sx={{
        background: 'rgba(20, 20, 20, 0.9)',
        border: '2px solid #00ff9d',
        borderRadius: 3,
        boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            color: '#00ff9d',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 600,
            mb: 3,
            textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
          }}
        >
          Performance Configuration
        </Typography>

        {config && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
                Max Cache Size: {config.maxCacheSize} entries
              </Typography>
              <Slider
                value={config.maxCacheSize}
                onChange={(_, value) => setConfig({ ...config, maxCacheSize: value as number })}
                min={100}
                max={5000}
                step={100}
                sx={{
                  color: '#00ff9d',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#00ff9d',
                    boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                  },
                }}
              />

              <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1, mt: 2 }}>
                Cache TTL: {config.cacheTtl / 1000}s
              </Typography>
              <Slider
                value={config.cacheTtl / 1000}
                onChange={(_, value) => setConfig({ ...config, cacheTtl: (value as number) * 1000 })}
                min={60}
                max={1800}
                step={60}
                sx={{
                  color: '#00ff9d',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#00ff9d',
                    boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                  },
                }}
              />

              <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1, mt: 2 }}>
                Max Memory Usage: {(config.maxMemoryUsage * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={config.maxMemoryUsage * 100}
                onChange={(_, value) => setConfig({ ...config, maxMemoryUsage: (value as number) / 100 })}
                min={50}
                max={95}
                step={5}
                sx={{
                  color: '#00ff9d',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#00ff9d',
                    boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.compressionEnabled}
                    onChange={(e) => setConfig({ ...config, compressionEnabled: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00ff9d',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00ff9d',
                      },
                    }}
                  />
                }
                label="Enable Compression"
                sx={{ color: '#fff', mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.preloadEnabled}
                    onChange={(e) => setConfig({ ...config, preloadEnabled: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00ff9d',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00ff9d',
                      },
                    }}
                  />
                }
                label="Enable Preloading"
                sx={{ color: '#fff', mb: 2 }}
              />

              <Button
                variant="contained"
                onClick={() => {
                  performanceService.updateConfig(config);
                }}
                sx={{
                  background: 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                  color: '#000',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mt: 2,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                  },
                }}
              >
                Apply Configuration
              </Button>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            color: '#00ff9d',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 700,
            textShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
          }}
        >
          Tournament Performance Optimization
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={isMonitoring ? <Stop /> : <PlayArrow />}
            onClick={toggleMonitoring}
            sx={{
              background: isMonitoring 
                ? 'linear-gradient(45deg, #ff6b6b 0%, #feca57 100%)'
                : 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
              color: '#000',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
              mr: 2,
              '&:hover': {
                background: isMonitoring 
                  ? 'linear-gradient(45deg, #feca57 0%, #ff6b6b 100%)'
                  : 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
              },
            }}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={refreshData}
              sx={{
                color: '#00a8ff',
                '&:hover': {
                  backgroundColor: 'rgba(0, 168, 255, 0.1)',
                },
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper
        sx={{
          background: 'rgba(20, 20, 20, 0.9)',
          border: '1px solid rgba(0, 255, 157, 0.3)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            background: 'rgba(30, 30, 30, 0.9)',
            borderBottom: '1px solid rgba(0, 255, 157, 0.2)',
            '& .MuiTab-root': {
              color: '#fff',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              '&.Mui-selected': {
                color: '#00ff9d',
                textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00ff9d',
              boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
            },
          }}
        >
          <Tab label="Performance Metrics" />
          <Tab label="Cache Management" />
          <Tab label="Configuration" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderPerformanceMetrics()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderCacheManagement()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderConfiguration()}
        </TabPanel>
      </Paper>

      {/* Configuration Dialog */}
      <Dialog
        open={openConfigDialog}
        onClose={() => setOpenConfigDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(20, 20, 20, 0.95)',
            border: '2px solid #00ff9d',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(0, 255, 157, 0.5)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#00ff9d', fontFamily: 'Orbitron, monospace' }}>
          Advanced Configuration
        </DialogTitle>
        <DialogContent>
          {tempConfig && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Max Cache Size"
                  type="number"
                  value={tempConfig.maxCacheSize}
                  onChange={(e) => setTempConfig({ ...tempConfig, maxCacheSize: parseInt(e.target.value) })}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: '#00ff9d',
                      },
                      '&:hover fieldset': {
                        borderColor: '#00a8ff',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#ccc',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Cache TTL (seconds)"
                  type="number"
                  value={tempConfig.cacheTtl / 1000}
                  onChange={(e) => setTempConfig({ ...tempConfig, cacheTtl: parseInt(e.target.value) * 1000 })}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: '#00ff9d',
                      },
                      '&:hover fieldset': {
                        borderColor: '#00a8ff',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#ccc',
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenConfigDialog(false)}
            sx={{ color: '#ccc' }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveConfig}
            sx={{
              background: 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
              color: '#000',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
              },
            }}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentPerformance; 