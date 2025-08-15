import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useEnhancedVenueManagement } from '../../hooks/useEnhancedVenueManagement';

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

export const EnhancedVenueManagementPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const {
    venues,
    selectedVenue,
    loading,
    error,
    analytics,
    analyticsLoading,
    status,
    statusLoading,
    schedules,
    schedulesLoading,
    optimization,
    optimizationLoading,
    performance,
    performanceLoading,
    selectVenue,
    updateVenue,
    updateTournamentSchedule,
    createTournament,
    resolveAlert,
    refreshData
  } = useEnhancedVenueManagement();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleVenueSelect = (venueId: string) => {
    selectVenue(venueId);
  };

  const handleCreateTournament = async (scheduleId: string) => {
    if (selectedVenue) {
      const result = await createTournament(selectedVenue.id, scheduleId);
      if (result.success) {
        alert(`Tournament created successfully! ID: ${result.tournamentId}`);
      } else {
        alert(`Failed to create tournament: ${result.error}`);
      }
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    if (selectedVenue) {
      await resolveAlert(selectedVenue.id, alertId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon color="success" />;
      case 'offline':
        return <ErrorIcon color="error" />;
      case 'maintenance':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Venue Management Portal
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshData}
        >
          Refresh
        </Button>
      </Box>

      {/* Venue Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Venue
          </Typography>
          <Grid container spacing={2}>
            {venues.map((venue) => (
              <Grid item xs={12} sm={6} md={4} key={venue.id}>
                <Card
                  variant={selectedVenue?.id === venue.id ? 'elevation' : 'outlined'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 },
                    border: selectedVenue?.id === venue.id ? 2 : 1,
                    borderColor: selectedVenue?.id === venue.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => handleVenueSelect(venue.id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {venue.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {venue.location.city}, {venue.location.state}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={venue.status}
                        color={venue.status === 'active' ? 'success' : venue.status === 'maintenance' ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {selectedVenue && (
        <>
          {/* Venue Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  {selectedVenue.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={selectedVenue.status}
                    color={selectedVenue.status === 'active' ? 'success' : selectedVenue.status === 'maintenance' ? 'warning' : 'error'}
                  />
                  <IconButton size="small">
                    <SettingsIcon />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {selectedVenue.location.address}, {selectedVenue.location.city}, {selectedVenue.location.state}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Typography variant="body2">
                  <strong>Capacity:</strong> {selectedVenue.capacity}
                </Typography>
                <Typography variant="body2">
                  <strong>Tables:</strong> {selectedVenue.tables}
                </Typography>
                <Typography variant="body2">
                  <strong>Amenities:</strong> {selectedVenue.amenities.join(', ')}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="venue management tabs">
              <Tab label="Overview" icon={<AssessmentIcon />} />
              <Tab label="Analytics" icon={<AnalyticsIcon />} />
              <Tab label="Scheduling" icon={<ScheduleIcon />} />
              <Tab label="Optimization" icon={<TrendingUpIcon />} />
              <Tab label="Performance" icon={<AssessmentIcon />} />
            </Tabs>
          </Box>

          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Real-time Status */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Real-time Status
                    </Typography>
                    {statusLoading ? (
                      <CircularProgress size={20} />
                    ) : status ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          {getStatusIcon(status.status)}
                          <Typography variant="body1" sx={{ ml: 1 }}>
                            {status.status.toUpperCase()}
                          </Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Active Tables
                            </Typography>
                            <Typography variant="h6">
                              {status.activeTables}/{selectedVenue.tables}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Current Visitors
                            </Typography>
                            <Typography variant="h6">
                              {status.currentVisitors}/{selectedVenue.capacity}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Ongoing Matches
                            </Typography>
                            <Typography variant="h6">
                              {status.ongoingMatches}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Active Tournaments
                            </Typography>
                            <Typography variant="h6">
                              {status.activeTournaments}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    ) : (
                      <Typography color="text.secondary">No status data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* System Health */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Health
                    </Typography>
                    {statusLoading ? (
                      <CircularProgress size={20} />
                    ) : status ? (
                      <Box>
                        {Object.entries(status.systemHealth).map(([component, healthy]) => (
                          <Box key={component} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {healthy ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                            <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                              {component}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography color="text.secondary">No health data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Alerts */}
              {status?.alerts && status.alerts.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Active Alerts
                      </Typography>
                      {status.alerts.map((alert) => (
                        <Alert
                          key={alert.id}
                          severity={alert.type}
                          action={
                            !alert.resolved && (
                              <Button
                                color="inherit"
                                size="small"
                                onClick={() => handleResolveAlert(alert.id)}
                              >
                                Resolve
                              </Button>
                            )
                          }
                          sx={{ mb: 1 }}
                        >
                          {alert.message}
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  label="Period"
                  onChange={(e) => setSelectedPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {analyticsLoading ? (
              <CircularProgress />
            ) : analytics ? (
              <Grid container spacing={3}>
                {/* Key Metrics */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Key Metrics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Visitors
                          </Typography>
                          <Typography variant="h6">
                            {analytics.metrics.totalVisitors.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Unique Visitors
                          </Typography>
                          <Typography variant="h6">
                            {analytics.metrics.uniqueVisitors.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Matches Played
                          </Typography>
                          <Typography variant="h6">
                            {analytics.metrics.matchesPlayed.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Tournaments Hosted
                          </Typography>
                          <Typography variant="h6">
                            {analytics.metrics.tournamentsHosted.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Revenue
                          </Typography>
                          <Typography variant="h6">
                            ${analytics.metrics.revenue.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Dojo Coins Earned
                          </Typography>
                          <Typography variant="h6">
                            {analytics.metrics.dojoCoinsEarned.toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Trends */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Growth Trends
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Visitor Growth
                          </Typography>
                          <Typography variant="h6" color={analytics.trends.visitorGrowth >= 0 ? 'success.main' : 'error.main'}>
                            {analytics.trends.visitorGrowth > 0 ? '+' : ''}{analytics.trends.visitorGrowth.toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Revenue Growth
                          </Typography>
                          <Typography variant="h6" color={analytics.trends.revenueGrowth >= 0 ? 'success.main' : 'error.main'}>
                            {analytics.trends.revenueGrowth > 0 ? '+' : ''}{analytics.trends.revenueGrowth.toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Match Growth
                          </Typography>
                          <Typography variant="h6" color={analytics.trends.matchGrowth >= 0 ? 'success.main' : 'error.main'}>
                            {analytics.trends.matchGrowth > 0 ? '+' : ''}{analytics.trends.matchGrowth.toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Tournament Growth
                          </Typography>
                          <Typography variant="h6" color={analytics.trends.tournamentGrowth >= 0 ? 'success.main' : 'error.main'}>
                            {analytics.trends.tournamentGrowth > 0 ? '+' : ''}{analytics.trends.tournamentGrowth.toFixed(1)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Top Players */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Players
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Player</TableCell>
                              <TableCell align="right">Matches</TableCell>
                              <TableCell align="right">Wins</TableCell>
                              <TableCell align="right">Win Rate</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {analytics.metrics.topPlayers.map((player) => (
                              <TableRow key={player.userId}>
                                <TableCell>{player.userId}</TableCell>
                                <TableCell align="right">{player.matches}</TableCell>
                                <TableCell align="right">{player.wins}</TableCell>
                                <TableCell align="right">
                                  {((player.wins / player.matches) * 100).toFixed(1)}%
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
            ) : (
              <Typography color="text.secondary">No analytics data available</Typography>
            )}
          </TabPanel>

          {/* Scheduling Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                onClick={() => setScheduleDialogOpen(true)}
              >
                Add New Schedule
              </Button>
            </Box>

            {schedulesLoading ? (
              <CircularProgress />
            ) : (
              <Grid container spacing={3}>
                {schedules.map((schedule) => (
                  <Grid item xs={12} md={6} key={schedule.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">
                            {schedule.name}
                          </Typography>
                          <Box>
                            <Chip
                              label={schedule.type}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Switch
                              checked={schedule.enabled}
                              onChange={(e) => updateTournamentSchedule(schedule.id, { enabled: e.target.checked })}
                              size="small"
                            />
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {schedule.schedule.days.join(', ')} • {schedule.schedule.startTime} - {schedule.schedule.endTime}
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Max Participants
                            </Typography>
                            <Typography variant="body1">
                              {schedule.schedule.maxParticipants}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Entry Fee
                            </Typography>
                            <Typography variant="body1">
                              ${schedule.schedule.entryFee}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Prize Pool
                            </Typography>
                            <Typography variant="body1">
                              ${schedule.schedule.prizePool}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleCreateTournament(schedule.id)}
                            disabled={!schedule.enabled}
                          >
                            Create Tournament
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setSelectedSchedule(schedule);
                              setScheduleDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </Box>

                        {schedule.autoCreate && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Auto-creates tournaments
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Optimization Tab */}
          <TabPanel value={tabValue} index={3}>
            {optimizationLoading ? (
              <CircularProgress />
            ) : optimization ? (
              <Grid container spacing={3}>
                {/* Recommendations */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Revenue Optimization Recommendations
                      </Typography>
                      {optimization.recommendations.map((rec) => (
                        <Card key={rec.id} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="h6">
                                {rec.title}
                              </Typography>
                              <Chip
                                label={rec.impact}
                                color={rec.impact === 'high' ? 'error' : rec.impact === 'medium' ? 'warning' : 'default'}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {rec.description}
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Est. Revenue Increase
                                </Typography>
                                <Typography variant="body1" color="success.main">
                                  +${rec.estimatedRevenueIncrease.toLocaleString()}
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Implementation Cost
                                </Typography>
                                <Typography variant="body1">
                                  ${rec.implementationCost.toLocaleString()}
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Priority
                                </Typography>
                                <Typography variant="body1">
                                  {rec.priority}
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Button variant="contained" size="small">
                                  Implement
                                </Button>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Pricing Analysis */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Pricing Analysis
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Current Average Price
                        </Typography>
                        <Typography variant="h6">
                          ${optimization.pricingAnalysis.currentAveragePrice}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Recommended Price
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          ${optimization.pricingAnalysis.recommendedPrice}
                        </Typography>
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        Competitor Analysis
                      </Typography>
                      {optimization.pricingAnalysis.competitorAnalysis.map((competitor) => (
                        <Box key={competitor.competitor} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            {competitor.competitor}
                          </Typography>
                          <Typography variant="body2">
                            ${competitor.price} ({competitor.marketShare * 100}%)
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Capacity Optimization */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Capacity Optimization
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Current Utilization
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={optimization.capacityOptimization.currentUtilization * 100}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2">
                          {(optimization.capacityOptimization.currentUtilization * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Recommended Capacity
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={optimization.capacityOptimization.recommendedCapacity * 100}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2">
                          {(optimization.capacityOptimization.recommendedCapacity * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Typography color="text.secondary">No optimization data available</Typography>
            )}
          </TabPanel>

          {/* Performance Tab */}
          <TabPanel value={tabValue} index={4}>
            {performanceLoading ? (
              <CircularProgress />
            ) : performance ? (
              <Grid container spacing={3}>
                {/* KPIs */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Key Performance Indicators
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                              {(performance.kpis.visitorSatisfaction * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Visitor Satisfaction
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                              {(performance.kpis.tableUtilization * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Table Utilization
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                              {(performance.kpis.tournamentSuccess * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Tournament Success
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                              ${performance.kpis.revenuePerVisitor}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Revenue per Visitor
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                              ${performance.kpis.costPerMatch}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Cost per Match
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                              {(performance.kpis.profitMargin * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Profit Margin
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Benchmarks */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Industry Benchmarks
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Metric</TableCell>
                              <TableCell align="right">Industry Avg</TableCell>
                              <TableCell align="right">Top Performers</TableCell>
                              <TableCell align="right">Your Venue</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>Visitor Satisfaction</TableCell>
                              <TableCell align="right">{(performance.benchmarks.industryAverage.visitorSatisfaction * 100).toFixed(1)}%</TableCell>
                              <TableCell align="right">{(performance.benchmarks.topPerformers.visitorSatisfaction * 100).toFixed(1)}%</TableCell>
                              <TableCell align="right">{(performance.kpis.visitorSatisfaction * 100).toFixed(1)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Table Utilization</TableCell>
                              <TableCell align="right">{(performance.benchmarks.industryAverage.tableUtilization * 100).toFixed(1)}%</TableCell>
                              <TableCell align="right">{(performance.benchmarks.topPerformers.tableUtilization * 100).toFixed(1)}%</TableCell>
                              <TableCell align="right">{(performance.kpis.tableUtilization * 100).toFixed(1)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Revenue per Visitor</TableCell>
                              <TableCell align="right">${performance.benchmarks.industryAverage.revenuePerVisitor}</TableCell>
                              <TableCell align="right">${performance.benchmarks.topPerformers.revenuePerVisitor}</TableCell>
                              <TableCell align="right">${performance.kpis.revenuePerVisitor}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Improvements */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Improvement Opportunities
                      </Typography>
                      {performance.improvements.map((improvement) => (
                        <Box key={improvement.metric} sx={{ mb: 2 }}>
                          <Typography variant="body1" gutterBottom>
                            {improvement.metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ mr: 2 }}>
                              Current: {improvement.currentValue}
                            </Typography>
                            <Typography variant="body2" sx={{ mr: 2 }}>
                              Target: {improvement.targetValue}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              +{improvement.improvement}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Actions: {improvement.actions.join(', ')}
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Typography color="text.secondary">No performance data available</Typography>
            )}
          </TabPanel>
        </>
      )}

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSchedule ? 'Edit Tournament Schedule' : 'Add New Tournament Schedule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Schedule Name"
                defaultValue={selectedSchedule?.name || ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select defaultValue={selectedSchedule?.type || 'daily'}>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="special">Special</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                defaultValue={selectedSchedule?.schedule.startTime || '18:00'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                defaultValue={selectedSchedule?.schedule.endTime || '22:00'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Participants"
                type="number"
                defaultValue={selectedSchedule?.schedule.maxParticipants || 16}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Entry Fee"
                type="number"
                defaultValue={selectedSchedule?.schedule.entryFee || 15}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prize Pool"
                type="number"
                defaultValue={selectedSchedule?.schedule.prizePool || 200}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch defaultChecked={selectedSchedule?.autoCreate || false} />}
                label="Auto-create tournaments"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch defaultChecked={selectedSchedule?.enabled || true} />}
                label="Enabled"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setScheduleDialogOpen(false)}>
            {selectedSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 