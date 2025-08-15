import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Analytics as AnalyticsIcon,
  Insights as InsightsIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  EmojiEvents as TrophyIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useAdvancedTournament, AdvancedTournamentConfig, TournamentAnalytics, TournamentInsights, TournamentBracket, BracketNode } from '../../hooks/useAdvancedTournament';

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
      id={`tournament-tabpanel-${index}`}
      aria-labelledby={`tournament-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AdvancedTournamentDashboard: React.FC = () => {
  const {
    tournaments,
    currentTournament,
    bracket,
    analytics,
    insights,
    loading,
    error,
    createTournament,
    getTournament,
    generateBracket,
    registerPlayer,
    withdrawPlayer,
    updateMatch,
    startTournament,
    completeTournament,
    generateAnalytics,
    generateInsights,
    getAnalyticsOverview,
    refreshTournament,
    clearError
  } = useAdvancedTournament();

  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);

  // Form state for creating tournament
  const [tournamentConfig, setTournamentConfig] = useState<Partial<AdvancedTournamentConfig>>({
    name: '',
    format: 'SINGLE_ELIMINATION',
    venueId: '',
    startDate: new Date(),
    endDate: new Date(),
    maxParticipants: 16,
    entryFee: 50,
    prizePool: 1000,
    seedingMethod: 'random',
    consolationRounds: false,
    autoStart: false,
    autoAdvance: false,
    timeLimit: 30,
    breakTime: 5,
    rules: [],
    requirements: {},
    analytics: {
      enabled: true,
      trackPerformance: true,
      trackEngagement: true,
      generateInsights: true,
      realTimeUpdates: true
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
      webhook: false
    }
  });

  useEffect(() => {
    loadAnalyticsOverview();
  }, []);

  const loadAnalyticsOverview = async () => {
    try {
      const overview = await getAnalyticsOverview();
      setAnalyticsOverview(overview);
    } catch (err) {
      console.error('Failed to load analytics overview:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTournament = async () => {
    try {
      if (!tournamentConfig.name || !tournamentConfig.venueId) {
        return;
      }

      const config: AdvancedTournamentConfig = {
        id: `tournament_${Date.now()}`,
        name: tournamentConfig.name,
        format: tournamentConfig.format as any,
        venueId: tournamentConfig.venueId,
        startDate: tournamentConfig.startDate as Date,
        endDate: tournamentConfig.endDate as Date,
        maxParticipants: tournamentConfig.maxParticipants || 16,
        entryFee: tournamentConfig.entryFee || 50,
        prizePool: tournamentConfig.prizePool || 1000,
        seedingMethod: tournamentConfig.seedingMethod || 'random',
        consolationRounds: tournamentConfig.consolationRounds || false,
        autoStart: tournamentConfig.autoStart || false,
        autoAdvance: tournamentConfig.autoAdvance || false,
        timeLimit: tournamentConfig.timeLimit || 30,
        breakTime: tournamentConfig.breakTime || 5,
        rules: tournamentConfig.rules || [],
        requirements: tournamentConfig.requirements || {},
        analytics: tournamentConfig.analytics || {
          enabled: true,
          trackPerformance: true,
          trackEngagement: true,
          generateInsights: true,
          realTimeUpdates: true
        },
        notifications: tournamentConfig.notifications || {
          email: true,
          sms: false,
          push: true,
          webhook: false
        }
      };

      await createTournament(config);
      setCreateDialogOpen(false);
      setTournamentConfig({
        name: '',
        format: 'SINGLE_ELIMINATION',
        venueId: '',
        startDate: new Date(),
        endDate: new Date(),
        maxParticipants: 16,
        entryFee: 50,
        prizePool: 1000,
        seedingMethod: 'random',
        consolationRounds: false,
        autoStart: false,
        autoAdvance: false,
        timeLimit: 30,
        breakTime: 5,
        rules: [],
        requirements: {},
        analytics: {
          enabled: true,
          trackPerformance: true,
          trackEngagement: true,
          generateInsights: true,
          realTimeUpdates: true
        },
        notifications: {
          email: true,
          sms: false,
          push: true,
          webhook: false
        }
      });
    } catch (err) {
      console.error('Failed to create tournament:', err);
    }
  };

  const handleSelectTournament = async (tournamentId: string) => {
    try {
      setSelectedTournamentId(tournamentId);
      await getTournament(tournamentId);
    } catch (err) {
      console.error('Failed to select tournament:', err);
    }
  };

  const handleGenerateBracket = async () => {
    if (!currentTournament) return;
    try {
      await generateBracket(currentTournament.id);
    } catch (err) {
      console.error('Failed to generate bracket:', err);
    }
  };

  const handleStartTournament = async () => {
    if (!currentTournament) return;
    try {
      await startTournament(currentTournament.id);
    } catch (err) {
      console.error('Failed to start tournament:', err);
    }
  };

  const handleCompleteTournament = async () => {
    if (!currentTournament) return;
    try {
      await completeTournament(currentTournament.id);
    } catch (err) {
      console.error('Failed to complete tournament:', err);
    }
  };

  const handleGenerateAnalytics = async () => {
    if (!currentTournament) return;
    try {
      await generateAnalytics(currentTournament.id);
    } catch (err) {
      console.error('Failed to generate analytics:', err);
    }
  };

  const handleGenerateInsights = async () => {
    if (!currentTournament) return;
    try {
      await generateInsights(currentTournament.id);
    } catch (err) {
      console.error('Failed to generate insights:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'REGISTRATION_OPEN': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'SINGLE_ELIMINATION': return 'Single Elimination';
      case 'DOUBLE_ELIMINATION': return 'Double Elimination';
      case 'ROUND_ROBIN': return 'Round Robin';
      case 'SWISS': return 'Swiss System';
      default: return format;
    }
  };

  const renderBracketNode = (node: BracketNode) => (
    <Box
      key={node.id}
      sx={{
        border: '1px solid #ddd',
        borderRadius: 1,
        p: 1,
        mb: 1,
        backgroundColor: node.status === 'completed' ? '#e8f5e8' : 
                        node.status === 'active' ? '#fff3cd' : '#f8f9fa'
      }}
    >
      <Typography variant="caption" color="textSecondary">
        Round {node.round} - Match {node.position + 1}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Typography variant="body2">
          {node.player1Id || 'TBD'} vs {node.player2Id || 'TBD'}
        </Typography>
        <Chip
          label={node.status}
          size="small"
          color={node.status === 'completed' ? 'success' : 
                 node.status === 'active' ? 'warning' : 'default'}
        />
      </Box>
      {node.score && (
        <Typography variant="caption" color="textSecondary">
          Score: {node.score}
        </Typography>
      )}
      {node.winnerId && (
        <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
          Winner: {node.winnerId}
        </Typography>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading Advanced Tournament Dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Advanced Tournament Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Tournament
        </Button>
      </Box>

      {/* Analytics Overview */}
      {analyticsOverview && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Tournaments
                </Typography>
                <Typography variant="h4">
                  {analyticsOverview.totalTournaments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Tournaments
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {analyticsOverview.activeTournaments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Participants
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {analyticsOverview.totalParticipants}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4" color="success.main">
                  ${analyticsOverview.totalRevenue?.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Content */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="tournament tabs">
            <Tab label="Tournaments" />
            <Tab label="Bracket View" />
            <Tab label="Analytics" />
            <Tab label="Insights" />
          </Tabs>
        </Box>

        {/* Tournaments Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Tournaments</Typography>
                  <IconButton onClick={() => refreshTournament('')}>
                    <RefreshIcon />
                  </IconButton>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Format</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Participants</TableCell>
                        <TableCell>Prize Pool</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tournaments.map((tournament) => (
                        <TableRow
                          key={tournament.id}
                          hover
                          selected={selectedTournamentId === tournament.id}
                          onClick={() => handleSelectTournament(tournament.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{tournament.name}</TableCell>
                          <TableCell>{getFormatLabel(tournament.format)}</TableCell>
                          <TableCell>
                            <Chip
                              label={tournament.status}
                              color={getStatusColor(tournament.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {tournament.participants.length}/{tournament.maxParticipants}
                          </TableCell>
                          <TableCell>${tournament.prizePool}</TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Tournament Details */}
            <Grid item xs={12} md={4}>
              {currentTournament ? (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Tournament Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Name"
                        secondary={currentTournament.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Format"
                        secondary={getFormatLabel(currentTournament.format)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={currentTournament.status}
                            color={getStatusColor(currentTournament.status) as any}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Participants"
                        secondary={`${currentTournament.participants.length}/${currentTournament.maxParticipants}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Entry Fee"
                        secondary={`$${currentTournament.entryFee}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Prize Pool"
                        secondary={`$${currentTournament.prizePool}`}
                      />
                    </ListItem>
                  </List>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {currentTournament.status === 'DRAFT' && (
                      <>
                        <Button
                          variant="contained"
                          onClick={handleGenerateBracket}
                          startIcon={<TimelineIcon />}
                        >
                          Generate Bracket
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleStartTournament}
                          startIcon={<StartIcon />}
                        >
                          Start Tournament
                        </Button>
                      </>
                    )}
                    {currentTournament.status === 'IN_PROGRESS' && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleCompleteTournament}
                        startIcon={<StopIcon />}
                      >
                        Complete Tournament
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={handleGenerateAnalytics}
                      startIcon={<AnalyticsIcon />}
                    >
                      Generate Analytics
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleGenerateInsights}
                      startIcon={<InsightsIcon />}
                    >
                      Generate Insights
                    </Button>
                  </Box>
                </Paper>
              ) : (
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    Select a tournament to view details
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Bracket View Tab */}
        <TabPanel value={tabValue} index={1}>
          {bracket ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Tournament Bracket
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({ length: bracket.rounds }, (_, roundIndex) => (
                  <Accordion key={roundIndex}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">
                        Round {roundIndex + 1}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {bracket.nodes
                          .filter(node => node.round === roundIndex + 1)
                          .map(renderBracketNode)}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No bracket available. Generate a bracket first.
              </Typography>
            </Paper>
          )}
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          {analytics ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Total Matches"
                          secondary={analytics.totalMatches}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Completed Matches"
                          secondary={analytics.completedMatches}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Average Match Duration"
                          secondary={`${Math.round(analytics.averageMatchDuration / 60000)} minutes`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Average Score"
                          secondary={analytics.performanceMetrics.averageScore.toFixed(1)}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Engagement Metrics
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Participant Engagement"
                          secondary={`${analytics.participantEngagement}%`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Spectator Count"
                          secondary={analytics.spectatorCount}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Social Media Engagement"
                          secondary={analytics.socialMediaEngagement}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Venue Revenue"
                          secondary={`$${analytics.venueRevenue}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Player Insights
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2" color="primary">
                          Top Performers
                        </Typography>
                        <List dense>
                          {analytics.playerInsights.topPerformers.map((player, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={player} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2" color="primary">
                          Most Improved
                        </Typography>
                        <List dense>
                          {analytics.playerInsights.mostImproved.map((player, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={player} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2" color="primary">
                          Consistent Players
                        </Typography>
                        <List dense>
                          {analytics.playerInsights.consistentPlayers.map((player, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={player} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2" color="primary">
                          Clutch Players
                        </Typography>
                        <List dense>
                          {analytics.playerInsights.clutchPlayers.map((player, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={player} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No analytics available. Generate analytics first.
              </Typography>
            </Paper>
          )}
        </TabPanel>

        {/* Insights Tab */}
        <TabPanel value={tabValue} index={3}>
          {insights ? (
            <Grid container spacing={3}>
              {insights.insights.map((insight, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {insight.title}
                        </Typography>
                        <Chip
                          label={`${Math.round(insight.confidence * 100)}% confidence`}
                          color={insight.confidence > 0.8 ? 'success' : 
                                 insight.confidence > 0.6 ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Typography color="textSecondary" paragraph>
                        {insight.description}
                      </Typography>
                      {insight.actionable && insight.recommendations.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Recommendations:
                          </Typography>
                          <List dense>
                            {insight.recommendations.map((rec, recIndex) => (
                              <ListItem key={recIndex}>
                                <ListItemText primary={rec} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No insights available. Generate insights first.
              </Typography>
            </Paper>
          )}
        </TabPanel>
      </Box>

      {/* Create Tournament Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Tournament</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tournament Name"
                value={tournamentConfig.name}
                onChange={(e) => setTournamentConfig({ ...tournamentConfig, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={tournamentConfig.format}
                  onChange={(e) => setTournamentConfig({ ...tournamentConfig, format: e.target.value as any })}
                >
                  <MenuItem value="SINGLE_ELIMINATION">Single Elimination</MenuItem>
                  <MenuItem value="DOUBLE_ELIMINATION">Double Elimination</MenuItem>
                  <MenuItem value="ROUND_ROBIN">Round Robin</MenuItem>
                  <MenuItem value="SWISS">Swiss System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Venue ID"
                value={tournamentConfig.venueId}
                onChange={(e) => setTournamentConfig({ ...tournamentConfig, venueId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Participants"
                type="number"
                value={tournamentConfig.maxParticipants}
                onChange={(e) => setTournamentConfig({ ...tournamentConfig, maxParticipants: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Entry Fee"
                type="number"
                value={tournamentConfig.entryFee}
                onChange={(e) => setTournamentConfig({ ...tournamentConfig, entryFee: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prize Pool"
                type="number"
                value={tournamentConfig.prizePool}
                onChange={(e) => setTournamentConfig({ ...tournamentConfig, prizePool: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Analytics Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={tournamentConfig.analytics?.enabled}
                        onChange={(e) => setTournamentConfig({
                          ...tournamentConfig,
                          analytics: { ...tournamentConfig.analytics, enabled: e.target.checked }
                        })}
                      />
                    }
                    label="Enable Analytics"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={tournamentConfig.analytics?.realTimeUpdates}
                        onChange={(e) => setTournamentConfig({
                          ...tournamentConfig,
                          analytics: { ...tournamentConfig.analytics, realTimeUpdates: e.target.checked }
                        })}
                      />
                    }
                    label="Real-time Updates"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTournament} variant="contained">
            Create Tournament
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}; 