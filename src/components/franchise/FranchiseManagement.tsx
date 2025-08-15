import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Business,
  LocationOn,
  TrendingUp,
  People,
  Star,
  AttachMoney,
  Speed,
  CheckCircle,
  Warning,
  Error,
  Settings,
  Add,
  Remove,
  Upgrade,
  Analytics,
  Timeline,
  Language,
  Public,
  Security,
  Assessment,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import franchiseService, {
  Franchise,
  FranchiseStatus,
  FranchiseTier,
  VenueNetwork,
  VenueStatus,
} from '../../services/franchise/FranchiseService';

interface FranchiseManagementProps {
  franchiseId?: string;
}

const CyberpunkCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
  border: `2px solid ${alpha('#00ff88', 0.3)}`,
  borderRadius: 12,
  boxShadow: `0 0 20px ${alpha('#00ff88', 0.2)}`,
  backdropFilter: 'blur(10px)',
  '&:hover': {
    boxShadow: `0 0 30px ${alpha('#00ff88', 0.4)}`,
  },
}));

const FranchiseCard = styled(Card)(({ theme, status }: { theme: any; status: FranchiseStatus }) => {
  const getStatusColor = (status: FranchiseStatus) => {
    switch (status) {
      case FranchiseStatus.ACTIVE: return '#00ff88';
      case FranchiseStatus.PENDING: return '#ffcc00';
      case FranchiseStatus.SUSPENDED: return '#ff0044';
      case FranchiseStatus.TERMINATED: return '#666666';
      case FranchiseStatus.EXPANSION: return '#00ccff';
      default: return '#666666';
    }
  };

  return {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
    border: `2px solid ${alpha(getStatusColor(status), 0.3)}`,
    borderRadius: 12,
    boxShadow: `0 0 20px ${alpha(getStatusColor(status), 0.2)}`,
    backdropFilter: 'blur(10px)',
    '&:hover': {
      boxShadow: `0 0 30px ${alpha(getStatusColor(status), 0.4)}`,
    },
  };
});

const NeonButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #00ff88 30%, #00ccff 90%)',
  border: 'none',
  borderRadius: 8,
  color: '#000',
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: `0 0 15px ${alpha('#00ff88', 0.5)}`,
  '&:hover': {
    background: 'linear-gradient(45deg, #00ff88 10%, #00ccff 100%)',
    boxShadow: `0 0 25px ${alpha('#00ff88', 0.7)}`,
  },
}));

const getStatusIcon = (status: FranchiseStatus) => {
  switch (status) {
    case FranchiseStatus.ACTIVE: return <CheckCircle sx={{ color: '#00ff88' }} />;
    case FranchiseStatus.PENDING: return <Warning sx={{ color: '#ffcc00' }} />;
    case FranchiseStatus.SUSPENDED: return <Error sx={{ color: '#ff0044' }} />;
    case FranchiseStatus.TERMINATED: return <Error sx={{ color: '#666666' }} />;
    case FranchiseStatus.EXPANSION: return <TrendingUp sx={{ color: '#00ccff' }} />;
    default: return <Warning sx={{ color: '#ffcc00' }} />;
  }
};

const getTierColor = (tier: FranchiseTier) => {
  switch (tier) {
    case FranchiseTier.STARTER: return '#666666';
    case FranchiseTier.PROFESSIONAL: return '#00ccff';
    case FranchiseTier.ELITE: return '#00ff88';
    case FranchiseTier.MASTER: return '#ffcc00';
    case FranchiseTier.LEGENDARY: return '#ff0099';
    default: return '#666666';
  }
};

export const FranchiseManagement: React.FC<FranchiseManagementProps> = ({
  franchiseId = 'franchise_001',
}) => {
  const theme = useTheme();
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [network, setNetwork] = useState<VenueNetwork | null>(null);
  const [loading, setLoading] = useState(false);

  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  useEffect(() => {
    setFranchise(franchiseService.getFranchise(franchiseId));
    setNetwork(franchiseService.getVenueNetwork(franchiseId));

    const unsubscribe = franchiseService.subscribe('franchise_updated', (updatedFranchise: Franchise) => {
      if (updatedFranchise.id === franchiseId) {
        setFranchise(updatedFranchise);
      }
    });

    return unsubscribe;
  }, [franchiseId]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!franchise) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ background: neonColors.error, color: '#fff' }}>
          Franchise not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Business sx={{ color: neonColors.secondary, mr: 2, fontSize: 32 }} />
        <Typography variant="h5" sx={{ color: neonColors.secondary, fontWeight: 'bold' }}>
          Franchise Management
        </Typography>
      </Box>

      {/* Franchise Overview */}
      <CyberpunkCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: neonColors.primary, flex: 1 }}>
              {franchise.name}
            </Typography>
            {getStatusIcon(franchise.status)}
            <Chip
              label={franchise.status}
              size="small"
              sx={{ 
                ml: 1,
                background: franchise.status === FranchiseStatus.ACTIVE ? neonColors.primary : neonColors.warning,
                color: '#000',
                fontWeight: 'bold'
              }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: neonColors.primary }}>
                  {franchise.performance.totalVenues}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Venues
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: neonColors.info }}>
                  {formatCurrency(franchise.revenue.monthly)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Monthly Revenue
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: neonColors.warning }}>
                  {franchise.performance.averageRating.toFixed(1)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Average Rating
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: neonColors.secondary }}>
                  {formatPercentage(franchise.revenue.growth)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Growth Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </CyberpunkCard>

      <Grid container spacing={3}>
        {/* Franchise Performance */}
        <Grid item xs={12} md={6}>
          <CyberpunkCard>
            <CardContent>
              <Typography variant="h6" sx={{ color: neonColors.info, mb: 2, fontWeight: 'bold' }}>
                Performance Metrics
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Customer Satisfaction
                  </Typography>
                  <Typography variant="body2" sx={{ color: neonColors.primary }}>
                    {franchise.performance.customerSatisfaction}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={franchise.performance.customerSatisfaction}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(neonColors.error, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: neonColors.primary,
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Operational Efficiency
                  </Typography>
                  <Typography variant="body2" sx={{ color: neonColors.warning }}>
                    {franchise.performance.operationalEfficiency}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={franchise.performance.operationalEfficiency}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(neonColors.error, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: neonColors.warning,
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Market Share
                  </Typography>
                  <Typography variant="body2" sx={{ color: neonColors.info }}>
                    {franchise.performance.marketShare}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={franchise.performance.marketShare}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(neonColors.error, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: neonColors.info,
                    }
                  }}
                />
              </Box>
            </CardContent>
          </CyberpunkCard>
        </Grid>

        {/* Franchise Tier & Settings */}
        <Grid item xs={12} md={6}>
          <CyberpunkCard>
            <CardContent>
              <Typography variant="h6" sx={{ color: neonColors.warning, mb: 2, fontWeight: 'bold' }}>
                Franchise Tier & Settings
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: neonColors.primary, mb: 1 }}>
                  Current Tier
                </Typography>
                <Chip
                  label={franchise.tier.toUpperCase()}
                  sx={{ 
                    background: getTierColor(franchise.tier),
                    color: '#000',
                    fontWeight: 'bold'
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: neonColors.info, mb: 1 }}>
                  Revenue Sharing
                </Typography>
                <Typography variant="h6" sx={{ color: neonColors.primary }}>
                  {franchise.settings.financial.revenueSharing}%
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: neonColors.warning, mb: 1 }}>
                  Franchise Fees
                </Typography>
                <Typography variant="h6" sx={{ color: neonColors.primary }}>
                  {formatCurrency(franchise.settings.financial.franchiseFees)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <NeonButton size="small" startIcon={<Upgrade />}>
                  Upgrade Tier
                </NeonButton>
                <NeonButton size="small" startIcon={<Settings />}>
                  Settings
                </NeonButton>
              </Box>
            </CardContent>
          </CyberpunkCard>
        </Grid>
      </Grid>

      {/* Venue Network */}
      {network && (
        <CyberpunkCard sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: neonColors.secondary, mb: 2, fontWeight: 'bold' }}>
              Venue Network
            </Typography>

            <TableContainer component={Paper} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Venue</TableCell>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Location</TableCell>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Revenue</TableCell>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Rating</TableCell>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {network.venues.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell sx={{ color: 'text.primary' }}>
                        <Typography variant="subtitle2">{venue.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOn sx={{ fontSize: 16, mr: 0.5, color: neonColors.info }} />
                          {venue.location.city}, {venue.location.state}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={venue.status}
                          size="small"
                          sx={{ 
                            background: venue.status === VenueStatus.ACTIVE ? neonColors.primary : neonColors.warning,
                            color: '#000',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {formatCurrency(venue.performance.revenue)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Star sx={{ fontSize: 16, mr: 0.5, color: neonColors.warning }} />
                          {venue.performance.rating.toFixed(1)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" sx={{ color: neonColors.info }}>
                              <Analytics />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Settings">
                            <IconButton size="small" sx={{ color: neonColors.warning }}>
                              <Settings />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Network Performance Summary */}
            <Box sx={{ mt: 2, p: 2, background: alpha(neonColors.info, 0.1), borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ color: neonColors.info, mb: 1, fontWeight: 'bold' }}>
                Network Performance Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Total Revenue
                    </Typography>
                    <Typography variant="h6" sx={{ color: neonColors.primary }}>
                      {formatCurrency(network.performance.totalRevenue)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Avg Occupancy
                    </Typography>
                    <Typography variant="h6" sx={{ color: neonColors.warning }}>
                      {formatPercentage(network.performance.averageOccupancy)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Avg Rating
                    </Typography>
                    <Typography variant="h6" sx={{ color: neonColors.info }}>
                      {network.performance.averageRating.toFixed(1)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Efficiency
                    </Typography>
                    <Typography variant="h6" sx={{ color: neonColors.secondary }}>
                      {formatPercentage(network.performance.efficiency)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </CyberpunkCard>
      )}

      {/* International Settings */}
      <CyberpunkCard sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: neonColors.error, mb: 2, fontWeight: 'bold' }}>
            International Settings
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Language sx={{ color: neonColors.primary, mr: 1 }} />
                <Typography variant="subtitle2" sx={{ color: neonColors.primary }}>
                  Supported Languages
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {['English', 'Spanish', 'French', 'German'].map((lang) => (
                  <Chip key={lang} label={lang} size="small" sx={{ background: neonColors.info, color: '#000' }} />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ color: neonColors.warning, mr: 1 }} />
                <Typography variant="subtitle2" sx={{ color: neonColors.warning }}>
                  Supported Currencies
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {['USD', 'EUR', 'GBP', 'CAD'].map((currency) => (
                  <Chip key={currency} label={currency} size="small" sx={{ background: neonColors.warning, color: '#000' }} />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Public sx={{ color: neonColors.secondary, mr: 1 }} />
                <Typography variant="subtitle2" sx={{ color: neonColors.secondary }}>
                  Operating Regions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {['North America', 'Europe', 'Asia Pacific'].map((region) => (
                  <Chip key={region} label={region} size="small" sx={{ background: neonColors.secondary, color: '#fff' }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </CyberpunkCard>
    </Box>
  );
}; 