import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  CompareArrows,
  Psychology,
  HealthAndSafety,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import VenueAnalyticsService, {
  VenueMetrics,
  VenueComparison,
  PredictiveInsights,
  VenueHealthStatus,
  VenueROIAnalysis,
} from '../../services/analytics/VenueAnalyticsService';

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
      id={`venue-analytics-tabpanel-${index}`}
      aria-labelledby={`venue-analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const VenueAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [venueMetrics, setVenueMetrics] = useState<VenueMetrics | null>(null);
  const [venueComparison, setVenueComparison] = useState<VenueComparison | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsights | null>(null);
  const [healthStatus, setHealthStatus] = useState<VenueHealthStatus | null>(null);
  const [roiAnalysis, setRoiAnalysis] = useState<VenueROIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analyticsService = VenueAnalyticsService.getInstance();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const venueId = 'demo_venue_001'; // In real app, get from context/auth

        const [metrics, comparison, insights, health, roi] = await Promise.all([
          analyticsService.getVenueMetrics(venueId),
          analyticsService.getVenueComparison(venueId),
          analyticsService.getPredictiveInsights(venueId),
          analyticsService.getHealthStatus(venueId),
          analyticsService.getROIAnalysis(venueId, 'monthly'),
        ]);

        setVenueMetrics(metrics);
        setVenueComparison(comparison);
        setPredictiveInsights(insights);
        setHealthStatus(health);
        setRoiAnalysis(roi);
        setError(null);
      } catch (err) {
        setError('Failed to load venue analytics data');
        console.error('VenueAnalytics: Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    analyticsService.on('metricsUpdate', setVenueMetrics);
    analyticsService.on('comparisonUpdate', setVenueComparison);
    analyticsService.on('insightsUpdate', setPredictiveInsights);
    analyticsService.on('healthUpdate', setHealthStatus);
    analyticsService.on('roiUpdate', setRoiAnalysis);

    return () => {
      analyticsService.removeAllListeners();
    };
  }, [analyticsService]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#00ff9d';
      case 'good': return '#00a8ff';
      case 'fair': return '#feca57';
      case 'poor': return '#ff6b6b';
      case 'critical': return '#ff0000';
      default: return '#888';
    }
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? <TrendingUp sx={{ color: '#00ff9d' }} /> : <TrendingDown sx={{ color: '#ff6b6b' }} />;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading venue analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontFamily: 'Orbitron, monospace',
            color: '#00ff9d',
            textShadow: '0 0 20px #00ff9d',
            mb: 2,
          }}
        >
          Venue Analytics Dashboard
        </Typography>
        <Typography variant="h6" sx={{ color: '#888', mb: 3 }}>
          Real-time performance tracking and predictive insights for your Dojo
        </Typography>
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{
          borderBottom: 1,
          borderColor: '#333',
          mb: 3,
          '& .MuiTab-root': {
            color: '#888',
            fontFamily: 'Orbitron, monospace',
            '&.Mui-selected': {
              color: '#00ff9d',
            },
          },
        }}
      >
        <Tab icon={<Assessment />} label="Performance" />
        <Tab icon={<CompareArrows />} label="Comparison" />
        <Tab icon={<Psychology />} label="Predictions" />
        <Tab icon={<HealthAndSafety />} label="Health" />
        <Tab icon={<TrendingUp />} label="ROI Analysis" />
      </Tabs>

      {/* Performance Tab */}
      <TabPanel value={tabValue} index={0}>
        {venueMetrics && (
          <Grid container spacing={3}>
            {/* Revenue Metrics */}
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Revenue Performance
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Daily Revenue</Typography>
                      <Typography variant="h5" sx={{ color: '#fff' }}>${venueMetrics.revenue.daily.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Growth Rate</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getTrendIcon(venueMetrics.revenue.growthRate)}
                        <Typography variant="h6" sx={{ color: '#00ff9d', ml: 1 }}>
                          {venueMetrics.revenue.growthRate}%
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Player Engagement */}
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Player Engagement
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Active Players</Typography>
                      <Typography variant="h5" sx={{ color: '#fff' }}>{venueMetrics.playerEngagement.activePlayers}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Retention Rate</Typography>
                      <Typography variant="h6" sx={{ color: '#00a8ff' }}>
                        {venueMetrics.playerEngagement.playerRetentionRate}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Tournament Performance */}
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#feca57', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Tournament Performance
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Success Rate</Typography>
                      <Typography variant="h6" sx={{ color: '#feca57' }}>
                        {venueMetrics.tournamentPerformance.tournamentSuccessRate}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Avg Prize Pool</Typography>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        ${venueMetrics.tournamentPerformance.averagePrizePool}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Equipment Health */}
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Equipment Health
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Table Utilization</Typography>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        {venueMetrics.equipmentHealth.tableUtilization}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Uptime</Typography>
                      <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                        {venueMetrics.equipmentHealth.uptimePercentage}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Comparison Tab */}
      <TabPanel value={tabValue} index={1}>
        {venueComparison && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 3, fontFamily: 'Orbitron, monospace' }}>
                    Competitive Analysis
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" sx={{ color: '#888', mb: 1 }}>Revenue Rank</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h4" sx={{ color: '#00ff9d', mr: 2 }}>
                          #{venueComparison.metrics.revenueComparison.rank}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888' }}>
                          Top {venueComparison.metrics.revenueComparison.percentile}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" sx={{ color: '#888', mb: 1 }}>Player Engagement</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h4" sx={{ color: '#00a8ff', mr: 2 }}>
                          #{venueComparison.metrics.playerEngagementComparison.rank}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888' }}>
                          Top {venueComparison.metrics.playerEngagementComparison.percentile}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" sx={{ color: '#888', mb: 1 }}>Tournament Performance</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h4" sx={{ color: '#feca57', mr: 2 }}>
                          #{venueComparison.metrics.tournamentPerformanceComparison.rank}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888' }}>
                          Top {venueComparison.metrics.tournamentPerformanceComparison.percentile}%
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 3, borderColor: '#333' }} />
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>Recommendations</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {venueComparison.recommendations.map((rec, index) => (
                      <Typography key={index} variant="body2" sx={{ color: '#fff' }}>
                        • {rec}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Predictions Tab */}
      <TabPanel value={tabValue} index={2}>
        {predictiveInsights && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Revenue Forecast
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Next Week</Typography>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        ${predictiveInsights.predictions.revenueForecast.nextWeek.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Next Month</Typography>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        ${predictiveInsights.predictions.revenueForecast.nextMonth.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Confidence</Typography>
                      <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                        {predictiveInsights.predictions.revenueForecast.confidence}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Player Growth Predictions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Expected New Players</Typography>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        {predictiveInsights.predictions.playerGrowth.expectedNewPlayers}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Churn Risk</Typography>
                      <Typography variant="h6" sx={{ color: '#ff6b6b' }}>
                        {predictiveInsights.predictions.playerGrowth.churnRisk}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#feca57', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Optimization Recommendations
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(predictiveInsights.optimizationRecommendations).map(([category, recommendations]) => (
                      <Grid item xs={12} md={6} key={category}>
                        <Typography variant="subtitle1" sx={{ color: '#feca57', mb: 1, textTransform: 'capitalize' }}>
                          {category.replace(/([A-Z])/g, ' $1')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {recommendations.map((rec, index) => (
                            <Typography key={index} variant="body2" sx={{ color: '#fff' }}>
                              • {rec}
                            </Typography>
                          ))}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Health Tab */}
      <TabPanel value={tabValue} index={3}>
        {healthStatus && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Overall Health Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Chip
                      label={healthStatus.overallHealth.toUpperCase()}
                      sx={{
                        bgcolor: getHealthColor(healthStatus.overallHealth),
                        color: '#000',
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>System Status</Typography>
                  <Grid container spacing={1}>
                    {Object.entries(healthStatus.systemStatus).map(([system, status]) => (
                      <Grid item xs={6} key={system}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {status === 'online' ? (
                            <CheckCircle sx={{ color: '#00ff9d', fontSize: 16 }} />
                          ) : status === 'degraded' ? (
                            <Warning sx={{ color: '#feca57', fontSize: 16 }} />
                          ) : (
                            <Error sx={{ color: '#ff6b6b', fontSize: 16 }} />
                          )}
                          <Typography variant="body2" sx={{ color: '#fff', textTransform: 'capitalize' }}>
                            {system}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Equipment Status
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(healthStatus.equipmentStatus).map(([equipment, status]) => (
                      <Grid item xs={12} key={equipment}>
                        <Typography variant="subtitle2" sx={{ color: '#888', textTransform: 'capitalize', mb: 1 }}>
                          {equipment}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Chip
                            label={`${status.operational}/${status.total} Operational`}
                            size="small"
                            sx={{ bgcolor: '#00ff9d', color: '#000' }}
                          />
                          {status.maintenance > 0 && (
                            <Chip
                              label={`${status.maintenance} Maintenance`}
                              size="small"
                              sx={{ bgcolor: '#feca57', color: '#000' }}
                            />
                          )}
                          {status.offline > 0 && (
                            <Chip
                              label={`${status.offline} Offline`}
                              size="small"
                              sx={{ bgcolor: '#ff6b6b', color: '#000' }}
                            />
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Alerts & Notifications
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {healthStatus.alerts.critical > 0 && (
                      <Chip
                        icon={<Error />}
                        label={`${healthStatus.alerts.critical} Critical`}
                        sx={{ bgcolor: '#ff6b6b', color: '#000' }}
                      />
                    )}
                    {healthStatus.alerts.warning > 0 && (
                      <Chip
                        icon={<Warning />}
                        label={`${healthStatus.alerts.warning} Warnings`}
                        sx={{ bgcolor: '#feca57', color: '#000' }}
                      />
                    )}
                    {healthStatus.alerts.info > 0 && (
                      <Chip
                        icon={<Info />}
                        label={`${healthStatus.alerts.info} Info`}
                        sx={{ bgcolor: '#00a8ff', color: '#000' }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* ROI Analysis Tab */}
      <TabPanel value={tabValue} index={4}>
        {roiAnalysis && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Revenue Breakdown
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Total Revenue</Typography>
                      <Typography variant="h5" sx={{ color: '#fff' }}>
                        ${roiAnalysis.revenue.total.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Growth Rate</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getTrendIcon(roiAnalysis.revenue.growthRate)}
                        <Typography variant="h6" sx={{ color: '#00ff9d', ml: 1 }}>
                          {roiAnalysis.revenue.growthRate}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>Revenue Sources</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#fff' }}>Tournaments</Typography>
                          <Typography variant="body2" sx={{ color: '#00a8ff' }}>
                            ${roiAnalysis.revenue.fromTournaments.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#fff' }}>Equipment</Typography>
                          <Typography variant="body2" sx={{ color: '#feca57' }}>
                            ${roiAnalysis.revenue.fromEquipment.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#fff' }}>Services</Typography>
                          <Typography variant="body2" sx={{ color: '#ff6b6b' }}>
                            ${roiAnalysis.revenue.fromServices.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    ROI Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Overall ROI</Typography>
                      <Typography variant="h5" sx={{ color: '#00ff9d' }}>
                        {roiAnalysis.roi.overall}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Tournament ROI</Typography>
                      <Typography variant="h6" sx={{ color: '#00a8ff' }}>
                        {roiAnalysis.roi.tournamentROI}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Equipment ROI</Typography>
                      <Typography variant="h6" sx={{ color: '#feca57' }}>
                        {roiAnalysis.roi.equipmentROI}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888' }}>Marketing ROI</Typography>
                      <Typography variant="h6" sx={{ color: '#ff6b6b' }}>
                        {roiAnalysis.roi.marketingROI}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#feca57', mb: 2, fontFamily: 'Orbitron, monospace' }}>
                    Recommendations
                  </Typography>
                  <Grid container spacing={2}>
                    {roiAnalysis.recommendations.map((rec, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Typography variant="body2" sx={{ color: '#fff' }}>
                          • {rec}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Refresh Button */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
        <Tooltip title="Refresh Analytics">
          <IconButton
            onClick={() => window.location.reload()}
            sx={{
              bgcolor: 'rgba(0, 255, 157, 0.1)',
              border: '1px solid #00ff9d',
              color: '#00ff9d',
              '&:hover': {
                bgcolor: 'rgba(0, 255, 157, 0.2)',
              },
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
    </Container>
  );
};

export default VenueAnalytics; 