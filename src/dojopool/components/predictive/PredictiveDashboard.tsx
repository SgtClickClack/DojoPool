import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PerformanceForecast } from './PerformanceForecast';
import { SkillProgression } from './SkillProgression';
import { MatchupPrediction } from './MatchupPrediction';
import { ModelMetrics } from './ModelMetrics';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { usePredictiveAnalytics } from '../../hooks/usePredictiveAnalytics';

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
      id={`predictive-tabpanel-${index}`}
      aria-labelledby={`predictive-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const PredictiveDashboard: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const { loading, error, modelMetrics, fetchModelMetrics } =
    usePredictiveAnalytics();

  useEffect(() => {
    fetchModelMetrics();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Predictive Analytics Dashboard
      </Typography>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Performance Forecast" />
          <Tab label="Skill Progression" />
          <Tab label="Matchup Prediction" />
          <Tab label="Model Metrics" />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <ErrorBoundary>
          <PerformanceForecast />
        </ErrorBoundary>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ErrorBoundary>
          <SkillProgression />
        </ErrorBoundary>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ErrorBoundary>
          <MatchupPrediction />
        </ErrorBoundary>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <ErrorBoundary>
          <ModelMetrics metrics={modelMetrics} />
        </ErrorBoundary>
      </TabPanel>
    </Box>
  );
};
