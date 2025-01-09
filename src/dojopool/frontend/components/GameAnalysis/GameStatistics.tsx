import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
} from 'recharts';
import { styled } from '@mui/material/styles';

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

interface GameStatisticsProps {
  statistics: {
    shot_stats: any;
    positional_stats: any;
    scoring_stats: any;
    player_stats: any;
  };
}

export const GameStatistics: React.FC<GameStatisticsProps> = ({ statistics }) => {
  if (!statistics) {
    return (
      <Typography color="textSecondary">
        No statistics available
      </Typography>
    );
  }

  const prepareChartData = (stats: any) => {
    return Object.entries(stats).map(([key, value]) => ({
      name: key.replace(/_/g, ' ').toUpperCase(),
      value: typeof value === 'number' ? value : 0,
    }));
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Shot Statistics */}
        <Grid item xs={12}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shot Statistics
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={prepareChartData(statistics.shot_stats)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Positional Statistics */}
        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Positional Statistics
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(statistics.positional_stats).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell component="th" scope="row">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </TableCell>
                        <TableCell align="right">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Scoring Statistics */}
        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scoring Statistics
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(statistics.scoring_stats).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell component="th" scope="row">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </TableCell>
                        <TableCell align="right">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Player Statistics */}
        <Grid item xs={12}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Player Statistics
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={prepareChartData(statistics.player_stats)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GameStatistics; 