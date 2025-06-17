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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  alpha,
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
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import tournamentPredictionService, {
  MatchPrediction,
  BettingMarket,
  Bet,
  PredictionModel,
  BettingStats,
} from '../../services/tournament/TournamentPredictionService';

interface TournamentPredictionSystemProps {
  tournamentId?: string;
  matchId?: string;
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

const NeonButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #00ff88 30%, #00ccff 90%)',
  border: 'none',
  borderRadius: 8,
  color: '#000',
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: `0 0 15px ${alpha('#00ff88', 0.5)}`,
  '&:hover': {
    background: 'linear-gradient(45deg, #00ff88 10%, #00ccff 100%)`,
    boxShadow: `0 0 25px ${alpha('#00ff88', 0.7)}`,
  },
}));

const PredictionCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha('#1a1a2e', 0.9)} 0%, ${alpha('#16213e', 0.95)} 100%)`,
  border: `2px solid ${alpha('#ff0099', 0.3)}`,
  borderRadius: 12,
  boxShadow: `0 0 20px ${alpha('#ff0099', 0.2)}`,
  backdropFilter: 'blur(10px)',
}));

export const TournamentPredictionSystem: React.FC<TournamentPredictionSystemProps> = ({
  tournamentId,
  matchId,
}) => {
  const theme = useTheme();
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [markets, setMarkets] = useState<BettingMarket[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [models, setModels] = useState<PredictionModel[]>([]);
  const [stats, setStats] = useState<BettingStats | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<BettingMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [betPrediction, setBetPrediction] = useState<'player1' | 'player2'>('player1');
  const [loading, setLoading] = useState(false);

  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  useEffect(() => {
    // Load initial data
    setPredictions(tournamentPredictionService.getPredictions());
    setMarkets(tournamentPredictionService.getMarkets());
    setBets(tournamentPredictionService.getBets());
    setModels(tournamentPredictionService.getPredictionModels());
    setStats(tournamentPredictionService.getBettingStats());

    // Subscribe to updates
    const unsubscribePrediction = tournamentPredictionService.subscribe('prediction_generated', (prediction) => {
      setPredictions(prev => [prediction, ...prev]);
    });

    const unsubscribeMarket = tournamentPredictionService.subscribe('market_created', (market) => {
      setMarkets(prev => [market, ...prev]);
    });

    const unsubscribeBet = tournamentPredictionService.subscribe('bet_placed', (bet) => {
      setBets(prev => [bet, ...prev]);
    });

    const unsubscribeStats = tournamentPredictionService.subscribe('bet_settled', () => {
      setStats(tournamentPredictionService.getBettingStats());
    });

    return () => {
      unsubscribePrediction();
      unsubscribeMarket();
      unsubscribeBet();
      unsubscribeStats();
    };
  }, []);

  const handleGeneratePrediction = async () => {
    if (!matchId) return;
    
    setLoading(true);
    try {
      await tournamentPredictionService.generateMatchPrediction(matchId, 'player_001', 'player_002');
    } catch (error) {
      console.error('Error generating prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarket = async () => {
    if (!matchId || !tournamentId) return;
    
    setLoading(true);
    try {
      await tournamentPredictionService.createBettingMarket(matchId, tournamentId);
    } catch (error) {
      console.error('Error creating market:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket || !betAmount) return;
    
    setLoading(true);
    try {
      await tournamentPredictionService.placeBet(
        'user_001',
        selectedMarket.id,
        parseFloat(betAmount),
        betPrediction
      );
      setBetDialogOpen(false);
      setBetAmount('');
    } catch (error) {
      console.error('Error placing bet:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return neonColors.primary;
    if (confidence >= 0.6) return neonColors.warning;
    return neonColors.error;
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return neonColors.primary;
      case 'medium': return neonColors.warning;
      case 'high': return neonColors.error;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrendingUp sx={{ color: neonColors.secondary, mr: 2, fontSize: 32 }} />
        <Typography variant="h5" sx={{ color: neonColors.secondary, fontWeight: 'bold' }}>
          AI Prediction & Betting System
        </Typography>
      </Box>

      {/* AI Models Overview */}
      <CyberpunkCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Psychology sx={{ color: neonColors.info, mr: 1 }} />
            <Typography variant="h6" sx={{ color: neonColors.info, flex: 1 }}>
              AI Prediction Models
            </Typography>
            <NeonButton
              onClick={handleGeneratePrediction}
              disabled={loading || !matchId}
              startIcon={<Analytics />}
              size="small"
            >
              Generate Prediction
            </NeonButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {models.map((model) => (
              <Chip
                key={model.name}
                icon={<CheckCircle />}
                label={`${model.name} (${(model.accuracy * 100).toFixed(1)}% accuracy)`}
                sx={{ 
                  background: neonColors.info, 
                  color: '#000',
                  fontWeight: 'bold'
                }}
              />
            ))}
          </Box>
        </CardContent>
      </CyberpunkCard>

      {/* Predictions */}
      {predictions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: neonColors.primary, mb: 2 }}>
            Match Predictions
          </Typography>
          {predictions.map((prediction) => (
            <PredictionCard key={prediction.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: neonColors.primary }}>
                    Match {prediction.matchId}
                  </Typography>
                  <Chip
                    label={`${(prediction.confidence * 100).toFixed(1)}% confidence`}
                    sx={{ 
                      background: getConfidenceColor(prediction.confidence), 
                      color: '#000',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Player 1 Win Probability
                    </Typography>
                    <Typography variant="h4" sx={{ color: neonColors.primary }}>
                      {(prediction.player1WinProbability * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Player 2 Win Probability
                    </Typography>
                    <Typography variant="h4" sx={{ color: neonColors.secondary }}>
                      {(prediction.player2WinProbability * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Predicted Score Range
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                      label={`Player 1: ${prediction.predictedScore.player1.low}-${prediction.predictedScore.player1.high}`}
                      sx={{ background: neonColors.primary, color: '#000' }}
                    />
                    <Chip
                      label={`Player 2: ${prediction.predictedScore.player2.low}-${prediction.predictedScore.player2.high}`}
                      sx={{ background: neonColors.secondary, color: '#fff' }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Key Factors
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {prediction.factors.slice(0, 3).map((factor, index) => (
                      <Chip
                        key={index}
                        label={factor.name}
                        size="small"
                        sx={{ 
                          background: factor.impact === 'positive' ? neonColors.primary : 
                                   factor.impact === 'negative' ? neonColors.error : neonColors.warning,
                          color: '#000',
                          fontSize: '0.7rem'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </PredictionCard>
          ))}
        </Box>
      )}

      {/* Betting Markets */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: neonColors.warning, flex: 1 }}>
            Betting Markets
          </Typography>
          <NeonButton
            onClick={handleCreateMarket}
            disabled={loading || !matchId || !tournamentId}
            startIcon={<Casino />}
            size="small"
            sx={{ 
              background: `linear-gradient(45deg, ${neonColors.warning} 30%, ${neonColors.error} 90%)`,
              '&:hover': {
                background: `linear-gradient(45deg, ${neonColors.warning} 10%, ${neonColors.error} 100%)`,
              }
            }}
          >
            Create Market
          </NeonButton>
        </Box>

        {markets.map((market) => (
          <CyberpunkCard key={market.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: neonColors.warning }}>
                  Market {market.id}
                </Typography>
                <Chip
                  label={market.status}
                  sx={{ 
                    background: market.status === 'open' ? neonColors.primary : neonColors.error,
                    color: '#000',
                    fontWeight: 'bold'
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Player 1 Odds
                  </Typography>
                  <Typography variant="h5" sx={{ color: neonColors.primary }}>
                    {market.odds.player1}x
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    ${market.player1Bets.toLocaleString()} bet
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Player 2 Odds
                  </Typography>
                  <Typography variant="h5" sx={{ color: neonColors.secondary }}>
                    {market.odds.player2}x
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    ${market.player2Bets.toLocaleString()} bet
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Total Pool
                  </Typography>
                  <Typography variant="h5" sx={{ color: neonColors.info }}>
                    ${market.totalPool.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <NeonButton
                onClick={() => {
                  setSelectedMarket(market);
                  setBetDialogOpen(true);
                }}
                disabled={market.status !== 'open'}
                startIcon={<AttachMoney />}
                size="small"
                sx={{ 
                  background: `linear-gradient(45deg, ${neonColors.info} 30%, ${neonColors.primary} 90%)`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${neonColors.info} 10%, ${neonColors.primary} 100%)`,
                  }
                }}
              >
                Place Bet
              </NeonButton>
            </CardContent>
          </CyberpunkCard>
        ))}
      </Box>

      {/* Betting Statistics */}
      {stats && (
        <CyberpunkCard sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShowChart sx={{ color: neonColors.info, mr: 1 }} />
              <Typography variant="h6" sx={{ color: neonColors.info }}>
                Betting Statistics
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Bets
                </Typography>
                <Typography variant="h4" sx={{ color: neonColors.primary }}>
                  {stats.totalBets}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Volume
                </Typography>
                <Typography variant="h4" sx={{ color: neonColors.warning }}>
                  ${stats.totalVolume.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Win Rate
                </Typography>
                <Typography variant="h4" sx={{ color: neonColors.info }}>
                  {(stats.winRate * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Active Markets
                </Typography>
                <Typography variant="h4" sx={{ color: neonColors.secondary }}>
                  {stats.activeMarkets}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </CyberpunkCard>
      )}

      {/* Recent Bets */}
      {bets.length > 0 && (
        <CyberpunkCard>
          <CardContent>
            <Typography variant="h6" sx={{ color: neonColors.primary, mb: 2 }}>
              Recent Bets
            </Typography>
            <TableContainer component={Paper} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>User</TableCell>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Prediction</TableCell>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Odds</TableCell>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Potential Win</TableCell>
                    <TableCell sx={{ color: neonColors.primary, fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bets.slice(0, 5).map((bet) => (
                    <TableRow key={bet.id}>
                      <TableCell sx={{ color: 'text.primary' }}>{bet.userId}</TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>${bet.amount}</TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{bet.prediction}</TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{bet.odds}x</TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>${bet.potentialWinnings.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={bet.status}
                          size="small"
                          sx={{ 
                            background: bet.status === 'won' ? neonColors.primary : 
                                     bet.status === 'lost' ? neonColors.error : neonColors.warning,
                            color: '#000',
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </CyberpunkCard>
      )}

      {/* Bet Dialog */}
      <Dialog open={betDialogOpen} onClose={() => setBetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: neonColors.primary, fontWeight: 'bold' }}>
          Place Your Bet
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Bet Amount ($)"
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Prediction</InputLabel>
              <Select
                value={betPrediction}
                onChange={(e) => setBetPrediction(e.target.value as 'player1' | 'player2')}
                label="Prediction"
              >
                <MenuItem value="player1">Player 1</MenuItem>
                <MenuItem value="player2">Player 2</MenuItem>
              </Select>
            </FormControl>
            {selectedMarket && (
              <Alert severity="info" sx={{ background: neonColors.info, color: '#000' }}>
                Current odds: {betPrediction === 'player1' ? selectedMarket.odds.player1 : selectedMarket.odds.player2}x
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBetDialogOpen(false)}>Cancel</Button>
          <NeonButton onClick={handlePlaceBet} disabled={!betAmount || loading}>
            Place Bet
          </NeonButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 