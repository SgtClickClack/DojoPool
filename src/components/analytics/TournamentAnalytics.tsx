import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Analytics,
  Assessment,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
  Download,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import TournamentAnalyticsService, {
  TournamentStats,
  PlayerAnalytics,
  MatchAnalytics,
  PredictiveInsights,
  AnalyticsConfig,
} from '../../services/analytics/TournamentAnalyticsService';
import type { TournamentAnalytics as TournamentAnalyticsData } from '../../services/analytics/TournamentAnalyticsService';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [playerAnalytics, setPlayerAnalytics] = useState<PlayerAnalytics[]>([]);
  const [matchAnalytics, setMatchAnalytics] = useState<MatchAnalytics[]>([]);
  const [tournamentAnalytics, setTournamentAnalytics] = useState<TournamentAnalyticsData[]>([]);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsights[]>([]);
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [exportFormat, setExportFormat] = useState('JSON');
  const [selectedReport, setSelectedReport] = useState('comprehensive');

  const analyticsService = TournamentAnalyticsService.getInstance();

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(analyticsService.getStats());
      setPlayerAnalytics(analyticsService.getPlayerAnalytics());
      setMatchAnalytics(analyticsService.getMatchAnalytics());
      setTournamentAnalytics(analyticsService.getTournamentAnalytics());
      setPredictiveInsights(analyticsService.getPredictiveInsights());
      setConfig(analyticsService.getConfig());
      setIsConnected(analyticsService.isConnected());
    }, 2000);

    return () => clearInterval(interval);
  }, [analyticsService]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExport = () => {
    const report = analyticsService.generateReport(selectedReport as any);
    const data = analyticsService.exportData(exportFormat, report);
    
    // Create and download file
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-analytics-${selectedReport}-${new Date().toISOString().split('T')[0]}.${exportFormat.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp color="success" />;
      case 'declining':
        return <TrendingDown color="error" />;
      default:
        return <Timeline color="info" />;
    }
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'success';
    if (value >= threshold * 0.7) return 'warning';
    return 'error';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#00ff9d' }}>
          Tournament Analytics
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#00a8ff', mb: 2 }}>
          Advanced analytics and predictive insights for tournament performance
        </Typography>
        
        <Alert 
          severity={isConnected ? 'success' : 'error'} 
          sx={{ mb: 2 }}
          icon={isConnected ? <CheckCircle /> : <Error />}
        >
          {isConnected ? 'Connected to analytics service' : 'Disconnected from analytics service'}
        </Alert>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ 
            '& .MuiTab-root': { 
              color: '#ffffff',
              '&.Mui-selected': { color: '#00ff9d' }
            }
          }}
        >
          <Tab label="Overview" icon={<Analytics />} iconPosition="start" />
          <Tab label="Players" icon={<BarChart />} iconPosition="start" />
          <Tab label="Matches" icon={<ShowChart />} iconPosition="start" />
          <Tab label="Tournaments" icon={<PieChart />} iconPosition="start" />
          <Tab label="Predictions" icon={<Assessment />} iconPosition="start" />
          <Tab label="Reports" icon={<Download />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {stats && (
            <>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00ff9d', mb: 1 }}>
                      Total Tournaments
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ffffff' }}>
                      {stats.totalTournaments}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {stats.activeTournaments} active
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00a8ff', mb: 1 }}>
                      Total Players
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ffffff' }}>
                      {stats.totalPlayers}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {stats.totalMatches} matches played
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#feca57', mb: 1 }}>
                      Average Duration
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ffffff' }}>
                      {Math.round(stats.averageMatchDuration)}m
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Per match
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 1 }}>
                      Total Prize Pool
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ffffff' }}>
                      {formatCurrency(stats.totalPrizePool)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {formatCurrency(stats.averagePrizePool)} avg
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {playerAnalytics.map((player) => (
            <Grid item xs={12} md={6} lg={4} key={player.playerId}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {player.name}
                    </Typography>
                    {getTrendIcon(player.performanceTrend)}
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    Rank #{player.rank} • Skill Rating: {player.skillRating}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>
                      Win Rate: {formatPercentage(player.winRate)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={player.winRate * 100} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: '#333',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getStatusColor(player.winRate, 0.5) === 'success' ? '#00ff9d' : 
                                  getStatusColor(player.winRate, 0.5) === 'warning' ? '#feca57' : '#ff6b6b'
                        }
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Matches: {player.totalMatches}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Wins: {player.wins}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#00a8ff' }}>
                    Prize Money: {formatCurrency(player.totalPrizeMoney)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {matchAnalytics.map((match) => (
            <Grid item xs={12} md={6} key={match.matchId}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                    {match.player1Name} vs {match.player2Name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h4" sx={{ color: '#ffffff' }}>
                      {match.player1Score} - {match.player2Score}
                    </Typography>
                    <Chip 
                      label={match.difficulty} 
                      color={match.difficulty === 'hard' ? 'error' : match.difficulty === 'medium' ? 'warning' : 'success'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Excitement Level: {match.excitement}/10
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={match.excitement * 10} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: '#333',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#feca57'
                        }
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Duration: {Math.round(match.duration)}m
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Viewers: {match.viewership}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Accuracy: {formatPercentage(match.accuracy)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {tournamentAnalytics.map((tournament) => (
            <Grid item xs={12} md={6} key={tournament.tournamentId}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                    {tournament.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Type: {tournament.type}
                    </Typography>
                    <Chip 
                      label={`ROI: ${tournament.roi.toFixed(2)}x`} 
                      color={tournament.roi > 1.5 ? 'success' : tournament.roi > 1.0 ? 'warning' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Completion Rate: {formatPercentage(tournament.completionRate)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={tournament.completionRate * 100} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: '#333',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getStatusColor(tournament.completionRate, 0.8) === 'success' ? '#00ff9d' : 
                                  getStatusColor(tournament.completionRate, 0.8) === 'warning' ? '#feca57' : '#ff6b6b'
                        }
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Players: {tournament.totalPlayers}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Matches: {tournament.totalMatches}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Viewers: {tournament.viewership}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#00a8ff' }}>
                    Prize Pool: {formatCurrency(tournament.totalPrizePool)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          {predictiveInsights.map((insight) => (
            <Grid item xs={12} md={6} key={insight.tournamentId}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                    Tournament Predictions
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Predicted Winner: {insight.predictedWinner}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Win Probability: {formatPercentage(insight.winProbability)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Confidence: {formatPercentage(insight.confidence)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Expected Duration: {Math.round(insight.expectedDuration)} minutes
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Predicted Viewership: {insight.predictedViewership}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#00a8ff' }}>
                      Revenue Forecast: {formatCurrency(insight.revenueForecast)}
                    </Typography>
                  </Box>
                  
                  {insight.riskFactors.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#ff6b6b', mb: 1 }}>
                        Risk Factors:
                      </Typography>
                      {insight.riskFactors.map((risk, index) => (
                        <Chip 
                          key={index}
                          label={risk} 
                          color="error" 
                          size="small" 
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  {insight.recommendations.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#00ff9d', mb: 1 }}>
                        Recommendations:
                      </Typography>
                      {insight.recommendations.map((rec, index) => (
                        <Typography key={index} variant="body2" sx={{ color: '#888', mb: 0.5 }}>
                          • {rec}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#00ff9d', mb: 3 }}>
              Generate Analytics Reports
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#888' }}>Report Type</InputLabel>
                  <Select
                    value={selectedReport}
                    onChange={(e) => setSelectedReport(e.target.value)}
                    sx={{ 
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff9d' }
                    }}
                  >
                    <MenuItem value="comprehensive">Comprehensive Report</MenuItem>
                    <MenuItem value="tournament">Tournament Report</MenuItem>
                    <MenuItem value="player">Player Report</MenuItem>
                    <MenuItem value="match">Match Report</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#888' }}>Export Format</InputLabel>
                  <Select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    sx={{ 
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff9d' }
                    }}
                  >
                    <MenuItem value="JSON">JSON</MenuItem>
                    <MenuItem value="CSV">CSV</MenuItem>
                    <MenuItem value="PDF">PDF</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  onClick={handleExport}
                  startIcon={<Download />}
                  sx={{
                    bgcolor: '#00ff9d',
                    color: '#000',
                    '&:hover': { bgcolor: '#00cc7d' },
                    height: 56,
                    width: '100%'
                  }}
                >
                  Export Report
                </Button>
              </Grid>
            </Grid>
            
            <Alert severity="info" icon={<Info />}>
              Reports include comprehensive analytics data, insights, and recommendations based on current tournament performance.
            </Alert>
          </CardContent>
        </Card>
      </TabPanel>
    </Container>
  );
};

export default TournamentAnalytics; 