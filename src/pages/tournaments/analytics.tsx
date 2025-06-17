import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material';
import {
  Analytics,
  Timeline,
  ShowChart,
  TrendingUp,
  EmojiEvents,
  Speed,
  Target,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import TournamentAnalytics from '../../components/tournament/TournamentAnalytics';
import { Tournament } from '../../types/tournament';

// Cyberpunk styled components
const CyberpunkContainer = styled(Container)(({ theme }) => ({
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

const NeonPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)',
  border: '2px solid #00d4ff',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
  backdropFilter: 'blur(10px)',
}));

const NeonTypography = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(45deg, #00d4ff, #ff00ff)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
  fontWeight: 'bold',
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  color: '#cccccc',
  '&.Mui-selected': {
    color: '#00d4ff',
  },
  '&:hover': {
    color: '#00d4ff',
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: '#00d4ff',
    height: '3px',
  },
}));

// Mock tournament data for demonstration
const mockTournament: Tournament = {
  id: 'tournament-1',
  name: 'Cyberpunk Championship 2025',
  description: 'The ultimate pool tournament with AI referee integration and real-time analytics',
  venueId: 'venue-1',
  organizerId: 'organizer-1',
  startDate: '2025-01-30T10:00:00Z',
  endDate: '2025-01-30T18:00:00Z',
  registrationDeadline: '2025-01-29T23:59:59Z',
  maxParticipants: 32,
  entryFee: 50,
  prizePool: 5000,
  status: 'in_progress',
  format: 'single_elimination',
  rules: 'Standard 8-ball pool rules with AI referee',
  createdAt: '2025-01-25T00:00:00Z',
  updatedAt: '2025-01-30T12:00:00Z',
  players: [
    { id: 'player-1', name: 'Neon Shadow', score: 150, rank: 1 },
    { id: 'player-2', name: 'Cyber Striker', score: 145, rank: 2 },
    { id: 'player-3', name: 'Digital Phantom', score: 140, rank: 3 },
    { id: 'player-4', name: 'Quantum Pool', score: 135, rank: 4 },
    { id: 'player-5', name: 'Matrix Master', score: 130, rank: 5 },
    { id: 'player-6', name: 'Hologram Hunter', score: 125, rank: 6 },
    { id: 'player-7', name: 'Virtual Vanguard', score: 120, rank: 7 },
    { id: 'player-8', name: 'Pixel Prowler', score: 115, rank: 8 },
  ],
  matches: [
    {
      id: 'match-1',
      tournamentId: 'tournament-1',
      player1Id: 'player-1',
      player2Id: 'player-2',
      player1Name: 'Neon Shadow',
      player2Name: 'Cyber Striker',
      player1Score: 75,
      player2Score: 65,
      player1Fouls: 2,
      player2Fouls: 3,
      player1Shots: 45,
      player2Shots: 42,
      player1HighestBreak: 25,
      player2HighestBreak: 20,
      player1Breaks: 8,
      player2Breaks: 6,
      winnerId: 'player-1',
      status: 'completed',
      duration: 1800,
      roundNumber: 1,
      matchNumber: 1,
      createdAt: '2025-01-30T10:00:00Z',
      updatedAt: '2025-01-30T10:30:00Z',
    },
    {
      id: 'match-2',
      tournamentId: 'tournament-1',
      player1Id: 'player-3',
      player2Id: 'player-4',
      player1Name: 'Digital Phantom',
      player2Name: 'Quantum Pool',
      player1Score: 70,
      player2Score: 60,
      player1Fouls: 1,
      player2Fouls: 2,
      player1Shots: 40,
      player2Shots: 38,
      player1HighestBreak: 22,
      player2HighestBreak: 18,
      player1Breaks: 7,
      player2Breaks: 5,
      winnerId: 'player-3',
      status: 'completed',
      duration: 1650,
      roundNumber: 1,
      matchNumber: 2,
      createdAt: '2025-01-30T10:30:00Z',
      updatedAt: '2025-01-30T10:57:30Z',
    },
    {
      id: 'match-3',
      tournamentId: 'tournament-1',
      player1Id: 'player-5',
      player2Id: 'player-6',
      player1Name: 'Matrix Master',
      player2Name: 'Hologram Hunter',
      player1Score: 0,
      player2Score: 0,
      player1Fouls: 0,
      player2Fouls: 0,
      player1Shots: 0,
      player2Shots: 0,
      player1HighestBreak: 0,
      player2HighestBreak: 0,
      player1Breaks: 0,
      player2Breaks: 0,
      status: 'in_progress',
      duration: 0,
      roundNumber: 1,
      matchNumber: 3,
      createdAt: '2025-01-30T11:00:00Z',
      updatedAt: '2025-01-30T11:00:00Z',
    },
  ],
};

const TournamentAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const tabs = [
    { label: 'Overview', icon: <Analytics />, value: 0 },
    { label: 'Player Rankings', icon: <EmojiEvents />, value: 1 },
    { label: 'Match Analytics', icon: <Timeline />, value: 2 },
    { label: 'Performance Trends', icon: <TrendingUp />, value: 3 },
    { label: 'Advanced Stats', icon: <ShowChart />, value: 4 },
  ];

  return (
    <CyberpunkContainer maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <NeonTypography variant="h3" component="h1" gutterBottom>
          Tournament Analytics Dashboard
        </NeonTypography>
        <Typography variant="h6" sx={{ color: '#cccccc', mb: 2 }}>
          Real-time performance tracking and statistical analysis
        </Typography>
        
        {/* Tournament Info */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Chip
            label={mockTournament.status}
            sx={{
              background: mockTournament.status === 'completed' ? '#00ff00' : 
                         mockTournament.status === 'in_progress' ? '#ffaa00' : '#ff00ff',
              color: '#ffffff',
              fontWeight: 'bold',
            }}
          />
          <Chip
            label={mockTournament.format}
            sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff00ff)',
              color: '#ffffff',
            }}
          />
          <Chip
            label={`$${mockTournament.prizePool} Prize Pool`}
            sx={{
              background: '#ffaa00',
              color: '#ffffff',
              fontWeight: 'bold',
            }}
          />
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <NeonPaper sx={{ p: 3 }}>
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: '#333', mb: 3 }}>
          <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabScrollButton-root': {
                color: '#00d4ff',
              },
            }}
          >
            {tabs.map((tab) => (
              <StyledTab
                key={tab.value}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {tab.icon}
                    {tab.label}
                  </Box>
                }
                value={tab.value}
              />
            ))}
          </StyledTabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ minHeight: '600px' }}>
          {activeTab === 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" sx={{ color: '#00d4ff' }}>
                  Tournament Overview
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{
                    borderColor: '#00d4ff',
                    color: '#00d4ff',
                    '&:hover': {
                      borderColor: '#ff00ff',
                      color: '#ff00ff',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Refresh Data'}
                </Button>
              </Box>
              
              <TournamentAnalytics
                tournament={mockTournament}
                onRefresh={handleRefresh}
              />
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h5" sx={{ color: '#00d4ff', mb: 3 }}>
                Player Rankings & Performance
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="body1" sx={{ color: '#cccccc', mb: 2 }}>
                    Detailed player performance metrics and rankings
                  </Typography>
                  {/* Player rankings component would go here */}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body1" sx={{ color: '#cccccc', mb: 2 }}>
                    Performance highlights and achievements
                  </Typography>
                  {/* Performance highlights component would go here */}
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h5" sx={{ color: '#00d4ff', mb: 3 }}>
                Match Analytics & Statistics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" sx={{ color: '#cccccc', mb: 2 }}>
                    Individual match analysis and key moments
                  </Typography>
                  {/* Match analytics component would go here */}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" sx={{ color: '#cccccc', mb: 2 }}>
                    Shot patterns and strategy analysis
                  </Typography>
                  {/* Shot analysis component would go here */}
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h5" sx={{ color: '#00d4ff', mb: 3 }}>
                Performance Trends & Historical Data
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" sx={{ color: '#cccccc', mb: 2 }}>
                    Player improvement trends over time
                  </Typography>
                  {/* Trends component would go here */}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" sx={{ color: '#cccccc', mb: 2 }}>
                    Historical tournament comparisons
                  </Typography>
                  {/* Historical data component would go here */}
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 4 && (
            <Box>
              <Typography variant="h5" sx={{ color: '#00d4ff', mb: 3 }}>
                Advanced Statistics & AI Insights
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '1px solid #333', borderRadius: '8px' }}>
                    <Speed sx={{ color: '#00d4ff', fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff' }}>
                      Shot Speed Analysis
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cccccc' }}>
                      Average shot times and speed patterns
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '1px solid #333', borderRadius: '8px' }}>
                    <Target sx={{ color: '#ff00ff', fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff' }}>
                      Accuracy Metrics
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cccccc' }}>
                      Shot accuracy and precision analysis
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '1px solid #333', borderRadius: '8px' }}>
                    <ShowChart sx={{ color: '#ffaa00', fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff' }}>
                      AI Predictions
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cccccc' }}>
                      Machine learning insights and predictions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </NeonPaper>
    </CyberpunkContainer>
  );
};

export default TournamentAnalyticsPage; 