import ProtectedRoute from '@/components/Common/ProtectedRoute';
import InsightsOverview from '@/components/Insights/InsightsOverview';
import MatchAnalysis from '@/components/Insights/MatchAnalysis';
import { getPlayerInsights } from '@/services/APIService';
import type { PlayerInsightsSummaryDto } from '@dojopool/shared';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const RadialBarChart = dynamic(
  () => import('recharts').then((m) => m.RadialBarChart),
  { ssr: false }
);
const RadialBar = dynamic(() => import('recharts').then((m) => m.RadialBar), {
  ssr: false,
});

const PlayerInsightsPage: React.FC = () => {
  const router = useRouter();
  const { playerId } = router.query as { playerId: string };
  const [data, setData] = useState<PlayerInsightsSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!playerId) return;
      try {
        setError(null);
        setLoading(true);
        const res = await getPlayerInsights(playerId);
        setData(res);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load insights');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [playerId]);

  return (
    <ProtectedRoute>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
            AI-Powered Player Insights
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Advanced analytics and performance tracking for competitive
            improvement
          </Typography>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={60} />
          </Box>
        )}

        {!loading && error && (
          <Paper
            sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}
          >
            <Typography variant="h6">Error Loading Insights</Typography>
            <Typography>{error}</Typography>
          </Paper>
        )}

        {!loading && data && (
          <Box>
            {/* Tab Navigation */}
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{ borderRadius: 1 }}
              >
                <Tab label="Overview" />
                <Tab label="Performance Trends" />
                <Tab label="Match Analysis" />
              </Tabs>
            </Paper>

            {/* Tab Content */}
            {activeTab === 0 && <InsightsOverview insights={data} />}

            {activeTab === 1 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Performance Trends
                </Typography>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    Performance trend analysis coming soon...
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Historical performance data and skill progression charts
                  </Typography>
                </Box>
              </Paper>
            )}

            {activeTab === 2 && (
              <Paper sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Typography variant="h5" fontWeight={600}>
                    Match Analysis
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setSelectedMatchId('sample-match-id')}
                  >
                    Analyze Recent Match
                  </Button>
                </Box>

                {selectedMatchId ? (
                  <MatchAnalysis matchId={selectedMatchId} />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      Select a match to view AI-powered analysis
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Get detailed insights on your performance, strategy, and
                      improvement areas
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        )}
      </Container>
    </ProtectedRoute>
  );
};

const Stat: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <Box>
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h5" fontWeight={700}>
      {value}
    </Typography>
  </Box>
);

export default PlayerInsightsPage;
