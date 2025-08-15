import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
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
  Info,
  Analytics,
  Timeline,
  Language,
  Public,
  Security,
  Assessment,
  SmartToy,
  Settings,
  Add,
  Remove,
  Upgrade,
  NetworkCheck,
  Global,
  ExpandMore,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { FranchiseManagement } from '../../components/franchise/FranchiseManagement';

const CyberpunkContainer = styled(Container)(({ theme }) => ({
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

const NeonTypography = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(45deg, #00ff88 30%, #00ccff 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 'bold',
}));

const CyberpunkPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  border: `2px solid ${theme.palette.primary.main}`,
  borderRadius: 12,
  boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
  backdropFilter: 'blur(10px)',
}));

const NeonButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #00ff88 30%, #00ccff 90%)',
  border: 'none',
  borderRadius: 8,
  color: '#000',
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: `0 0 15px ${theme.palette.primary.main}40`,
  '&:hover': {
    background: 'linear-gradient(45deg, #00ff88 10%, #00ccff 100%)',
    boxShadow: `0 0 25px ${theme.palette.primary.main}60`,
  },
}));

export default function FranchisePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <CyberpunkContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress sx={{ color: neonColors.primary }} />
        </Box>
      </CyberpunkContainer>
    );
  }

  return (
    <CyberpunkContainer maxWidth={false}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Business sx={{ color: neonColors.secondary, mr: 2, fontSize: 40 }} />
          <NeonTypography variant="h3">
            Global Franchise Management
          </NeonTypography>
        </Box>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Multi-venue operations, international scaling, and franchise management system
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            icon={<Global />}
            label="Global Network"
            sx={{ background: neonColors.primary, color: '#000', fontWeight: 'bold' }}
          />
          <Chip
            icon={<NetworkCheck />}
            label="Multi-Venue"
            sx={{ background: neonColors.info, color: '#000', fontWeight: 'bold' }}
          />
          <Chip
            icon={<TrendingUp />}
            label="International"
            sx={{ background: neonColors.warning, color: '#000', fontWeight: 'bold' }}
          />
          <Chip
            icon={<Security />}
            label="Franchise System"
            sx={{ background: neonColors.secondary, color: '#fff', fontWeight: 'bold' }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, background: neonColors.error, color: '#fff' }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <CyberpunkPaper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SmartToy sx={{ color: neonColors.warning, mr: 1 }} />
            <Typography variant="h6" sx={{ color: neonColors.warning, fontWeight: 'bold' }}>
              AI-Powered Franchise Management
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Our advanced franchise management system provides comprehensive tools for scaling operations globally, managing multi-venue networks, and optimizing franchise performance.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Features: Global Network Management • Multi-Venue Operations • International Scaling • Franchise Performance Analytics • Compliance Management • Revenue Optimization
          </Typography>
        </CyberpunkPaper>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        <Box sx={{ flex: { lg: 2 } }}>
          <FranchiseManagement franchiseId="franchise_001" />
        </Box>

        <Box sx={{ flex: { lg: 1 } }}>
          <CyberpunkPaper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: neonColors.info, mb: 2, fontWeight: 'bold' }}>
              Franchise Tiers
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: neonColors.primary, mb: 1 }}>
                  🚀 STARTER
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  1-3 venues • Basic features • $2,500 fee
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: neonColors.info, mb: 1 }}>
                  ⚡ PROFESSIONAL
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  4-10 venues • Advanced features • $5,000 fee
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: neonColors.primary, mb: 1 }}>
                  🔥 ELITE
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  11-25 venues • Premium features • $10,000 fee
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: neonColors.warning, mb: 1 }}>
                  👑 MASTER
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  26-50 venues • Master features • $25,000 fee
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: neonColors.secondary, mb: 1 }}>
                  🌟 LEGENDARY
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  50+ venues • Legendary features • $50,000 fee
                </Typography>
              </Box>
            </Box>
          </CyberpunkPaper>

          <CyberpunkPaper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: neonColors.warning, mb: 2, fontWeight: 'bold' }}>
              Global Statistics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business sx={{ color: neonColors.primary }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  150+ Franchises
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ color: neonColors.info }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  25 Countries
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People sx={{ color: neonColors.warning }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  500+ Venues
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney sx={{ color: neonColors.secondary }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  $50M+ Revenue
                </Typography>
              </Box>
            </Box>
          </CyberpunkPaper>

          <CyberpunkPaper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: neonColors.error, mb: 2, fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Add />}
                sx={{ mb: 1 }}
              >
                Add New Venue
              </NeonButton>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Upgrade />}
                sx={{ mb: 1 }}
                sx={{ 
                  background: `linear-gradient(45deg, ${neonColors.warning} 30%, ${neonColors.error} 90%)`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${neonColors.warning} 10%, ${neonColors.error} 100%)`,
                  }
                }}
              >
                Upgrade Franchise
              </NeonButton>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Analytics />}
                sx={{ 
                  background: `linear-gradient(45deg, ${neonColors.info} 30%, ${neonColors.primary} 90%)`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${neonColors.info} 10%, ${neonColors.primary} 100%)`,
                  }
                }}
              >
                Performance Report
              </NeonButton>
            </Box>
          </CyberpunkPaper>

          <CyberpunkPaper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: neonColors.info, mb: 2, fontWeight: 'bold' }}>
              International Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Language sx={{ color: neonColors.primary }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Multi-Language Support
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney sx={{ color: neonColors.warning }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Multi-Currency Support
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Public sx={{ color: neonColors.secondary }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Global Compliance
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security sx={{ color: neonColors.error }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  International Security
                </Typography>
              </Box>
            </Box>
          </CyberpunkPaper>
        </Box>
      </Box>
    </CyberpunkContainer>
  );
} 