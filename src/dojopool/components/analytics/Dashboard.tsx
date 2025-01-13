import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, useTheme } from '@mui/material';
import { MetricsChart } from './MetricsChart';
import { MetricsTable } from './MetricsTable';
import { MetricsSummary } from './MetricsSummary';
import { DateRangePicker } from './DateRangePicker';
import { FilterPanel } from './FilterPanel';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formatDate } from '../../utils/dateUtils';

interface DashboardProps {
  userId?: number;
  isAdmin: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ userId, isAdmin }) => {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'games_played',
    'win_rate',
    'avg_score',
  ]);
  const [selectedDimension, setSelectedDimension] = useState('user');
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const { metrics, loading, error, fetchMetrics, fetchAggregatedMetrics } = useAnalytics();

  useEffect(() => {
    if (isAdmin) {
      fetchAggregatedMetrics({
        metricType: selectedMetrics[0],
        dimension: selectedDimension,
        period: selectedPeriod,
        startDate: formatDate(dateRange.startDate),
        endDate: formatDate(dateRange.endDate),
      });
    } else if (userId) {
      fetchMetrics({
        userId,
        metricType: selectedMetrics[0],
        period: selectedPeriod,
        startDate: formatDate(dateRange.startDate),
        endDate: formatDate(dateRange.endDate),
      });
    }
  }, [userId, isAdmin, selectedMetrics, selectedDimension, selectedPeriod, dateRange]);

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics Dashboard
        </Typography>

        <Grid container spacing={3}>
          {/* Filters */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <DateRangePicker
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onChange={setDateRange}
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <FilterPanel
                    selectedMetrics={selectedMetrics}
                    selectedDimension={selectedDimension}
                    selectedPeriod={selectedPeriod}
                    onMetricsChange={setSelectedMetrics}
                    onDimensionChange={setSelectedDimension}
                    onPeriodChange={setSelectedPeriod}
                    isAdmin={isAdmin}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Summary Cards */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {selectedMetrics.map((metric) => (
                <Grid item xs={12} sm={6} md={4} key={metric}>
                  <MetricsSummary metric={metric} data={metrics} loading={loading} />
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <MetricsChart data={metrics} metrics={selectedMetrics} period={selectedPeriod} />
              )}
            </Paper>
          </Grid>

          {/* Detailed Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <MetricsTable data={metrics} metrics={selectedMetrics} loading={loading} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
