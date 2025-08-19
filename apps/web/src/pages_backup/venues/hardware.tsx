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
  Build,
  Videocam,
  Sensors,
  Memory,
  DisplaySettings,
  NetworkCheck,
  VolumeUp,
  Lightbulb,
  CheckCircle,
  Warning,
  Info,
  Analytics,
  Timeline,
  Speed,
  Storage,
  Wifi,
  SignalCellular4Bar,
  Battery90,
  Thermostat,
  Opacity,
  LightMode,
  Mic,
  Compress,
  Expand,
  SmartToy,
  Settings,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { VenueHardwareIntegration } from '../../components/venue/VenueHardwareIntegration';

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

export default function VenueHardwarePage() {
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
          <Build sx={{ color: neonColors.secondary, mr: 2, fontSize: 40 }} />
          <NeonTypography variant="h3">
            Venue Hardware Integration
          </NeonTypography>
        </Box>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          IoT sensors, camera systems, and real-time data collection for AI
          model training
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            icon={<Videocam />}
            label="4K Cameras"
            sx={{
              background: neonColors.primary,
              color: '#000',
              fontWeight: 'bold',
            }}
          />
          <Chip
            icon={<Sensors />}
            label="IoT Sensors"
            sx={{
              background: neonColors.info,
              color: '#000',
              fontWeight: 'bold',
            }}
          />
          <Chip
            icon={<Memory />}
            label="Edge Processing"
            sx={{
              background: neonColors.warning,
              color: '#000',
              fontWeight: 'bold',
            }}
          />
          <Chip
            icon={<NetworkCheck />}
            label="Real-time Data"
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
            <SmartToy sx={{ color: neonColors.warning, mr: 1 }} />
            <Typography
              variant="h6"
              sx={{ color: neonColors.warning, fontWeight: 'bold' }}
            >
              AI-Powered Hardware Integration
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Our advanced IoT sensors and camera systems provide real-time data
            collection for AI model training and match analysis.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Features: 4K Camera Systems • Multi-Sensor Arrays • Edge Computing •
            Real-time Processing • AI Model Training
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
          <VenueHardwareIntegration venueId="venue_001" />
        </Box>

        <Box sx={{ flex: { lg: 1 } }}>
          <CyberpunkPaper sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ color: neonColors.info, mb: 2, fontWeight: 'bold' }}
            >
              Hardware Components
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ color: neonColors.primary, mb: 1 }}
                >
                  📹 DojoVision Pro 4K
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  4K resolution • 60 FPS • AI tracking
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ color: neonColors.warning, mb: 1 }}
                >
                  🔍 DojoSense Ultra
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Multi-sensor array • Environmental monitoring
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ color: neonColors.info, mb: 1 }}
                >
                  🧠 DojoBrain Edge
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Edge computing • Real-time processing
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ color: neonColors.secondary, mb: 1 }}
                >
                  📡 DojoConnect Pro
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  High-speed network • Low latency
                </Typography>
              </Box>
            </Box>
          </CyberpunkPaper>

          <CyberpunkPaper sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ color: neonColors.warning, mb: 2, fontWeight: 'bold' }}
            >
              Data Collection
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Videocam sx={{ color: neonColors.primary }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Video Analysis
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sensors sx={{ color: neonColors.info }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Sensor Readings
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Analytics sx={{ color: neonColors.warning }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Performance Metrics
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timeline sx={{ color: neonColors.secondary }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Real-time Monitoring
                </Typography>
              </Box>
            </Box>
          </CyberpunkPaper>

          <CyberpunkPaper sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{ color: neonColors.error, mb: 2, fontWeight: 'bold' }}
            >
              System Management
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Settings />}
                sx={{ mb: 1 }}
              >
                Device Configuration
              </NeonButton>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Build />}
                sx={{
                  mb: 1,
                  background: `linear-gradient(45deg, ${neonColors.warning} 30%, ${neonColors.error} 90%)`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${neonColors.warning} 10%, ${neonColors.error} 100%)`,
                  },
                }}
              >
                System Maintenance
              </NeonButton>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Analytics />}
                sx={{
                  background: `linear-gradient(45deg, ${neonColors.info} 30%, ${neonColors.primary} 90%)`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${neonColors.info} 10%, ${neonColors.primary} 100%)`,
                  },
                }}
              >
                Performance Analytics
              </NeonButton>
            </Box>
          </CyberpunkPaper>
        </Box>
      </Box>
    </CyberpunkContainer>
  );
}
