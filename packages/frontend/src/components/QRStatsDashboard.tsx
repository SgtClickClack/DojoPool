import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { api } from '../services/api';

interface QRStatsProps {
  venueId?: string;
  tableId?: string;
  timeRange?: number;  // Days
}

export const QRStatsDashboard: React.FC<QRStatsProps> = ({
  venueId,
  tableId,
  timeRange = 30
}) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [errorReport, setErrorReport] = useState<any>(null);
  const [selectedRange, setSelectedRange] = useState(timeRange);
  
  useEffect(() => {
    loadStats();
  }, [venueId, tableId, selectedRange]);
  
  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Load stats based on venue or table ID
      const statsResponse = venueId
        ? await api.get(`/venues/${venueId}/qr/stats?days=${selectedRange}`)
        : await api.get(`/tables/${tableId}/qr/stats?days=${selectedRange}`);
      
      // Load error report
      const errorResponse = await api.get('/qr/errors', {
        params: {
          venue_id: venueId,
          table_id: tableId,
          days: selectedRange
        }
      });
      
      setStats(statsResponse.data);
      setErrorReport(errorResponse.data);
      
    } catch (error) {
      console.error('Error loading QR stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!stats) {
    return (
      <Typography color="error">
        Failed to load QR code statistics
      </Typography>
    );
  }
  
  // Prepare chart data
  const dailyData = Object.entries(stats.daily_stats).map(([date, count]) => ({
    date,
    scans: count
  }));
  
  const hourlyData = Object.entries(stats.hourly_stats).map(([hour, count]) => ({
    hour: `${hour}:00`,
    scans: count
  }));
  
  return (
    <Box>
      {/* Time Range Selector */}
      <Box mb={3}>
        <FormControl>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={selectedRange}
            onChange={(e) => setSelectedRange(Number(e.target.value))}
            label="Time Range"
          >
            <MenuItem value={7}>Last 7 Days</MenuItem>
            <MenuItem value={30}>Last 30 Days</MenuItem>
            <MenuItem value={90}>Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Scans
              </Typography>
              <Typography variant="h4">
                {stats.total_scans}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h4">
                {(stats.success_rate * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Failed Scans
              </Typography>
              <Typography variant="h4" color="error">
                {stats.failed_scans}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Scan Duration
              </Typography>
              <Typography variant="h4">
                {stats.avg_scan_duration.toFixed(2)}s
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3} mb={3}>
        {/* Daily Scans Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Scans
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="scans"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Hourly Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hourly Distribution
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="scans" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Error Report */}
      {errorReport && errorReport.total_errors > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Error Report
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Error Type</TableCell>
                    <TableCell>Table ID</TableCell>
                    <TableCell>Venue ID</TableCell>
                    <TableCell>User ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errorReport.errors.map((error: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{error.error_type}</TableCell>
                      <TableCell>{error.table_id}</TableCell>
                      <TableCell>{error.venue_id}</TableCell>
                      <TableCell>{error.user_id || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}; 