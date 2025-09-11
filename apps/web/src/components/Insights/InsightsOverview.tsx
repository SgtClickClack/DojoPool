// Local type definition
interface PlayerInsightsSummary {
  playerId: string;
  summary: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  trends?: any[];
  strengths?: string[];
  areasForImprovement?: string[];
}
import { Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import React from 'react';

const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), {
  ssr: false,
});
// @ts-ignore
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), {
  ssr: false,
});
// @ts-ignore
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), {
  ssr: false,
});
// @ts-ignore
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), {
  ssr: false,
});
// @ts-ignore
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), {
  ssr: false,
});
// @ts-ignore
const CartesianGrid = dynamic(
  () => import('recharts').then((m) => m.CartesianGrid),
  { ssr: false }
);

interface InsightsOverviewProps {
  insights: PlayerInsightsSummary;
}

const InsightsOverview: React.FC<InsightsOverviewProps> = ({ insights }) => {
  const { summary, trends, strengths, areasForImprovement } = insights;

  const performanceData = [
    { name: 'Wins', value: summary.wins, color: '#4caf50' },
    { name: 'Losses', value: summary.losses, color: '#f44336' },
  ];

  const winRateData = [
    { name: 'Win Rate', value: summary.winRate },
    { name: 'Loss Rate', value: 100 - summary.winRate },
  ];

  return (
    <Grid container spacing={3}>
      {/* Performance Overview Card */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Performance Overview
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h4"
                color="primary"
                sx={{ fontWeight: 'bold' }}
              >
                {summary.winRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Win Rate
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="h6" color="success.main">
                  {summary.wins}
                </Typography>
                <Typography variant="caption">Wins</Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="error.main">
                  {summary.losses}
                </Typography>
                <Typography variant="caption">Losses</Typography>
              </Box>
              <Box>
                <Typography variant="h6">{summary.totalMatches}</Typography>
                <Typography variant="caption">Total</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Win/Loss Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Win/Loss Distribution
            </Typography>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <BarChart
                  data={performanceData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {performanceData.map((entry, index) => (
                      <Bar
                        key={`bar-${index}`}
                        fill={entry.color}
                        dataKey={`value${index}`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Key Strengths
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {strengths.map((strength, index) => (
                  <Chip
                    key={index}
                    label={strength}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Areas for Improvement */}
      {areasForImprovement && areasForImprovement.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Areas for Improvement
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {areasForImprovement.map((area, index) => (
                  <Chip
                    key={index}
                    label={area}
                    color="warning"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default InsightsOverview;
