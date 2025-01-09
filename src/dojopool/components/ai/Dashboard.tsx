import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Psychology as AIIcon,
  Speed as PerformanceIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { MatchStory } from './MatchStory';
import { Recommendations } from './Recommendations';
import { MatchAnalysis } from './MatchAnalysis';
import { DifficultySettings } from './DifficultySettings';
import { AIMetrics } from './AIMetrics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      sx={{ py: 3 }}
    >
      {value === index && children}
    </Box>
  );
};

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data from your AI service endpoints
        const response = await fetch('/api/ai/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch AI dashboard data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleBookmark = async () => {
    // Implement bookmark functionality
  };

  const handleShare = async () => {
    // Implement share functionality
  };

  const handleParameterChange = (name: string, value: number) => {
    // Implement difficulty parameter change
  };

  const handleReset = () => {
    // Implement settings reset
  };

  const handleRefresh = async () => {
    // Implement metrics refresh
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          AI Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View AI-powered insights, recommendations, and performance metrics
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="AI dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<AnalyticsIcon />}
            label="Match Analysis"
            id="ai-tab-0"
            aria-controls="ai-tabpanel-0"
          />
          <Tab
            icon={<AIIcon />}
            label="Recommendations"
            id="ai-tab-1"
            aria-controls="ai-tabpanel-1"
          />
          <Tab
            icon={<PerformanceIcon />}
            label="AI Metrics"
            id="ai-tab-2"
            aria-controls="ai-tabpanel-2"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Difficulty Settings"
            id="ai-tab-3"
            aria-controls="ai-tabpanel-3"
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <MatchAnalysis
              metrics={data?.analysis.metrics || []}
              keyMoments={data?.analysis.keyMoments || []}
              patterns={data?.analysis.patterns || []}
              summary={data?.analysis.summary || ''}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MatchStory
              title={data?.story.title || ''}
              date={data?.story.date || ''}
              players={data?.story.players || []}
              story={data?.story.content || ''}
              highlights={data?.story.highlights || []}
              isBookmarked={data?.story.isBookmarked || false}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Recommendations
          recommendations={data?.recommendations || []}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <AIMetrics
          systemMetrics={data?.metrics.system || []}
          performanceMetrics={data?.metrics.performance || []}
          lastUpdated={data?.metrics.lastUpdated || ''}
          onRefresh={handleRefresh}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <DifficultySettings
          parameters={data?.difficulty.parameters || []}
          onParameterChange={handleParameterChange}
          onReset={handleReset}
          adaptiveScore={data?.difficulty.adaptiveScore || 0}
        />
      </TabPanel>
    </Container>
  );
}; 