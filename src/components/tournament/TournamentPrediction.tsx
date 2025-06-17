import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Psychology,
  EmojiEvents,
  Analytics,
  ShowChart,
  Assessment,
  Star,
  Speed,
  Target,
  Timeline,
  Visibility,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '1px solid #00d4ff',
  borderRadius: 12,
  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 212, 255, 0.2)',
  },
}));

const PredictionCard = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)',
  border: '1px solid #00d4ff',
  borderRadius: 8,
  padding: 16,
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, #00d4ff, #ff0080)',
  },
}));

const PredictionBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '& .MuiLinearProgress-bar': {
    background: 'linear-gradient(90deg, #00d4ff, #ff0080)',
    borderRadius: 4,
  },
}));

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

const TournamentPrediction: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [predictions, setPredictions] = useState({
    playerStats: [],
    matchPredictions: [],
    tournamentSeedings: [],
  });

  useEffect(() => {
    // Mock data for demonstration
    const mockData = {
      playerStats: [
        {
          id: 'player1',
          name: 'Neon Shadow',
          rating: 9.8,
          winRate: 0.92,
          recentForm: 0.95,
          seed: 1,
          strengths: ['Break shots', 'Position play', 'Mental game'],
          weaknesses: ['Long shots under pressure'],
          playStyle: 'aggressive',
        },
        {
          id: 'player2',
          name: 'Digital Phantom',
          rating: 9.2,
          winRate: 0.85,
          recentForm: 0.88,
          seed: 2,
          strengths: ['Long shots', 'Bank shots', 'Defensive play'],
          weaknesses: ['Break consistency'],
          playStyle: 'defensive',
        },
        {
          id: 'player3',
          name: 'Cyber Striker',
          rating: 8.9,
          winRate: 0.78,
          recentForm: 0.82,
          seed: 3,
          strengths: ['Safety shots', 'Consistency', 'Pressure handling'],
          weaknesses: ['Aggressive play'],
          playStyle: 'balanced',
        },
        {
          id: 'player4',
          name: 'Quantum Pool',
          rating: 8.5,
          winRate: 0.72,
          recentForm: 0.78,
          seed: 4,
          strengths: ['Creativity', 'Unpredictable shots', 'Comeback ability'],
          weaknesses: ['Consistency', 'Defensive play'],
          playStyle: 'aggressive',
        },
      ],
      matchPredictions: [
        {
          matchId: 'match_1_2',
          player1Name: 'Neon Shadow',
          player2Name: 'Digital Phantom',
          player1WinProbability: 0.68,
          player2WinProbability: 0.32,
          confidence: 0.85,
          aiInsights: [
            'Neon Shadow has a significant advantage in this matchup',
            'Neon Shadow\'s break shots could be the deciding factor',
            'Digital Phantom is in excellent form and could cause an upset',
          ],
        },
        {
          matchId: 'match_1_3',
          player1Name: 'Neon Shadow',
          player2Name: 'Cyber Striker',
          player1WinProbability: 0.72,
          player2WinProbability: 0.28,
          confidence: 0.82,
          aiInsights: [
            'This is a closely contested matchup with no clear favorite',
            'Recent form and mental game will likely decide the outcome',
          ],
        },
        {
          matchId: 'match_2_3',
          player1Name: 'Digital Phantom',
          player2Name: 'Cyber Striker',
          player1WinProbability: 0.55,
          player2WinProbability: 0.45,
          confidence: 0.78,
          aiInsights: [
            'Digital Phantom has historically dominated this matchup',
            'Cyber Striker\'s consistency could be the key factor',
          ],
        },
      ],
      tournamentSeedings: [
        {
          tournamentId: 'current_tournament',
          players: [
            { id: 'player1', name: 'Neon Shadow', seed: 1, rating: 9.8, predictedFinish: 1 },
            { id: 'player2', name: 'Digital Phantom', seed: 2, rating: 9.2, predictedFinish: 2 },
            { id: 'player3', name: 'Cyber Striker', seed: 3, rating: 8.9, predictedFinish: 3 },
            { id: 'player4', name: 'Quantum Pool', seed: 4, rating: 8.5, predictedFinish: 4 },
          ],
          tournamentWinner: {
            playerId: 'player1',
            playerName: 'Neon Shadow',
            probability: 0.45,
          },
          darkHorses: [
            {
              playerId: 'player3',
              playerName: 'Cyber Striker',
              seed: 3,
              probability: 0.25,
              reason: 'Strong recent form and high consistency despite lower seeding',
            },
          ],
        },
      ],
    };

    setPredictions(mockData);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 9.0) return '#00ff88';
    if (rating >= 8.0) return '#00d4ff';
    if (rating >= 7.0) return '#ffaa00';
    return '#ff4444';
  };

  const renderPlayerRankings = () => (
    <StyledCard sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
          <EmojiEvents sx={{ mr: 1 }} />
          Player Rankings & Predictions
        </Typography>
        <List>
          {predictions.playerStats.map((player: any, index: number) => (
            <ListItem key={player.id} sx={{ px: 0 }}>
              <ListItemIcon>
                <Badge badgeContent={player.seed} color="primary">
                  <Avatar sx={{ bgcolor: getPerformanceColor(player.rating) }}>
                    {player.name.charAt(0)}
                  </Avatar>
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ color: '#ffffff' }}>
                      {player.name}
                    </Typography>
                    <Chip
                      label={`${player.rating.toFixed(1)}`}
                      size="small"
                      sx={{
                        bgcolor: getPerformanceColor(player.rating),
                        color: '#000000',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      Seed #{player.seed} • Win Rate: {(player.winRate * 100).toFixed(0)}% • Recent Form: {(player.recentForm * 100).toFixed(0)}%
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ color: '#00d4ff' }}>
                        Strengths: {player.strengths.slice(0, 2).join(', ')}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#ff4444' }}>
                        Weaknesses: {player.weaknesses.slice(0, 1).join(', ')}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </StyledCard>
  );

  const renderMatchPredictions = () => (
    <StyledCard sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
          <Analytics sx={{ mr: 1 }} />
          AI Match Predictions
        </Typography>
        {predictions.matchPredictions.map((match: any) => (
          <Box key={match.matchId} sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 212, 255, 0.05)', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ color: '#ffffff', mb: 2, textAlign: 'center' }}>
              {match.player1Name} vs {match.player2Name}
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#00d4ff' }}>
                    {(match.player1WinProbability * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {match.player1Name}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#ff0080' }}>
                    {(match.player2WinProbability * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {match.player2Name}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                Confidence: {(match.confidence * 100).toFixed(0)}%
              </Typography>
              <PredictionBar variant="determinate" value={match.confidence * 100} />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ color: '#ffffff', mb: 1 }}>
                AI Insights:
              </Typography>
              {match.aiInsights.map((insight: string, index: number) => (
                <Typography key={index} variant="caption" sx={{ color: '#b0b0b0', display: 'block', mb: 0.5 }}>
                  • {insight}
                </Typography>
              ))}
            </Box>
          </Box>
        ))}
      </CardContent>
    </StyledCard>
  );

  const renderTournamentSeeding = () => (
    <StyledCard sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
          <ShowChart sx={{ mr: 1 }} />
          Tournament Seeding & Bracket Predictions
        </Typography>
        
        {predictions.tournamentSeedings.map((seeding: any) => (
          <Box key={seeding.tournamentId}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ color: '#ffffff', mb: 2 }}>
                  Tournament Winner Prediction
                </Typography>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(0, 255, 136, 0.1)', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ color: '#00ff88' }}>
                    {seeding.tournamentWinner.playerName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {(seeding.tournamentWinner.probability * 100).toFixed(0)}% probability
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ color: '#ffffff', mb: 2 }}>
                  Dark Horses
                </Typography>
                {seeding.darkHorses.map((horse: any) => (
                  <Box key={horse.playerId} sx={{ mb: 2, p: 2, bgcolor: 'rgba(255, 170, 0, 0.1)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ color: '#ffaa00' }}>
                      {horse.playerName} (Seed #{horse.seed})
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      {(horse.probability * 100).toFixed(0)}% probability
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ffaa00' }}>
                      {horse.reason}
                    </Typography>
                  </Box>
                ))}
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" sx={{ color: '#ffffff', mb: 2 }}>
              Seeding Order
            </Typography>
            <Grid container spacing={2}>
              {seeding.players.map((player: any) => (
                <Grid item xs={12} sm={6} md={3} key={player.id}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(0, 212, 255, 0.1)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ color: '#00d4ff' }}>
                      #{player.seed}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>
                      {player.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                      Predicted Finish: {player.predictedFinish}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </CardContent>
    </StyledCard>
  );

  const renderAIAnalysis = () => (
    <StyledCard>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 1 }} />
          AI Analysis & Strategy Recommendations
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ color: '#ffffff', mb: 2 }}>
              Key Insights
            </Typography>
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <TrendingUp sx={{ color: '#00ff88' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Neon Shadow's aggressive play style gives advantage in early rounds"
                  secondary="Break shot dominance and mental game strength"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Target sx={{ color: '#ff0080' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Digital Phantom's defensive strategy effective against lower seeds"
                  secondary="Bank shot accuracy and safety play key factors"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Speed sx={{ color: '#ffaa00' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Cyber Striker's consistency could lead to upset victories"
                  secondary="Pressure handling and safety shot mastery"
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ color: '#ffffff', mb: 2 }}>
              Strategy Recommendations
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'rgba(0, 212, 255, 0.1)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: '#ffffff', mb: 1 }}>
                For Top Seeds:
              </Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block', mb: 1 }}>
                • Maintain aggressive play but focus on shot selection
              </Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block', mb: 1 }}>
                • Use mental game advantage in pressure situations
              </Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block', mb: 2 }}>
                • Adapt strategy based on opponent's weaknesses
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#ffffff', mb: 1 }}>
                For Underdogs:
              </Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block', mb: 1 }}>
                • Focus on consistency and safety play
              </Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block', mb: 1 }}>
                • Look for opportunities to be aggressive
              </Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block' }}>
                • Capitalize on opponent's pressure situations
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </StyledCard>
  );

  return (
    <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)' }}>
      <Typography variant="h4" sx={{ color: '#00d4ff', mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
        Tournament Prediction & Seeding System
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(0, 212, 255, 0.3)', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#b0b0b0',
              '&.Mui-selected': {
                color: '#00d4ff',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00d4ff',
            },
          }}
        >
          <Tab label="Player Rankings" />
          <Tab label="Match Predictions" />
          <Tab label="Tournament Seeding" />
          <Tab label="AI Analysis" />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        {renderPlayerRankings()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        {renderMatchPredictions()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        {renderTournamentSeeding()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={3}>
        {renderAIAnalysis()}
      </TabPanel>
    </Box>
  );
};

export default TournamentPrediction; 