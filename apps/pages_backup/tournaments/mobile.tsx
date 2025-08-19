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
  Smartphone,
  Notifications,
  CloudSync,
  Wifi,
  Settings,
  Download,
  Upload,
  TrendingUp,
  EmojiEvents,
  Speed,
  Tablet,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { TournamentMobileIntegration } from '../../components/tournament/TournamentMobileIntegration';

// Cyberpunk styled components
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

export default function TournamentMobilePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  useEffect(() => {
    setLoading(true);
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <CyberpunkContainer>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <CircularProgress sx={{ color: neonColors.primary }} />
        </Box>
      </CyberpunkContainer>
    );
  }

  return (
    <CyberpunkContainer maxWidth={false}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Smartphone sx={{ color: neonColors.primary, mr: 2, fontSize: 40 }} />
          <NeonTypography variant="h3">
            Tournament Mobile Integration
          </NeonTypography>
        </Box>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Optimized tournament experience for mobile devices with offline
          capabilities and push notifications
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            icon={<Notifications />}
            label="Push Notifications"
            sx={{
              background: neonColors.primary,
              color: '#000',
              fontWeight: 'bold',
            }}
          />
          <Chip
            icon={<CloudSync />}
            label="Offline Mode"
            sx={{
              background: neonColors.info,
              color: '#000',
              fontWeight: 'bold',
            }}
          />
          <Chip
            icon={<Wifi />}
            label="Real-time Sync"
            sx={{
              background: neonColors.warning,
              color: '#000',
              fontWeight: 'bold',
            }}
          />
          <Chip
            icon={<Speed />}
            label="Performance Optimized"
            sx={{
              background: neonColors.secondary,
              color: '#fff',
              fontWeight: 'bold',
            }}
          />
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, background: neonColors.error, color: '#fff' }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <CyberpunkPaper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EmojiEvents sx={{ color: neonColors.warning, mr: 1 }} />
            <Typography
              variant="h6"
              sx={{ color: neonColors.warning, fontWeight: 'bold' }}
            >
              Mobile Tournament Experience
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Access all tournament features on your mobile device with optimized
            performance and offline capabilities
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Status: {isOnline ? 'Online' : 'Offline'} | Device: Mobile Optimized
          </Typography>
        </CyberpunkPaper>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', lg: 'row' },
        }}
      >
        <Box sx={{ flex: { lg: 2 } }}>
          <TournamentMobileIntegration />
        </Box>

        <Box sx={{ flex: { lg: 1 } }}>
          <CyberpunkPaper sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ color: neonColors.info, mb: 2, fontWeight: 'bold' }}
            >
              Mobile Features
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ color: neonColors.primary, mb: 1 }}
                >
                  📱 Responsive Design
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Optimized for all mobile devices with touch-friendly controls
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ color: neonColors.warning, mb: 1 }}
                >
                  🔔 Push Notifications
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Real-time alerts for tournament updates, match results, and
                  achievements
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ color: neonColors.info, mb: 1 }}
                >
                  📴 Offline Mode
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Access tournament data and features without internet
                  connection
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ color: neonColors.secondary, mb: 1 }}
                >
                  ⚡ Performance Optimized
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Low data mode and optimized loading for better mobile
                  experience
                </Typography>
              </Box>
            </Box>
          </CyberpunkPaper>

          <CyberpunkPaper sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ color: neonColors.warning, mb: 2, fontWeight: 'bold' }}
            >
              Device Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Smartphone sx={{ color: neonColors.primary }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Smartphones (iOS & Android)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tablet sx={{ color: neonColors.info }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Tablets (iPad & Android)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: neonColors.warning }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Progressive Web App (PWA)
                </Typography>
              </Box>
            </Box>
          </CyberpunkPaper>

          <CyberpunkPaper sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{ color: neonColors.error, mb: 2, fontWeight: 'bold' }}
            >
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Download />}
                sx={{ mb: 1 }}
              >
                Install PWA
              </NeonButton>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Upload />}
                sx={{
                  mb: 1,
                  background: `linear-gradient(45deg, ${neonColors.warning} 30%, ${neonColors.error} 90%)`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${neonColors.warning} 10%, ${neonColors.error} 100%)`,
                  },
                }}
              >
                Sync Data
              </NeonButton>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Settings />}
                sx={{
                  background: `linear-gradient(45deg, ${neonColors.info} 30%, ${neonColors.primary} 90%)`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${neonColors.info} 10%, ${neonColors.primary} 100%)`,
                  },
                }}
              >
                Mobile Settings
              </NeonButton>
            </Box>
          </CyberpunkPaper>
        </Box>
      </Box>
    </CyberpunkContainer>
  );
}
