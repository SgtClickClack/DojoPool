import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Chip,
  Avatar,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Dashboard,
  TableBar,
  CheckCircle,
  Event,
  Analytics,
  People,
  AttachMoney,
  TrendingUp,
  Business,
  Schedule,
} from '@mui/icons-material';
import { getVenue } from '../../dojopool/frontend/api/venues';
import { Venue } from '../../dojopool/frontend/types/venue';
import { CheckInSystem } from './CheckInSystem';
import { TableManagement } from './TableManagement';

interface VenueDashboardProps {
  venueId: string;
}

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
      id={`venue-tabpanel-${index}`}
      aria-labelledby={`venue-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const VenueDashboard: React.FC<VenueDashboardProps> = ({ venueId }) => {
  const theme = useTheme();
  const [venueData, setVenueData] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
    purple: '#8b00ff',
    orange: '#ff6600',
  };

  useEffect(() => {
    const fetchVenueData = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await getVenue(parseInt(venueId));
        setVenueData(details);
      } catch (err: any) {
        console.error("Error fetching venue data:", err);
        setError('Failed to load venue data.');
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchVenueData();
    }
  }, [venueId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress sx={{ color: neonColors.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert 
          severity="error"
          sx={{
            background: alpha(neonColors.error, 0.1),
            border: `1px solid ${neonColors.error}`,
            color: neonColors.error,
            '& .MuiAlert-icon': { color: neonColors.error },
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!venueData) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert 
          severity="info"
          sx={{
            background: alpha(neonColors.info, 0.1),
            border: `1px solid ${neonColors.info}`,
            color: neonColors.info,
            '& .MuiAlert-icon': { color: neonColors.info },
          }}
        >
          No venue data available.
        </Alert>
      </Box>
    );
  }

  const displayAddress = `${venueData.address.street}, ${venueData.address.city}, ${venueData.address.state} ${venueData.address.postalCode}`;
  const revenueGrowth = 12.5; // Mock data - calculate from actual data

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', background: alpha(theme.palette.background.default, 0.95) }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 30px ${alpha(neonColors.primary, 0.5)}`,
            mb: 1,
          }}
        >
          {venueData.name}
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
          <Business sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
          {displayAddress}
        </Typography>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(neonColors.info, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              border: `1px solid ${alpha(neonColors.info, 0.3)}`,
              borderRadius: 2,
              boxShadow: `0 0 20px ${alpha(neonColors.info, 0.2)}`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: neonColors.info, fontWeight: 'bold' }}>
                    {venueData.stats.totalCheckins}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Today's Check-ins
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    background: alpha(neonColors.info, 0.2),
                    color: neonColors.info,
                    boxShadow: `0 0 20px ${alpha(neonColors.info, 0.5)}`,
                  }}
                >
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(neonColors.primary, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
              borderRadius: 2,
              boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.2)}`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: neonColors.primary, fontWeight: 'bold' }}>
                    {venueData.stats.totalGamesPlayed}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Games Today
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    background: alpha(neonColors.primary, 0.2),
                    color: neonColors.primary,
                    boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
                  }}
                >
                  <TableBar />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(neonColors.warning, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              border: `1px solid ${alpha(neonColors.warning, 0.3)}`,
              borderRadius: 2,
              boxShadow: `0 0 20px ${alpha(neonColors.warning, 0.2)}`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: neonColors.warning, fontWeight: 'bold' }}>
                    ${(venueData.stats.totalRevenue || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Today's Revenue
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    background: alpha(neonColors.warning, 0.2),
                    color: neonColors.warning,
                    boxShadow: `0 0 20px ${alpha(neonColors.warning, 0.5)}`,
                  }}
                >
                  <AttachMoney />
                </Avatar>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: neonColors.primary, fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: neonColors.primary }}>
                  +{revenueGrowth}% from yesterday
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(neonColors.secondary, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              border: `1px solid ${alpha(neonColors.secondary, 0.3)}`,
              borderRadius: 2,
              boxShadow: `0 0 20px ${alpha(neonColors.secondary, 0.2)}`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: neonColors.secondary, fontWeight: 'bold' }}>
                    {venueData.stats.averageGameDuration}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Avg. Game Time
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    background: alpha(neonColors.secondary, 0.2),
                    color: neonColors.secondary,
                    boxShadow: `0 0 20px ${alpha(neonColors.secondary, 0.5)}`,
                  }}
                >
                  <Schedule />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper
        sx={{
          background: alpha(theme.palette.background.paper, 0.95),
          border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${alpha(neonColors.primary, 0.3)}`,
            background: alpha(theme.palette.background.default, 0.5),
            '& .MuiTab-root': {
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: neonColors.primary,
                textShadow: `0 0 10px ${neonColors.primary}`,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: neonColors.primary,
              height: 3,
              boxShadow: `0 0 10px ${neonColors.primary}`,
            },
          }}
        >
          <Tab icon={<Dashboard />} label="Overview" />
          <Tab icon={<CheckCircle />} label="Check-in System" />
          <Tab icon={<TableBar />} label="Table Management" />
          <Tab icon={<Event />} label="Events" />
          <Tab icon={<Analytics />} label="Analytics" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={selectedTab} index={0}>
            {/* Overview Tab */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    background: alpha(theme.palette.background.default, 0.5),
                    border: `1px solid ${alpha(neonColors.info, 0.3)}`,
                    borderRadius: 2,
                  }}
                >
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: neonColors.info, 
                        mb: 2,
                        textShadow: `0 0 5px ${neonColors.info}`,
                      }}
                    >
                      Venue Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Hours:</strong> {venueData.businessHours.map(bh => `${bh.day}: ${bh.openTime} - ${bh.closeTime}`).join(', ')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Contact:</strong> {venueData.contact.email || venueData.contact.phone}
                      </Typography>
                      {venueData.contact.website && (
                        <Typography variant="body2">
                          <strong>Website:</strong> {venueData.contact.website}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    background: alpha(theme.palette.background.default, 0.5),
                    border: `1px solid ${alpha(neonColors.warning, 0.3)}`,
                    borderRadius: 2,
                  }}
                >
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: neonColors.warning, 
                        mb: 2,
                        textShadow: `0 0 5px ${neonColors.warning}`,
                      }}
                    >
                      Active Tables Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {venueData.tables.map((table, index) => (
                        <Chip
                          key={table.id}
                          label={`Table ${table.name}`}
                          sx={{
                            background: alpha(table.status === 'occupied' ? neonColors.warning : neonColors.primary, 0.2),
                            color: table.status === 'occupied' ? neonColors.warning : neonColors.primary,
                            border: `1px solid ${table.status === 'occupied' ? neonColors.warning : neonColors.primary}`,
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            {/* Check-in System Tab */}
            <CheckInSystem venueId={venueId} venueName={venueData.name} />
          </TabPanel>

          <TabPanel value={selectedTab} index={2}>
            {/* Table Management Tab */}
            <TableManagement venueId={venueId} />
          </TabPanel>

          <TabPanel value={selectedTab} index={3}>
            {/* Events Tab */}
            <Card
              sx={{
                background: alpha(theme.palette.background.default, 0.5),
                border: `1px solid ${alpha(neonColors.secondary, 0.3)}`,
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: neonColors.secondary,
                    textShadow: `0 0 10px ${neonColors.secondary}`,
                    mb: 3,
                  }}
                >
                  Upcoming Events
                </Typography>
                {venueData.events && venueData.events.length > 0 ? (
                  <Grid container spacing={2}>
                    {venueData.events.map((event) => (
                      <Grid item xs={12} sm={6} md={4} key={event.id}>
                        <Card
                          sx={{
                            background: alpha(neonColors.purple, 0.1),
                            border: `1px solid ${alpha(neonColors.purple, 0.3)}`,
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: `0 0 20px ${alpha(neonColors.purple, 0.5)}`,
                            },
                          }}
                        >
                          <CardContent>
                            <Typography variant="h6" sx={{ color: neonColors.purple }}>
                              {event.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              {event.date} at {event.time}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    No upcoming events scheduled.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={selectedTab} index={4}>
            {/* Analytics Tab */}
            <Typography variant="h5" sx={{ color: neonColors.info, mb: 3 }}>
              Analytics & Insights
            </Typography>
            <Alert 
              severity="info"
              sx={{
                background: alpha(neonColors.info, 0.1),
                border: `1px solid ${neonColors.info}`,
                color: neonColors.info,
                '& .MuiAlert-icon': { color: neonColors.info },
              }}
            >
              Advanced analytics features coming soon!
            </Alert>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default VenueDashboard; 