import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert as MuiAlert,
  IconButton,
  Chip,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  SportsEsports as GamesIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { metrics_monitor } from '../../core/monitoring/metrics_monitor';
import { AlertSeverity, Alert, GameMetrics } from '../../core/monitoring/metrics_monitor';
import { PerformancePanel } from './PerformancePanel';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend }) => {
  const theme = useTheme();
  
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">
              {value}
            </Typography>
          </Box>
          <Box>
            {icon}
          </Box>
        </Box>
        {trend !== undefined && (
          <Box mt={2}>
            <Typography variant="body2" color={trend >= 0 ? 'success.main' : 'error.main'}>
              {trend >= 0 ? '+' : ''}{trend}% from last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

interface AlertListProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
}

const AlertList: React.FC<AlertListProps> = ({ alerts, onAcknowledge }) => {
  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.ERROR:
        return <ErrorIcon color="error" />;
      case AlertSeverity.WARNING:
        return <WarningIcon color="warning" />;
      case AlertSeverity.INFO:
        return <CheckCircleIcon color="info" />;
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Active Alerts
      </Typography>
      {alerts.map((alert) => (
        <MuiAlert
          key={alert.id}
          severity={alert.severity.toLowerCase() as 'error' | 'warning' | 'info'}
          action={
            !alert.acknowledged && (
              <IconButton
                color="inherit"
                size="small"
                onClick={() => onAcknowledge(alert.id)}
              >
                <CheckCircleIcon />
              </IconButton>
            )
          }
          style={{ marginBottom: 8 }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="body1">
              {alert.message}
            </Typography>
            <Chip
              size="small"
              label={alert.acknowledged ? 'Acknowledged' : 'New'}
              color={alert.acknowledged ? 'default' : 'primary'}
            />
          </Box>
        </MuiAlert>
      ))}
    </Box>
  );
};

const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<GameMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch metrics for active game
        const gameMetrics = metrics_monitor.getMetrics('current_game');
        setMetrics(gameMetrics);
        
        // Fetch alerts
        const activeAlerts = metrics_monitor.getAlerts();
        setAlerts(activeAlerts);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        metrics_monitor.addAlert(
          AlertSeverity.ERROR,
          'Failed to fetch metrics data',
          { error: String(error) }
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const success = metrics_monitor.acknowledgeAlert(alertId, 'current_user');
      if (success) {
        setAlerts(metrics_monitor.getAlerts());
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };
  
  if (loading) {
    return <LinearProgress />;
  }
  
  if (!metrics) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          No metrics data available
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Game Metrics Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Active Players */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Players"
            value={metrics.activePlayers}
            icon={<PeopleIcon fontSize="large" color="primary" />}
            trend={10}
          />
        </Grid>
        
        {/* Active Games */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Games"
            value={metrics.activeGames}
            icon={<GamesIcon fontSize="large" color="primary" />}
            trend={5}
          />
        </Grid>
        
        {/* Completion Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Completion Rate"
            value={`${(metrics.completionRate * 100).toFixed(1)}%`}
            icon={<CheckCircleIcon fontSize="large" color="success" />}
            trend={2}
          />
        </Grid>
        
        {/* Error Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Error Rate"
            value={`${metrics.errorRate.toFixed(2)}/min`}
            icon={<ErrorIcon fontSize="large" color="error" />}
            trend={-15}
          />
        </Grid>
      </Grid>
      
      <Box mt={4}>
        <Grid container spacing={3}>
          {/* Performance Metrics */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Trends
                </Typography>
                <Box height={300}>
                  <Line
                    data={{
                      labels: ['1h ago', '45m ago', '30m ago', '15m ago', 'Now'],
                      datasets: [
                        {
                          label: 'Average Score',
                          data: [
                            metrics.averageScore - 20,
                            metrics.averageScore - 15,
                            metrics.averageScore - 10,
                            metrics.averageScore - 5,
                            metrics.averageScore
                          ],
                          borderColor: 'rgb(75, 192, 192)',
                          tension: 0.1
                        },
                        {
                          label: 'Completion Time',
                          data: [
                            metrics.averageCompletionTime - 50,
                            metrics.averageCompletionTime - 40,
                            metrics.averageCompletionTime - 30,
                            metrics.averageCompletionTime - 20,
                            metrics.averageCompletionTime
                          ],
                          borderColor: 'rgb(255, 99, 132)',
                          tension: 0.1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Alerts */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <AlertList
                  alerts={alerts}
                  onAcknowledge={handleAcknowledgeAlert}
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* System Performance */}
          <Grid item xs={12}>
            <PerformancePanel />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default MetricsDashboard; 