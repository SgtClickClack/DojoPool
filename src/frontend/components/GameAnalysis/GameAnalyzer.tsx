import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ShotAnalysis } from './ShotAnalysis';
import { GamePatterns } from './GamePatterns';
import { GameStatistics } from './GameStatistics';
import { api } from '../../services/api';

const AnalyzerContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

interface GameAnalyzerProps {
  gameId: number;
}

export const GameAnalyzer: React.FC<GameAnalyzerProps> = ({ gameId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState({
    patterns: null,
    statistics: null,
  });

  useEffect(() => {
    fetchAnalysisData();
  }, [gameId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const [patternsRes, statsRes] = await Promise.all([
        api.get(`/analysis/game/${gameId}/patterns`),
        api.get(`/analysis/game/${gameId}/statistics`),
      ]);

      setAnalysisData({
        patterns: patternsRes.data.patterns,
        statistics: statsRes.data.statistics,
      });
    } catch (err) {
      setError('Failed to load game analysis');
      console.error('Game analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={3}>
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
    <AnalyzerContainer>
      <Typography variant="h5" gutterBottom>
        Game Analysis
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 3 }}
      >
        <Tab label="Shot Analysis" />
        <Tab label="Game Patterns" />
        <Tab label="Statistics" />
      </Tabs>

      {activeTab === 0 && (
        <ShotAnalysis gameId={gameId} />
      )}

      {activeTab === 1 && (
        <GamePatterns patterns={analysisData.patterns} />
      )}

      {activeTab === 2 && (
        <GameStatistics statistics={analysisData.statistics} />
      )}
    </AnalyzerContainer>
  );
};

export default GameAnalyzer; 