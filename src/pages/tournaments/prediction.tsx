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
  TrendingUp,
  Casino,
  Psychology,
  Analytics,
  Timeline,
  AttachMoney,
  CheckCircle,
  Warning,
  Info,
  ShowChart,
  AccountBalance,
  Security,
  SmartToy,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { TournamentPredictionSystem } from '../../components/tournament/TournamentPredictionSystem';

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

export default function TournamentPredictionPage() {
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
    // Simulate loading
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
          <TrendingUp sx={{ color: neonColors.secondary, mr: 2, fontSize: 40 }} />
          <NeonTypography variant="h3">
            AI Prediction & Betting System
          </NeonTypography>
        </Box>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Advanced AI-powered match predictions with blockchain-based betting and smart contracts
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            icon={<SmartToy />}
            label="AI Predictions"
            sx={{ background: neonColors.primary, color: '#000', fontWeight: 'bold' }}
          />
          <Chip
            icon={<Casino />}
            label="Smart Contracts"
            sx={{ background: neonColors.warning, color: '#000', fontWeight: 'bold' }}
          />
          <Chip
            icon={<Security />}
            label="Secure Transactions"
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
            <Psychology sx={{ color: neonColors.warning, mr: 1 }} />
            <Typography variant="h6" sx={{ color: neonColors.warning, fontWeight: 'bold' }}>
              AI-Powered Tournament Predictions
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Our advanced AI models analyze player performance, historical data, and real-time statistics to generate accurate match predictions with confidence scores.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Features: Machine Learning Models • Real-time Analysis • Confidence Scoring • Performance Factors
          </Typography>
        </CyberpunkPaper>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        <Box sx={{ flex: { lg: 2 } }}>
          <TournamentPredictionSystem tournamentId="tournament_001" matchId="match_001" />
        </Box>

        <Box sx={{ flex: { lg: 1 } }}>
          <CyberpunkPaper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: neonColors.info, mb: 2, fontWeight: 'bold' }}>
              AI Models
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: neonColors.primary, mb: 1 }}>
                  🤖 DojoPool AI Predictor v2.1
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  78% accuracy • Advanced tournament analysis
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: neonColors.warning, mb: 1 }}>
                  🧠 Neural Network Ensemble
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  82% accuracy • Behavioral analysis
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: neonColors.info, mb: 1 }}>
                  📊 Real-time Analytics
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Live performance tracking and updates
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: neonColors.secondary, mb: 1 }}>
                  🔄 Continuous Learning
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Models improve with each tournament
                </Typography>
              </Box>
            </Box>
          </CyberpunkPaper>

          <CyberpunkPaper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: neonColors.warning, mb: 2, fontWeight: 'bold' }}>
              Betting Features
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance sx={{ color: neonColors.primary }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Smart Contract Escrow
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security sx={{ color: neonColors.info }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Secure Transactions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShowChart sx={{ color: neonColors.warning }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Real-time Odds
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timeline sx={{ color: neonColors.secondary }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Instant Settlements
                </Typography>
              </Box>
            </Box>
          </CyberpunkPaper>

          <CyberpunkPaper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: neonColors.error, mb: 2, fontWeight: 'bold' }}>
              Risk Management
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Warning />}
                sx={{ mb: 1 }}
              >
                Set Limits
              </NeonButton>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<Info />}
                sx={{ 
                  mb: 1,
                  background: `linear-gradient(45deg, ${neonColors.warning} 30%, ${neonColors.error} 90%)`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${neonColors.warning} 10%, ${neonColors.error} 100%)`,
                  }
                }}
              >
                Risk Assessment
              </NeonButton>
              <NeonButton
                variant="contained"
                size="small"
                startIcon={<CheckCircle />}
                sx={{ 
                  background: `linear-gradient(45deg, ${neonColors.info} 30%, ${neonColors.primary} 90%)`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${neonColors.info} 10%, ${neonColors.primary} 100%)`,
                  }
                }}
              >
                Responsible Gaming
              </NeonButton>
            </Box>
          </CyberpunkPaper>
        </Box>
      </Box>
    </CyberpunkContainer>
  );
} 