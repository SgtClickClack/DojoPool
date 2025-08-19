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
  LinearProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  Speed,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
  Refresh,
} from '@mui/icons-material';
import {
  AdvancedAnalyticsService,
  VenueOptimization,
  RevenueForecast,
} from '../../services/analytics/AdvancedAnalyticsService';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [analyticsService] = useState(() => new AdvancedAnalyticsService());
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetrics[]
  >([]);
  const [predictiveInsights, setPredictiveInsights] = useState<
    PredictiveInsight[]
  >([]);
  const [tournamentROIs, setTournamentROIs] = useState<TournamentROI[]>([]);
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<AnalyticsConfig | null>(null);

  useEffect(() => {
    const handlePerformanceUpdate = (metrics: PerformanceMetrics) => {
      setPerformanceMetrics((prev) => [...prev, metrics].slice(-50)); // Keep last 50 metrics
    };

    const handleInsightGenerated = (insight: PredictiveInsight) => {
      setPredictiveInsights((prev) => [insight, ...prev].slice(0, 10)); // Keep latest 10 insights
    };

    const handlePerformanceAlert = (alert: any) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 5)); // Keep latest 5 alerts
    };

    const handleConnectionChange = () => {
      setIsConnected(analyticsService.isConnected());
    };

    // Subscribe to events
    analyticsService.on('performanceUpdate', handlePerformanceUpdate);
    analyticsService.on('insightGenerated', handleInsightGenerated);
    analyticsService.on('performanceAlert', handlePerformanceAlert);

    // Initial data load
    loadData();
    handleConnectionChange();

    // Set up periodic data refresh
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds

    return () => {
      analyticsService.off('performanceUpdate', handlePerformanceUpdate);
      analyticsService.off('insightGenerated', handleInsightGenerated);
      analyticsService.off('performanceAlert', handlePerformanceAlert);
      clearInterval(interval);
    };
  }, [analyticsService]);

  const loadData = () => {
    setPerformanceMetrics(analyticsService.getPerformanceMetrics());
    setPredictiveInsights(analyticsService.getPredictiveInsights());
    setTournamentROIs(analyticsService.getTournamentROIs());
    setConfig(analyticsService.getConfig());
    setIsConnected(analyticsService.isConnected());
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleConfigOpen = () => {
    setTempConfig(config);
    setConfigDialogOpen(true);
  };

  const handleConfigSave = () => {
    if (tempConfig) {
      setConfig(tempConfig);
      // In a real implementation, you would save this to the service
    }
    setConfigDialogOpen(false);
  };

  const handleConfigCancel = () => {
    setConfigDialogOpen(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'success';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getLatestMetrics = () => {
    return performanceMetrics[performanceMetrics.length - 1] || null;
  };

  const getPerformanceTrend = () => {
    if (performanceMetrics.length < 2) return 'stable';

    const recent = performanceMetrics.slice(-5);
    const older = performanceMetrics.slice(-10, -5);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg =
      recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, m) => sum + m.responseTime, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change < -10) return 'improving';
    if (change > 10) return 'declining';
    return 'stable';
  };

  const generateMockInsight = async () => {
    const types: PredictiveInsight['type'][] = [
      'match_outcome',
      'player_performance',
      'tournament_success',
      'revenue_forecast',
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];

    await analyticsService.generatePredictiveInsight(randomType, {
      playerId: 'player_' + Math.floor(Math.random() * 1000),
      tournamentId: 'tournament_' + Math.floor(Math.random() * 1000),
      winProbability: Math.floor(Math.random() * 100),
      improvement: Math.floor(Math.random() * 50),
      successRate: Math.floor(Math.random() * 100),
      projectedRevenue: Math.floor(Math.random() * 10000),
    });
  };

  const calculateMockROI = async () => {
    await analyticsService.calculateTournamentROI(
      'tournament_' + Math.floor(Math.random() * 1000),
      {
        investment: Math.floor(Math.random() * 10000),
        revenue: Math.floor(Math.random() * 15000),
        playerCount: Math.floor(Math.random() * 100),
        prizePool: Math.floor(Math.random() * 5000),
        venueCapacity: Math.floor(Math.random() * 200),
      }
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Analytics sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Advanced Analytics Dashboard
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                Real-time performance monitoring and predictive analytics
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={handleConfigOpen}
          >
            Configure
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={getSeverityColor(alert.severity)}
              sx={{ mb: 1 }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="analytics tabs"
        >
          <Tab
            label="Performance Monitoring"
            icon={<Speed />}
            iconPosition="start"
          />
          <Tab
            label="Predictive Analytics"
            icon={<TrendingUp />}
            iconPosition="start"
          />
          <Tab
            label="Tournament ROI"
            icon={<BarChart />}
            iconPosition="start"
          />
          <Tab label="System Health" icon={<Timeline />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Performance Monitoring Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Current Performance */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Performance
                </Typography>
                {getLatestMetrics() ? (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        CPU Usage
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getLatestMetrics()!.cpuUsage}
                        color={
                          getLatestMetrics()!.cpuUsage > 80
                            ? 'error'
                            : 'primary'
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2">
                        {getLatestMetrics()!.cpuUsage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Memory Usage
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getLatestMetrics()!.memoryUsage}
                        color={
                          getLatestMetrics()!.memoryUsage > 85
                            ? 'error'
                            : 'primary'
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2">
                        {getLatestMetrics()!.memoryUsage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Response Time
                      </Typography>
                      <Typography variant="body2">
                        {getLatestMetrics()!.responseTime.toFixed(0)}ms
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Active Connections
                      </Typography>
                      <Typography variant="body2">
                        {getLatestMetrics()!.activeConnections}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    No performance data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Trend */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Trend
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <Chip
                    label={getPerformanceTrend()}
                    color={
                      getPerformanceTrend() === 'improving'
                        ? 'success'
                        : getPerformanceTrend() === 'declining'
                          ? 'error'
                          : 'default'
                    }
                    icon={
                      getPerformanceTrend() === 'improving' ? (
                        <TrendingUp />
                      ) : (
                        <Timeline />
                      )
                    }
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Based on response time analysis over the last 10 measurements
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance History */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance History (Last 50 measurements)
                </Typography>
                <Box sx={{ height: 200, overflow: 'auto' }}>
                  {performanceMetrics.length > 0 ? (
                    <Grid container spacing={2}>
                      {performanceMetrics
                        .slice(-10)
                        .reverse()
                        .map((metric, index) => (
                          <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card variant="outlined">
                              <CardContent sx={{ p: 2 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {new Date(
                                    metric.timestamp
                                  ).toLocaleTimeString()}
                                </Typography>
                                <Typography variant="body2">
                                  CPU: {metric.cpuUsage.toFixed(1)}%
                                </Typography>
                                <Typography variant="body2">
                                  Memory: {metric.memoryUsage.toFixed(1)}%
                                </Typography>
                                <Typography variant="body2">
                                  Response: {metric.responseTime.toFixed(0)}ms
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">
                      No performance history available
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Predictive Analytics Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Generate Insights */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Predictive Insights</Typography>
                  <Button
                    variant="contained"
                    onClick={generateMockInsight}
                    startIcon={<TrendingUp />}
                  >
                    Generate Insight
                  </Button>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  AI-powered predictions for match outcomes, player performance,
                  and tournament success
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Insights List */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {predictiveInsights.map((insight) => (
                <Grid item xs={12} md={6} key={insight.id}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Chip
                          label={insight.type.replace('_', ' ')}
                          color="primary"
                          size="small"
                        />
                        <Chip
                          label={`${insight.confidence}% confidence`}
                          color={
                            insight.confidence > 80
                              ? 'success'
                              : insight.confidence > 60
                                ? 'warning'
                                : 'default'
                          }
                          size="small"
                        />
                      </Box>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {insight.prediction}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        Impact:{' '}
                        <Chip
                          label={insight.impact}
                          color={getImpactColor(insight.impact)}
                          size="small"
                        />
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Factors: {insight.factors.join(', ')}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        Generated: {insight.timestamp.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {predictiveInsights.length === 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" align="center">
                        No predictive insights available. Click "Generate
                        Insight" to create one.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tournament ROI Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Generate ROI Analysis */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Tournament ROI Analysis</Typography>
                  <Button
                    variant="contained"
                    onClick={calculateMockROI}
                    startIcon={<BarChart />}
                  >
                    Calculate ROI
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive return on investment analysis for tournaments
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* ROI List */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {tournamentROIs.map((roi) => (
                <Grid item xs={12} md={6} key={roi.tournamentId}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Tournament {roi.tournamentId}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Investment: ${roi.totalInvestment.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Revenue: ${roi.totalRevenue.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Net Profit: ${roi.netProfit.toLocaleString()}
                        </Typography>
                        <Typography
                          variant="h6"
                          color={
                            roi.roiPercentage >= 0
                              ? 'success.main'
                              : 'error.main'
                          }
                        >
                          ROI: {roi.roiPercentage.toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Risk Factors:
                        </Typography>
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {roi.riskFactors.map((risk, index) => (
                            <Chip
                              key={index}
                              label={risk}
                              size="small"
                              color="warning"
                            />
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Recommendations:
                        </Typography>
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {roi.recommendations.map((rec, index) => (
                            <Chip
                              key={index}
                              label={rec}
                              size="small"
                              color="info"
                            />
                          ))}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {tournamentROIs.length === 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" align="center">
                        No ROI analysis available. Click "Calculate ROI" to
                        generate one.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </TabPanel>

      {/* System Health Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {/* Connection Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Status
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  {isConnected ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Error color="error" />
                  )}
                  <Typography>
                    WebSocket Connection:{' '}
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Real-time data streaming status
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Configuration */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analytics Configuration
                </Typography>
                {config && (
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch checked={config.realTimeMonitoring} disabled />
                      }
                      label="Real-time Monitoring"
                    />
                    <FormControlLabel
                      control={
                        <Switch checked={config.predictiveAnalytics} disabled />
                      }
                      label="Predictive Analytics"
                    />
                    <FormControlLabel
                      control={
                        <Switch checked={config.automatedReporting} disabled />
                      }
                      label="Automated Reporting"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Alert Thresholds */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alert Thresholds
                </Typography>
                {config && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        CPU Usage Threshold
                      </Typography>
                      <Typography variant="h6">
                        {config.alertThresholds.cpuUsage}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Memory Usage Threshold
                      </Typography>
                      <Typography variant="h6">
                        {config.alertThresholds.memoryUsage}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Error Rate Threshold
                      </Typography>
                      <Typography variant="h6">
                        {config.alertThresholds.errorRate}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Response Time Threshold
                      </Typography>
                      <Typography variant="h6">
                        {config.alertThresholds.responseTime}ms
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Configuration Dialog */}
      <Dialog
        open={configDialogOpen}
        onClose={handleConfigCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Analytics Configuration</DialogTitle>
        <DialogContent>
          {tempConfig && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.realTimeMonitoring}
                      onChange={(e) =>
                        setTempConfig({
                          ...tempConfig,
                          realTimeMonitoring: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Real-time Monitoring"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.predictiveAnalytics}
                      onChange={(e) =>
                        setTempConfig({
                          ...tempConfig,
                          predictiveAnalytics: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Predictive Analytics"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.automatedReporting}
                      onChange={(e) =>
                        setTempConfig({
                          ...tempConfig,
                          automatedReporting: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Automated Reporting"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CPU Usage Threshold (%)"
                  type="number"
                  value={tempConfig.alertThresholds.cpuUsage}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      alertThresholds: {
                        ...tempConfig.alertThresholds,
                        cpuUsage: Number(e.target.value),
                      },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Memory Usage Threshold (%)"
                  type="number"
                  value={tempConfig.alertThresholds.memoryUsage}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      alertThresholds: {
                        ...tempConfig.alertThresholds,
                        memoryUsage: Number(e.target.value),
                      },
                    })
                  }
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfigCancel}>Cancel</Button>
          <Button onClick={handleConfigSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedAnalytics;
