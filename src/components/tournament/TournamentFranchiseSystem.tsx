import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tab,
  Tabs,
  Button,
  LinearProgress,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  Business as BusinessIcon,
  Public as PublicIcon,
  TrendingUp as TrendingUpIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Tournament as TournamentIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import TournamentFranchiseService, {
  Franchise,
  GlobalTournament,
  FranchiseAnalytics,
  FranchiseVenue
} from '../../services/tournament/TournamentFranchiseService';

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
      id={`franchise-tabpanel-${index}`}
      aria-labelledby={`franchise-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentFranchiseSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [globalTournaments, setGlobalTournaments] = useState<GlobalTournament[]>([]);
  const [analytics, setAnalytics] = useState<FranchiseAnalytics[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [createFranchiseOpen, setCreateFranchiseOpen] = useState(false);
  const [createTournamentOpen, setCreateTournamentOpen] = useState(false);
  const [newFranchise, setNewFranchise] = useState<Partial<Franchise>>({});
  const [newTournament, setNewTournament] = useState<Partial<GlobalTournament>>({});

  const franchiseService = TournamentFranchiseService.getInstance();

  useEffect(() => {
    // Subscribe to franchise updates
    const franchiseSubscription = franchiseService.getFranchises().subscribe(setFranchises);
    const tournamentSubscription = franchiseService.getGlobalTournaments().subscribe(setGlobalTournaments);
    const analyticsSubscription = franchiseService.getAnalytics().subscribe(setAnalytics);

    // Load global stats
    franchiseService.getGlobalStats().then(setGlobalStats);

    return () => {
      franchiseSubscription.unsubscribe();
      tournamentSubscription.unsubscribe();
      analyticsSubscription.unsubscribe();
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateFranchise = async () => {
    try {
      await franchiseService.createFranchise(newFranchise);
      setCreateFranchiseOpen(false);
      setNewFranchise({});
    } catch (error) {
      console.error('Failed to create franchise:', error);
    }
  };

  const handleCreateGlobalTournament = async () => {
    try {
      await franchiseService.createGlobalTournament(newTournament);
      setCreateTournamentOpen(false);
      setNewTournament({});
    } catch (error) {
      console.error('Failed to create global tournament:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#e5e5e5';
      case 'gold': return '#ffd700';
      case 'silver': return '#c0c0c0';
      case 'bronze': return '#cd7f32';
      default: return '#888';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00ff88';
      case 'pending': return '#ffaa00';
      case 'suspended': return '#ff6600';
      case 'closed': return '#ff0040';
      default: return '#888';
    }
  };

  const cyberpunkStyles = {
    card: {
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      border: '1px solid #00ff88',
      borderRadius: '10px',
      boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #00ff88, transparent)',
        animation: 'scan 2s infinite',
      },
      '@keyframes scan': {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' }
      }
    },
    neonText: {
      color: '#00ff88',
      textShadow: '0 0 10px #00ff88',
      fontWeight: 'bold'
    },
    cyberpunkButton: {
      background: 'linear-gradient(45deg, #00ff88 0%, #00cc6a 100%)',
      color: '#000',
      fontWeight: 'bold',
      border: 'none',
      boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
      '&:hover': {
        background: 'linear-gradient(45deg, #00cc6a 0%, #00aa55 100%)',
        boxShadow: '0 0 30px rgba(0, 255, 136, 0.8)',
      }
    }
  };

  return (
    <Box sx={{ width: '100%', background: '#0a0a0a', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={cyberpunkStyles.neonText}>
          🌐 DOJOPOOL GLOBAL FRANCHISE SYSTEM
        </Typography>
        <Typography variant="h6" sx={{ color: '#888', mt: 1 }}>
          Multi-Venue Management • International Support • Real-Time Analytics
        </Typography>
      </Box>

      {/* Global Stats Cards */}
      {globalStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={cyberpunkStyles.card}>
              <CardContent sx={{ textAlign: 'center' }}>
                <BusinessIcon sx={{ fontSize: 40, color: '#00ff88', mb: 1 }} />
                <Typography variant="h4" sx={cyberpunkStyles.neonText}>
                  {globalStats.totalFranchises}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Active Franchises
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={cyberpunkStyles.card}>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocationIcon sx={{ fontSize: 40, color: '#00ff88', mb: 1 }} />
                <Typography variant="h4" sx={cyberpunkStyles.neonText}>
                  {globalStats.totalVenues}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Total Venues
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={cyberpunkStyles.card}>
              <CardContent sx={{ textAlign: 'center' }}>
                <MoneyIcon sx={{ fontSize: 40, color: '#00ff88', mb: 1 }} />
                <Typography variant="h4" sx={cyberpunkStyles.neonText}>
                  ${(globalStats.totalRevenue / 1000000).toFixed(1)}M
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Annual Revenue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={cyberpunkStyles.card}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TournamentIcon sx={{ fontSize: 40, color: '#00ff88', mb: 1 }} />
                <Typography variant="h4" sx={cyberpunkStyles.neonText}>
                  {globalStats.activeTournaments}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Active Tournaments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Navigation Tabs */}
      <Card sx={cyberpunkStyles.card}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': { color: '#888' },
            '& .Mui-selected': { color: '#00ff88 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#00ff88' }
          }}
        >
          <Tab label="🏢 Franchises" />
          <Tab label="🌍 Global Tournaments" />
          <Tab label="📊 Analytics" />
          <Tab label="🗺️ Regional Performance" />
        </Tabs>

        {/* Franchises Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={cyberpunkStyles.neonText}>
              Franchise Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateFranchiseOpen(true)}
              sx={cyberpunkStyles.cyberpunkButton}
            >
              Create Franchise
            </Button>
          </Box>

          <Grid container spacing={3}>
            {franchises.map((franchise) => (
              <Grid item xs={12} md={6} lg={4} key={franchise.id}>
                <Card sx={cyberpunkStyles.card}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={cyberpunkStyles.neonText}>
                        {franchise.name}
                      </Typography>
                      <Chip
                        label={franchise.tier}
                        sx={{
                          backgroundColor: getTierColor(franchise.tier),
                          color: '#000',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PublicIcon sx={{ mr: 1, color: '#888' }} />
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        {franchise.region} • {franchise.country}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={franchise.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(franchise.status),
                          color: '#000',
                          fontWeight: 'bold'
                        }}
                      />
                      <Typography variant="body2" sx={{ ml: 1, color: '#888' }}>
                        {franchise.venues.length} venues
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#888' }}>Rating</Typography>
                        <Typography variant="body2" sx={cyberpunkStyles.neonText}>
                          ⭐ {franchise.performance.rating.toFixed(1)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(franchise.performance.rating / 5) * 100}
                        sx={{
                          backgroundColor: '#333',
                          '& .MuiLinearProgress-bar': { backgroundColor: '#00ff88' }
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        ${(franchise.revenue.yearly / 1000).toFixed(0)}K/year
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        {franchise.performance.tournaments} tournaments
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{
                        mt: 2,
                        borderColor: '#00ff88',
                        color: '#00ff88',
                        '&:hover': { borderColor: '#00cc6a', backgroundColor: 'rgba(0, 255, 136, 0.1)' }
                      }}
                      onClick={() => setSelectedFranchise(franchise)}
                    >
                      Manage Franchise
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Global Tournaments Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={cyberpunkStyles.neonText}>
              Global Tournament Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateTournamentOpen(true)}
              sx={cyberpunkStyles.cyberpunkButton}
            >
              Create Global Tournament
            </Button>
          </Box>

          <Grid container spacing={3}>
            {globalTournaments.map((tournament) => (
              <Grid item xs={12} key={tournament.id}>
                <Card sx={cyberpunkStyles.card}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="h6" sx={cyberpunkStyles.neonText}>
                          {tournament.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                          {tournament.type} • {tournament.format}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {tournament.regions.map((region) => (
                            <Chip
                              key={region}
                              label={region}
                              size="small"
                              sx={{ backgroundColor: '#333', color: '#00ff88' }}
                            />
                          ))}
                        </Box>

                        <Typography variant="body2" sx={{ color: '#888' }}>
                          Registration: {tournament.schedule.registration.start.toLocaleDateString()} - {tournament.schedule.registration.end.toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888' }}>
                          Tournament: {tournament.schedule.tournament.start.toLocaleDateString()} - {tournament.schedule.tournament.end.toLocaleDateString()}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={cyberpunkStyles.neonText}>
                            ${(tournament.prizePool.amount / 1000).toFixed(0)}K
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#888' }}>
                            Prize Pool ({tournament.prizePool.currency})
                          </Typography>

                          <Chip
                            label={tournament.status}
                            sx={{
                              mt: 2,
                              backgroundColor: getStatusColor(tournament.status),
                              color: '#000',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h5" sx={cyberpunkStyles.neonText}>
            Franchise Analytics
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
            Real-time performance metrics and insights
          </Typography>

          <Grid container spacing={3}>
            {franchises.map((franchise) => {
              const franchiseAnalytics = analytics.filter(a => a.franchiseId === franchise.id && a.period === 'monthly');
              const latestAnalytics = franchiseAnalytics[franchiseAnalytics.length - 1];
              
              if (!latestAnalytics) return null;

              return (
                <Grid item xs={12} md={6} key={franchise.id}>
                  <Card sx={cyberpunkStyles.card}>
                    <CardContent>
                      <Typography variant="h6" sx={cyberpunkStyles.neonText}>
                        {franchise.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                        Monthly Performance
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#888' }}>Revenue</Typography>
                          <Typography variant="h6" sx={cyberpunkStyles.neonText}>
                            ${(latestAnalytics.metrics.revenue / 1000).toFixed(0)}K
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#888' }}>Players</Typography>
                          <Typography variant="h6" sx={cyberpunkStyles.neonText}>
                            {latestAnalytics.metrics.players}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#888' }}>Retention</Typography>
                          <Typography variant="h6" sx={cyberpunkStyles.neonText}>
                            {(latestAnalytics.metrics.retention * 100).toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#888' }}>Utilization</Typography>
                          <Typography variant="h6" sx={cyberpunkStyles.neonText}>
                            {(latestAnalytics.metrics.utilization * 100).toFixed(1)}%
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                          vs Previous Period: {latestAnalytics.comparisons.previousPeriod > 0 ? '+' : ''}{latestAnalytics.comparisons.previousPeriod.toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(0, Math.min(100, 50 + latestAnalytics.comparisons.previousPeriod))}
                          sx={{
                            backgroundColor: '#333',
                            '& .MuiLinearProgress-bar': { 
                              backgroundColor: latestAnalytics.comparisons.previousPeriod > 0 ? '#00ff88' : '#ff6600'
                            }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>

        {/* Regional Performance Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" sx={cyberpunkStyles.neonText}>
            Regional Performance Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
            Compare performance across different regions
          </Typography>

          {globalStats && globalStats.topRegions && (
            <Grid container spacing={3}>
              {globalStats.topRegions.map((region: any, index: number) => (
                <Grid item xs={12} md={6} lg={4} key={region.region}>
                  <Card sx={cyberpunkStyles.card}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h2" sx={{ color: '#333', mr: 2 }}>
                          #{index + 1}
                        </Typography>
                        <Box>
                          <Typography variant="h6" sx={cyberpunkStyles.neonText}>
                            {region.region}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#888' }}>
                            ⭐ {region.rating.toFixed(1)} average rating
                          </Typography>
                        </Box>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#888' }}>Franchises</Typography>
                          <Typography variant="h6" sx={cyberpunkStyles.neonText}>
                            {region.franchises}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#888' }}>Venues</Typography>
                          <Typography variant="h6" sx={cyberpunkStyles.neonText}>
                            {region.venues}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ color: '#888' }}>Annual Revenue</Typography>
                          <Typography variant="h5" sx={cyberpunkStyles.neonText}>
                            ${(region.revenue / 1000000).toFixed(2)}M
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Card>

      {/* Create Franchise Dialog */}
      <Dialog
        open={createFranchiseOpen}
        onClose={() => setCreateFranchiseOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
            border: '1px solid #00ff88',
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={cyberpunkStyles.neonText}>Create New Franchise</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Franchise Name"
                value={newFranchise.name || ''}
                onChange={(e) => setNewFranchise({ ...newFranchise, name: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#ffffff' },
                  '& .MuiInputLabel-root': { color: '#888' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff88' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#888' }}>Region</InputLabel>
                <Select
                  value={newFranchise.region || ''}
                  onChange={(e) => setNewFranchise({ ...newFranchise, region: e.target.value })}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff88' }
                  }}
                >
                  <MenuItem value="North America">North America</MenuItem>
                  <MenuItem value="Europe">Europe</MenuItem>
                  <MenuItem value="Asia">Asia</MenuItem>
                  <MenuItem value="South America">South America</MenuItem>
                  <MenuItem value="Africa">Africa</MenuItem>
                  <MenuItem value="Oceania">Oceania</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                value={newFranchise.country || ''}
                onChange={(e) => setNewFranchise({ ...newFranchise, country: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#ffffff' },
                  '& .MuiInputLabel-root': { color: '#888' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff88' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#888' }}>Currency</InputLabel>
                <Select
                  value={newFranchise.currency || ''}
                  onChange={(e) => setNewFranchise({ ...newFranchise, currency: e.target.value })}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff88' }
                  }}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                  <MenuItem value="JPY">JPY</MenuItem>
                  <MenuItem value="CAD">CAD</MenuItem>
                  <MenuItem value="AUD">AUD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateFranchiseOpen(false)}
            sx={{ color: '#888' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateFranchise}
            variant="contained"
            sx={cyberpunkStyles.cyberpunkButton}
          >
            Create Franchise
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Global Tournament Dialog */}
      <Dialog
        open={createTournamentOpen}
        onClose={() => setCreateTournamentOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
            border: '1px solid #00ff88',
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={cyberpunkStyles.neonText}>Create Global Tournament</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tournament Name"
                value={newTournament.name || ''}
                onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#ffffff' },
                  '& .MuiInputLabel-root': { color: '#888' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff88' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#888' }}>Type</InputLabel>
                <Select
                  value={newTournament.type || ''}
                  onChange={(e) => setNewTournament({ ...newTournament, type: e.target.value as any })}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff88' }
                  }}
                >
                  <MenuItem value="regional">Regional</MenuItem>
                  <MenuItem value="national">National</MenuItem>
                  <MenuItem value="international">International</MenuItem>
                  <MenuItem value="world_championship">World Championship</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#888' }}>Format</InputLabel>
                <Select
                  value={newTournament.format || ''}
                  onChange={(e) => setNewTournament({ ...newTournament, format: e.target.value as any })}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff88' }
                  }}
                >
                  <MenuItem value="single_elimination">Single Elimination</MenuItem>
                  <MenuItem value="double_elimination">Double Elimination</MenuItem>
                  <MenuItem value="round_robin">Round Robin</MenuItem>
                  <MenuItem value="swiss">Swiss</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateTournamentOpen(false)}
            sx={{ color: '#888' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGlobalTournament}
            variant="contained"
            sx={cyberpunkStyles.cyberpunkButton}
          >
            Create Tournament
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentFranchiseSystem;