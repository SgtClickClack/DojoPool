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
} from '@mui/material';
import {
  LiveTv,
  Videocam,
  Settings,
  Analytics,
  TrendingUp,
  EmojiEvents,
  Speed,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { TournamentLiveStream } from '../../components/tournament/TournamentLiveStream';

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

export default function TournamentStreamingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tournamentId] = useState('tournament_001');
  const [matchId] = useState('match_001');

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
  }, []);

  const handleStreamEnd = () => {
    console.log('Stream ended');
  };

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
          <LiveTv sx={{ color: neonColors.primary, mr: 2, fontSize: 40 }} />
          <NeonTypography variant="h3">
            Tournament Live Streaming
          </NeonTypography>
        </Box>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Experience real-time tournament matches with AI-enhanced commentary and advanced analytics
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            icon={<Videocam />}
            label="1080p HD"
            sx={{ background: neonColors.primary, color: '#000', fontWeight: 'bold' }}
          />
          <Chip
            icon={<Speed />}
            label="60 FPS"
            sx={{ background: neonColors.info, color: '#000', fontWeight: 'bold' }}
          />
          <Chip
            icon={<Analytics />}
            label="AI Commentary"
            sx={{ background: neonColors.warning, color: '#000', fontWeight: 'bold' }}
          />
          <Chip
            icon={<Analytics />}
            label="Live Stats"
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
            <EmojiEvents sx={{ color: neonColors.warning, mr: 1 }} />
            <Typography variant="h6" sx={{ color: neonColors.warning, fontWeight: 'bold' }}>
              Current Tournament: Cyberpunk Championship 2025
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Round 2 - Match 3: Player Alpha vs Player Beta
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Venue: Neon Pool Hall | Status: Live Streaming Available
          </Typography>
        </CyberpunkPaper>
      </Box>

      <TournamentLiveStream
        tournamentId={tournamentId}
        matchId={matchId}
        onStreamEnd={handleStreamEnd}
      />

      <Box sx={{ mt: 4 }}>
        <CyberpunkPaper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ color: neonColors.info, mb: 2, fontWeight: 'bold' }}>
            Streaming Features
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: neonColors.primary, mb: 1 }}>
                  🎥 High-Quality Video
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  1080p HD streaming at 60 FPS with adaptive bitrate for optimal viewing experience
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 300px' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: neonColors.warning, mb: 1 }}>
                  🤖 AI Commentary
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Real-time AI-powered commentary with shot analysis and strategic insights
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 300px' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: neonColors.info, mb: 1 }}>
                  📊 Live Statistics
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Real-time player statistics, shot accuracy, and performance metrics
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 300px' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: neonColors.secondary, mb: 1 }}>
                  💬 Interactive Chat
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Live chat with other viewers and tournament participants
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 300px' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: neonColors.error, mb: 1 }}>
                  ⚡ Low Latency
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Sub-second latency for real-time match experience
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 300px' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: neonColors.primary, mb: 1 }}>
                  📱 Multi-Platform
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Watch on desktop, mobile, or tablet with responsive design
                </Typography>
              </Box>
            </Box>
          </Box>
        </CyberpunkPaper>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <NeonButton
          variant="contained"
          size="large"
          startIcon={<Settings />}
          sx={{ mr: 2 }}
        >
          Stream Settings
        </NeonButton>
        <NeonButton
          variant="contained"
          size="large"
          startIcon={<TrendingUp />}
          sx={{ 
            background: `linear-gradient(45deg, ${neonColors.warning} 30%, ${neonColors.error} 90%)`,
            '&:hover': {
              background: `linear-gradient(45deg, ${neonColors.warning} 10%, ${neonColors.error} 100%)`,
            }
          }}
        >
          View Analytics
        </NeonButton>
      </Box>
    </CyberpunkContainer>
  );
} 