import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Security,
  Warning,
  BugReport,
  Timeline,
  Settings,
  Refresh,
  Add,
  Visibility,
  VisibilityOff,
  Shield,
  GpsFixed,
  Speed,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import TournamentSecurityService, {
  type SecurityAlert,
  type FraudPattern,
  type SecurityEvent,
  type SecurityMetrics,
  type SecurityConfig,
} from '../../services/security/TournamentSecurityService';

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
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentSecurity: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [fraudPatterns, setFraudPatterns] = useState<FraudPattern[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const securityService = TournamentSecurityService.getInstance();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setAlerts(securityService.getAlerts());
    setFraudPatterns(securityService.getFraudPatterns());
    setSecurityEvents(securityService.getSecurityEvents());
    setMetrics(securityService.getMetrics());
    setConfig(securityService.getConfig());
    setIsConnected(securityService.isOnline());
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ff4444';
      case 'high':
        return '#ff8800';
      case 'medium':
        return '#ffaa00';
      case 'low':
        return '#00ff88';
      default:
        return '#888888';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'fraud':
        return <BugReport />;
      case 'suspicious_activity':
        return <Warning />;
      case 'security_breach':
        return <Security />;
      case 'unauthorized_access':
        return <Visibility />;
      case 'data_leak':
        return <Timeline />;
      default:
        return <Security />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#ff4444';
      case 'investigating':
        return '#ffaa00';
      case 'resolved':
        return '#00ff88';
      case 'false_positive':
        return '#888888';
      default:
        return '#888888';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#ff4444';
      case 'high':
        return '#ff8800';
      case 'medium':
        return '#ffaa00';
      case 'low':
        return '#00ff88';
      default:
        return '#888888';
    }
  };

  const handleUpdateAlertStatus = async (
    alertId: string,
    status: SecurityAlert['status']
  ) => {
    setLoading(true);
    try {
      await securityService.updateAlertStatus(alertId, status);
      loadData();
    } catch (error) {
      console.error('Failed to update alert status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = async (newConfig: Partial<SecurityConfig>) => {
    if (!config) return;

    setLoading(true);
    try {
      await securityService.updateConfig(newConfig);
      loadData();
    } catch (error) {
      console.error('Failed to update config:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#ffffff',
        p: 3,
      }}
    >
      <Box
        sx={{
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 3,
          border: '1px solid #ff4444',
          boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(90deg, #ff4444 0%, #ff8800 100%)',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Security sx={{ fontSize: 40, color: '#000' }} />
          <Box>
            <Typography variant="h4" sx={{ color: '#000', fontWeight: 'bold' }}>
              Security & Fraud Detection
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: '#000', opacity: 0.8 }}
            >
              Advanced security monitoring and fraud detection system
            </Typography>
          </Box>
          <Box
            sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <Chip
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              sx={{
                background: isConnected
                  ? 'rgba(0, 255, 136, 0.2)'
                  : 'rgba(255, 68, 68, 0.2)',
                border: `1px solid ${isConnected ? '#00ff88' : '#ff4444'}`,
              }}
            />
            <IconButton onClick={loadData} disabled={loading}>
              <Refresh sx={{ color: '#000' }} />
            </IconButton>
          </Box>
        </Box>

        {/* Security Status Banner */}
        {metrics && (
          <Box
            sx={{
              background: `rgba(${getThreatLevelColor(metrics.threatLevel)}, 0.1)`,
              border: `1px solid ${getThreatLevelColor(metrics.threatLevel)}`,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Shield sx={{ color: getThreatLevelColor(metrics.threatLevel) }} />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{ color: getThreatLevelColor(metrics.threatLevel) }}
              >
                Threat Level: {metrics.threatLevel.toUpperCase()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                Security Score: {metrics.securityScore}/100 | Open Alerts:{' '}
                {metrics.openAlerts} | Compliance: {metrics.complianceStatus}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={metrics.securityScore}
              sx={{
                width: 200,
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getThreatLevelColor(metrics.threatLevel),
                },
              }}
            />
          </Box>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: '#333' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#888',
                '&.Mui-selected': {
                  color: '#ff4444',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#ff4444',
              },
            }}
          >
            <Tab label="Alerts" icon={<Warning />} />
            <Tab label="Fraud Patterns" icon={<BugReport />} />
            <Tab label="Security Events" icon={<Timeline />} />
            <Tab label="Metrics" icon={<TrendingUp />} />
            <Tab label="Configuration" icon={<Settings />} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ color: '#ff4444', mb: 3 }}>
            Security Alerts ({alerts.length})
          </Typography>
          <Grid container spacing={2}>
            {alerts.map((alert) => (
              <Grid item xs={12} md={6} key={alert.id}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: `1px solid ${getSeverityColor(alert.severity)}`,
                    '&:hover': { borderColor: '#ff4444' },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {getAlertTypeIcon(alert.type)}
                        <Typography
                          variant="h6"
                          sx={{ color: getSeverityColor(alert.severity) }}
                        >
                          {alert.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={alert.severity}
                        sx={{
                          background: `rgba(${getSeverityColor(alert.severity)}, 0.2)`,
                          border: `1px solid ${getSeverityColor(alert.severity)}`,
                          color: getSeverityColor(alert.severity),
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                      {alert.description}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Chip
                        label={alert.status}
                        sx={{
                          background: `rgba(${getStatusColor(alert.status)}, 0.2)`,
                          border: `1px solid ${getStatusColor(alert.status)}`,
                          color: getStatusColor(alert.status),
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        Risk: {Math.round(alert.riskScore * 100)}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Source: {alert.source}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {alert.timestamp.toLocaleString()}
                    </Typography>
                    {alert.automatedAction && (
                      <Typography
                        variant="body2"
                        sx={{ color: '#00ff88', mt: 1 }}
                      >
                        Action: {alert.automatedAction}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      {alert.status === 'open' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              handleUpdateAlertStatus(alert.id, 'investigating')
                            }
                            sx={{ borderColor: '#ffaa00', color: '#ffaa00' }}
                          >
                            Investigate
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              handleUpdateAlertStatus(
                                alert.id,
                                'false_positive'
                              )
                            }
                            sx={{ borderColor: '#888', color: '#888' }}
                          >
                            False Positive
                          </Button>
                        </>
                      )}
                      {alert.status === 'investigating' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            handleUpdateAlertStatus(alert.id, 'resolved')
                          }
                          sx={{ borderColor: '#00ff88', color: '#00ff88' }}
                        >
                          Resolve
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ color: '#ff4444', mb: 3 }}>
            Fraud Detection Patterns ({fraudPatterns.length})
          </Typography>
          <Grid container spacing={2}>
            {fraudPatterns.map((pattern) => (
              <Grid item xs={12} md={6} key={pattern.id}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #333',
                    '&:hover': { borderColor: '#ff4444' },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#ff4444' }}>
                        {pattern.name}
                      </Typography>
                      <Chip
                        label={pattern.riskLevel}
                        sx={{
                          background: `rgba(${getSeverityColor(pattern.riskLevel)}, 0.2)`,
                          border: `1px solid ${getSeverityColor(pattern.riskLevel)}`,
                          color: getSeverityColor(pattern.riskLevel),
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                      {pattern.description}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Pattern: {pattern.pattern}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#00ff88', mb: 1 }}
                    >
                      Accuracy: {Math.round(pattern.accuracy * 100)}%
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#ffaa00', mb: 1 }}
                    >
                      Detections: {pattern.detectionCount}
                    </Typography>
                    {pattern.lastDetected && (
                      <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                        Last Detected: {pattern.lastDetected.toLocaleString()}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Detection Rules:
                    </Typography>
                    <List dense>
                      {pattern.detectionRules.map((rule, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemText
                            primary={rule}
                            sx={{
                              '& .MuiListItemText-primary': {
                                color: '#888',
                                fontSize: '0.875rem',
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Typography
                      variant="body2"
                      sx={{ color: '#ccc', mb: 1, mt: 2 }}
                    >
                      Mitigation Actions:
                    </Typography>
                    <List dense>
                      {pattern.mitigationActions.map((action, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemText
                            primary={action}
                            sx={{
                              '& .MuiListItemText-primary': {
                                color: '#00ff88',
                                fontSize: '0.875rem',
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ color: '#ff4444', mb: 3 }}>
            Security Events ({securityEvents.length})
          </Typography>
          <Grid container spacing={2}>
            {securityEvents.map((event) => (
              <Grid item xs={12} md={6} key={event.id}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: event.flagged
                      ? '1px solid #ff4444'
                      : '1px solid #333',
                    '&:hover': { borderColor: '#ff4444' },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#ff4444' }}>
                        {event.type.toUpperCase()}
                      </Typography>
                      <Chip
                        label={event.flagged ? 'Flagged' : 'Normal'}
                        color={event.flagged ? 'error' : 'success'}
                        sx={{
                          background: event.flagged
                            ? 'rgba(255, 68, 68, 0.2)'
                            : 'rgba(0, 255, 136, 0.2)',
                          border: `1px solid ${event.flagged ? '#ff4444' : '#00ff88'}`,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      User: {event.userId || 'Anonymous'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      IP: {event.ipAddress}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Location: {event.location || 'Unknown'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: event.success ? '#00ff88' : '#ff4444',
                        mb: 1,
                      }}
                    >
                      Status: {event.success ? 'Success' : 'Failed'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Risk Score: {Math.round(event.riskScore * 100)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {event.timestamp.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" sx={{ color: '#ff4444', mb: 3 }}>
            Security Metrics & Analytics
          </Typography>
          {metrics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #333',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ff4444', mb: 2 }}>
                      Alert Statistics
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Total Alerts:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ff4444' }}>
                        {metrics.totalAlerts}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Open Alerts:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffaa00' }}>
                        {metrics.openAlerts}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Resolved Alerts:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#00ff88' }}>
                        {metrics.resolvedAlerts}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        False Positives:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        {metrics.falsePositives}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Avg Response Time:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#00ccff' }}>
                        {Math.round(metrics.averageResponseTime)}m
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #333',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ff4444', mb: 2 }}>
                      Security Status
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Threat Level:
                      </Typography>
                      <Chip
                        label={metrics.threatLevel.toUpperCase()}
                        sx={{
                          background: `rgba(${getThreatLevelColor(metrics.threatLevel)}, 0.2)`,
                          border: `1px solid ${getThreatLevelColor(metrics.threatLevel)}`,
                          color: getThreatLevelColor(metrics.threatLevel),
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Security Score:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: getThreatLevelColor(metrics.threatLevel) }}
                      >
                        {metrics.securityScore}/100
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Compliance:
                      </Typography>
                      <Chip
                        label={metrics.complianceStatus.toUpperCase()}
                        color={
                          metrics.complianceStatus === 'compliant'
                            ? 'success'
                            : metrics.complianceStatus === 'warning'
                              ? 'warning'
                              : 'error'
                        }
                        size="small"
                      />
                    </Box>
                    {metrics.lastIncident && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#ccc' }}>
                          Last Incident:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888' }}>
                          {metrics.lastIncident.toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                    <LinearProgress
                      variant="determinate"
                      value={metrics.securityScore}
                      sx={{
                        mt: 2,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getThreatLevelColor(
                            metrics.threatLevel
                          ),
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" sx={{ color: '#ff4444', mb: 3 }}>
            Security Configuration
          </Typography>
          {config && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #333',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ff4444', mb: 2 }}>
                      Monitoring Settings
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.fraudDetectionEnabled}
                          onChange={(e) =>
                            handleConfigChange({
                              fraudDetectionEnabled: e.target.checked,
                            })
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#00ff88',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                              {
                                backgroundColor: '#00ff88',
                              },
                          }}
                        />
                      }
                      label="Fraud Detection"
                      sx={{ color: '#ccc', mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.realTimeMonitoring}
                          onChange={(e) =>
                            handleConfigChange({
                              realTimeMonitoring: e.target.checked,
                            })
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#00ff88',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                              {
                                backgroundColor: '#00ff88',
                              },
                          }}
                        />
                      }
                      label="Real-time Monitoring"
                      sx={{ color: '#ccc', mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.automatedActions}
                          onChange={(e) =>
                            handleConfigChange({
                              automatedActions: e.target.checked,
                            })
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#00ff88',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                              {
                                backgroundColor: '#00ff88',
                              },
                          }}
                        />
                      }
                      label="Automated Actions"
                      sx={{ color: '#ccc' }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #333',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ff4444', mb: 2 }}>
                      Alert Thresholds
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                        Low: {Math.round(config.alertThresholds.low * 100)}%
                      </Typography>
                      <Slider
                        value={config.alertThresholds.low}
                        onChange={(e, value) =>
                          handleConfigChange({
                            alertThresholds: {
                              ...config.alertThresholds,
                              low: value as number,
                            },
                          })
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        sx={{
                          '& .MuiSlider-thumb': { backgroundColor: '#00ff88' },
                          '& .MuiSlider-track': { backgroundColor: '#00ff88' },
                        }}
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                        Medium:{' '}
                        {Math.round(config.alertThresholds.medium * 100)}%
                      </Typography>
                      <Slider
                        value={config.alertThresholds.medium}
                        onChange={(e, value) =>
                          handleConfigChange({
                            alertThresholds: {
                              ...config.alertThresholds,
                              medium: value as number,
                            },
                          })
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        sx={{
                          '& .MuiSlider-thumb': { backgroundColor: '#ffaa00' },
                          '& .MuiSlider-track': { backgroundColor: '#ffaa00' },
                        }}
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                        High: {Math.round(config.alertThresholds.high * 100)}%
                      </Typography>
                      <Slider
                        value={config.alertThresholds.high}
                        onChange={(e, value) =>
                          handleConfigChange({
                            alertThresholds: {
                              ...config.alertThresholds,
                              high: value as number,
                            },
                          })
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        sx={{
                          '& .MuiSlider-thumb': { backgroundColor: '#ff8800' },
                          '& .MuiSlider-track': { backgroundColor: '#ff8800' },
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                        Critical:{' '}
                        {Math.round(config.alertThresholds.critical * 100)}%
                      </Typography>
                      <Slider
                        value={config.alertThresholds.critical}
                        onChange={(e, value) =>
                          handleConfigChange({
                            alertThresholds: {
                              ...config.alertThresholds,
                              critical: value as number,
                            },
                          })
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        sx={{
                          '& .MuiSlider-thumb': { backgroundColor: '#ff4444' },
                          '& .MuiSlider-track': { backgroundColor: '#ff4444' },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default TournamentSecurity;
