import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  EmojiEvents,
  Timeline,
  Refresh,
  Settings,
  AutoAwesome,
  Analytics,
  SportsEsports,
  Star,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  Group,
  Assessment,
  ExpandMore,
  Info,
} from '@mui/icons-material';
import TournamentPredictionService, {
  PlayerPrediction,
  MatchPrediction,
  type TournamentPrediction,
  PredictionMetrics,
  PredictionConfig
} from '../../services/ai/TournamentPredictionService';

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
      id={`prediction-tabpanel-${index}`}
      aria-labelledby={`prediction-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentPredictionComponent: React.FC = () => {
  const service = TournamentPredictionService.getInstance();
  const [tabValue, setTabValue] = useState(0);
  const [playerPredictions, setPlayerPredictions] = useState<PlayerPrediction[]>([]);
  const [matchPredictions, setMatchPredictions] = useState<MatchPrediction[]>([]);
  const [tournamentPredictions, setTournamentPredictions] = useState<TournamentPrediction[]>([]);
  const [metrics, setMetrics] = useState<PredictionMetrics | null>(null);
  const [config, setConfig] = useState<PredictionConfig | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);

  useEffect(() => {
    setPlayerPredictions(service.getPlayerPredictions());
    setMatchPredictions(service.getMatchPredictions());
    setTournamentPredictions(service.getTournamentPredictions());
    setMetrics(service.getMetrics());
    setConfig(service.getConfig());
    setIsConnected(service.isConnected());

    const handlePlayerPredictionGenerated = (prediction: PlayerPrediction) => {
      setPlayerPredictions(prev => [prediction, ...prev.slice(0, 49)]);
    };

    const handleMatchPredictionGenerated = (prediction: MatchPrediction) => {
      setMatchPredictions(prev => [prediction, ...prev.slice(0, 49)]);
    };

    const handleTournamentPredictionGenerated = (prediction: TournamentPrediction) => {
      setTournamentPredictions(prev => [prediction, ...prev.slice(0, 49)]);
    };

    service.on('playerPredictionGenerated', handlePlayerPredictionGenerated);
    service.on('matchPredictionGenerated', handleMatchPredictionGenerated);
    service.on('tournamentPredictionGenerated', handleTournamentPredictionGenerated);

    return () => {
      service.off('playerPredictionGenerated', handlePlayerPredictionGenerated);
      service.off('matchPredictionGenerated', handleMatchPredictionGenerated);
      service.off('tournamentPredictionGenerated', handleTournamentPredictionGenerated);
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTogglePrediction = () => {
    setIsEnabled(!isEnabled);
    service.updateConfig({ enabled: !isEnabled });
  };

  const handleConfidenceThresholdChange = (event: Event, newValue: number | number[]) => {
    setConfidenceThreshold(newValue as number);
    service.updateConfig({ confidenceThreshold: newValue as number });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return '#00ff9d';
    if (confidence >= 75) return '#00a8ff';
    if (confidence >= 60) return '#ffcc00';
    return '#ff6666';
  };

  const getUpsetPotentialColor = (potential: number) => {
    if (potential >= 30) return '#ff6666';
    if (potential >= 20) return '#ffcc00';
    return '#00ff9d';
  };

  const cyberpunkPaper = {
    background: 'rgba(20, 20, 40, 0.95)',
    border: '1.5px solid #00fff7',
    boxShadow: '0 0 24px #00fff7, 0 0 8px #ff00ea',
    borderRadius: 10,
    color: '#fff',
    margin: '1.5rem 0',
    padding: '1.5rem',
  };

  const neonTextStyle = {
    color: '#fff',
    textShadow: '0 0 10px rgba(0, 255, 157, 0.8), 0 0 20px rgba(0, 255, 157, 0.4), 0 0 30px rgba(0, 255, 157, 0.2)',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  };

  const renderPlayerPredictions = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ ...neonTextStyle, color: '#ff00ea' }}>
          <Person sx={{ mr: 1, color: '#ff00ea' }} />
          Player Predictions
        </Typography>
        <Button
          variant="outlined"
          onClick={() => service.generatePlayerPrediction('player1', 'tournament_1')}
          sx={{ color: '#00ff9d', borderColor: '#00ff9d' }}
        >
          Generate New
        </Button>
      </Box>
      
      <Grid container spacing={2}>
        {playerPredictions.map((prediction) => (
          <Grid item xs={12} md={6} key={prediction.playerId}>
            <Card sx={{
              background: 'rgba(0, 255, 157, 0.05)',
              border: '1px solid rgba(0, 255, 157, 0.2)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(0, 255, 157, 0.1)',
                borderColor: 'rgba(0, 255, 157, 0.4)',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#00ff9d', fontWeight: 600 }}>
                    {prediction.playerName}
                  </Typography>
                  <Chip
                    label={`${prediction.predictedFinish}${prediction.predictedFinish === 1 ? 'st' : prediction.predictedFinish === 2 ? 'nd' : prediction.predictedFinish === 3 ? 'rd' : 'th'}`}
                    sx={{
                      background: 'linear-gradient(45deg, #ff00ea, #00fff7)',
                      color: '#fff',
                      fontWeight: 600
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#00a8ff', mb: 1 }}>
                    Win Probability: {prediction.winProbability.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={prediction.winProbability}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 168, 255, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #00a8ff, #00ff9d)',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ffcc00', mb: 1 }}>
                    Confidence: {prediction.confidence.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={prediction.confidence}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 204, 0, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #ffcc00, #ff6600)',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
                
                <Accordion sx={{ background: 'transparent', color: '#fff' }}>
                  <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#00ff9d' }} />}>
                    <Typography sx={{ color: '#00ff9d' }}>Key Factors</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={1}>
                      {Object.entries(prediction.factors).map(([key, value]) => (
                        <Grid item xs={6} key={key}>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {value}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ color: '#00a8ff', fontWeight: 600, mb: 1 }}>
                    Insights:
                  </Typography>
                  {prediction.insights.map((insight, index) => (
                    <Typography key={index} variant="body2" sx={{ color: '#ccc', mb: 0.5 }}>
                      • {insight}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderMatchPredictions = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ ...neonTextStyle, color: '#00a8ff' }}>
          <SportsEsports sx={{ mr: 1, color: '#00a8ff' }} />
          Match Predictions
        </Typography>
        <Button
          variant="outlined"
          onClick={() => service.generateMatchPrediction('match_2', 'player1', 'player2')}
          sx={{ color: '#00ff9d', borderColor: '#00ff9d' }}
        >
          Generate New
        </Button>
      </Box>
      
      <Grid container spacing={2}>
        {matchPredictions.map((prediction) => (
          <Grid item xs={12} md={6} key={prediction.matchId}>
            <Card sx={{
              background: 'rgba(0, 168, 255, 0.05)',
              border: '1px solid rgba(0, 168, 255, 0.2)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(0, 168, 255, 0.1)',
                borderColor: 'rgba(0, 168, 255, 0.4)',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#00a8ff', fontWeight: 600 }}>
                    {prediction.player1Name} vs {prediction.player2Name}
                  </Typography>
                  <Chip
                    label={prediction.predictedScore}
                    sx={{
                      background: 'linear-gradient(45deg, #00a8ff, #00ff9d)',
                      color: '#fff',
                      fontWeight: 600
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ff00ea', mb: 1 }}>
                    Predicted Winner: {prediction.predictedWinner}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#00ff9d', mb: 1 }}>
                    Win Probability: {prediction.winProbability.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffcc00', mb: 1 }}>
                    Estimated Duration: {prediction.estimatedDuration} minutes
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ffcc00', mb: 1 }}>
                    Confidence: {prediction.confidence.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={prediction.confidence}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 204, 0, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #ffcc00, #ff6600)',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ff6666', mb: 1 }}>
                    Upset Potential: {prediction.upsetPotential.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={prediction.upsetPotential}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 102, 102, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #ff6666, #ff0000)',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ color: '#00a8ff', fontWeight: 600, mb: 1 }}>
                    Key Insights:
                  </Typography>
                  {prediction.insights.map((insight, index) => (
                    <Typography key={index} variant="body2" sx={{ color: '#ccc', mb: 0.5 }}>
                      • {insight}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderTournamentPredictions = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ ...neonTextStyle, color: '#ff00ea' }}>
          <EmojiEvents sx={{ mr: 1, color: '#ff00ea' }} />
          Tournament Predictions
        </Typography>
        <Button
          variant="outlined"
          onClick={() => service.generateTournamentPrediction('tournament_1')}
          sx={{ color: '#00ff9d', borderColor: '#00ff9d' }}
        >
          Generate New
        </Button>
      </Box>
      
      {tournamentPredictions.map((prediction) => (
        <Card key={prediction.tournamentId} sx={{
          background: 'rgba(255, 0, 234, 0.05)',
          border: '1px solid rgba(255, 0, 234, 0.2)',
          borderRadius: 2,
          mb: 2,
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(255, 0, 234, 0.1)',
            borderColor: 'rgba(255, 0, 234, 0.4)',
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ color: '#ff00ea', fontWeight: 600 }}>
                {prediction.tournamentName}
              </Typography>
              <Chip
                label={`${prediction.confidence.toFixed(1)}% Confidence`}
                sx={{
                  background: 'linear-gradient(45deg, #ff00ea, #00fff7)',
                  color: '#fff',
                  fontWeight: 600
                }}
              />
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 1 }}>
                  🏆 Predicted Winner: {prediction.predictedWinner}
                </Typography>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 1 }}>
                  🥈 Runner Up: {prediction.runnerUp}
                </Typography>
                <Typography variant="body1" sx={{ color: '#ffcc00', mb: 2 }}>
                  🥉 Semifinalists: {prediction.semifinalists.join(', ')}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ color: '#ff6666', mb: 1 }}>
                  🐎 Dark Horses:
                </Typography>
                {prediction.darkHorses.map((horse, index) => (
                  <Typography key={index} variant="body2" sx={{ color: '#ccc', mb: 0.5 }}>
                    • {horse.playerName} - {horse.upsetPotential.toFixed(1)}% upset potential
                  </Typography>
                ))}
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ color: '#00a8ff', fontWeight: 600, mb: 1 }}>
                Tournament Insights:
              </Typography>
              {prediction.insights.map((insight, index) => (
                <Typography key={index} variant="body2" sx={{ color: '#ccc', mb: 0.5 }}>
                  • {insight}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderMetrics = () => (
    <Box>
      <Typography variant="h6" sx={{ ...neonTextStyle, color: '#00ff9d', mb: 2 }}>
        <Analytics sx={{ mr: 1, color: '#00ff9d' }} />
        Prediction Metrics
      </Typography>
      
      {metrics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'rgba(0, 255, 157, 0.05)',
              border: '1px solid rgba(0, 255, 157, 0.2)',
              borderRadius: 2
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  Overall Performance
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#00a8ff', mb: 1 }}>
                    Accuracy: {metrics.accuracy.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.accuracy}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 168, 255, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #00a8ff, #00ff9d)',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ffcc00', mb: 1 }}>
                    Average Confidence: {metrics.averageConfidence.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.averageConfidence}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 204, 0, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #ffcc00, #ff6600)',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  Total Predictions: {metrics.totalPredictions}
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  Correct Predictions: {metrics.correctPredictions}
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  Recent Accuracy: {metrics.recentAccuracy.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'rgba(0, 168, 255, 0.05)',
              border: '1px solid rgba(0, 168, 255, 0.2)',
              borderRadius: 2
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Model Performance
                </Typography>
                
                {Object.entries(metrics.modelPerformance).map(([model, performance]) => (
                  <Box key={model} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#ffcc00', mb: 1 }}>
                      {model.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {performance.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={performance}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 204, 0, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #ffcc00, #ff6600)',
                          borderRadius: 3,
                        }
                      }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderSettings = () => (
    <Box>
      <Typography variant="h6" sx={{ ...neonTextStyle, color: '#ffcc00', mb: 2 }}>
        <Settings sx={{ mr: 1, color: '#ffcc00' }} />
        Prediction Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(255, 204, 0, 0.05)',
            border: '1px solid rgba(255, 204, 0, 0.2)',
            borderRadius: 2
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#ffcc00', mb: 2 }}>
                General Settings
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled}
                    onChange={handleTogglePrediction}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00ff9d',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00ff9d',
                      },
                    }}
                  />
                }
                label="Enable AI Predictions"
                sx={{ color: '#fff', mb: 2 }}
              />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#ffcc00', mb: 1 }}>
                  Confidence Threshold: {confidenceThreshold}%
                </Typography>
                <Slider
                  value={confidenceThreshold}
                  onChange={handleConfidenceThresholdChange}
                  min={50}
                  max={95}
                  step={5}
                  sx={{
                    color: '#ffcc00',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#ffcc00',
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: '#ffcc00',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(0, 255, 157, 0.05)',
            border: '1px solid rgba(0, 255, 157, 0.2)',
            borderRadius: 2
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                Model Configuration
              </Typography>
              
              {config && Object.entries(config.modelWeights).map(([factor, weight]) => (
                <Box key={factor} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#00a8ff', mb: 1 }}>
                    {factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {(weight * 100).toFixed(0)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={weight * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(0, 168, 255, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #00a8ff, #00ff9d)',
                        borderRadius: 3,
                      }
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', minHeight: '80vh', mt: 2 }}>
      <Paper sx={cyberpunkPaper}>
        <Alert 
          severity="info" 
          icon={<Info />}
          sx={{
            mb: 3,
            background: 'rgba(0, 168, 255, 0.1)',
            border: '1px solid rgba(0, 168, 255, 0.3)',
            color: '#00a8ff',
            '& .MuiAlert-icon': { color: '#00a8ff' },
            '& .MuiAlert-message': { color: '#00a8ff' }
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            🎯 Analytics & Entertainment Only
          </Typography>
          <Typography variant="body2">
            This AI prediction system is designed for <strong>analytics, entertainment, and performance analysis purposes only</strong>. 
            It is <strong>NOT intended for betting or gambling</strong>. All predictions are for fun and educational purposes to enhance 
            the tournament experience and provide insights into player performance and match dynamics.
          </Typography>
        </Alert>

        <Typography variant="h4" sx={{ ...neonTextStyle, mb: 2 }}>
          AI Tournament Prediction & Forecasting
        </Typography>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '2px solid #00fff7',
            mb: 2,
            '.MuiTab-root': { color: '#fff', fontWeight: 600 },
            '.Mui-selected': { color: '#ff00ea !important' },
            '.MuiTabs-indicator': { background: 'linear-gradient(90deg,#00fff7,#ff00ea)' },
          }}
        >
          <Tab icon={<Person />} label="Player Predictions" />
          <Tab icon={<SportsEsports />} label="Match Predictions" />
          <Tab icon={<EmojiEvents />} label="Tournament Predictions" />
          <Tab icon={<Analytics />} label="Metrics" />
          <Tab icon={<Settings />} label="Settings" />
        </Tabs>
        
        <Divider sx={{ mb: 2, borderColor: '#00fff7' }} />
        
        <TabPanel value={tabValue} index={0}>
          {renderPlayerPredictions()}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {renderMatchPredictions()}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {renderTournamentPredictions()}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          {renderMetrics()}
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          {renderSettings()}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default TournamentPredictionComponent; 