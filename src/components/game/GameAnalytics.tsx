import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  useTheme,
  alpha,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  Speed,
  Psychology,
  EmojiEvents,
  SportsCricket,
  Assessment,
  BarChart,
  ShowChart,
  Lightbulb,
  Warning,
  CheckCircle,
  Cancel,
  Refresh,
  Insights,
} from '@mui/icons-material';
import { Line, Bar, Radar } from 'recharts';
import { useGameState } from '../gameflow/GameStateManager';

interface GameAnalyticsProps {
  gameId: string;
  showAIInsights?: boolean;
  compactMode?: boolean;
}

interface PlayerStats {
  playerId: string;
  name: string;
  avatar?: string;
  shotsTotal: number;
  shotsSuccessful: number;
  accuracy: number;
  avgShotTime: number;
  bestStreak: number;
  currentStreak: number;
  fouls: number;
  safetyShots: number;
  avgDifficulty: number;
  aiRating: number;
}

interface AIInsight {
  id: string;
  type: 'tip' | 'warning' | 'prediction';
  message: string;
  confidence: number;
  timestamp: Date;
}

export const GameAnalytics: React.FC<GameAnalyticsProps> = ({
  gameId,
  showAIInsights = true,
  compactMode = false,
}) => {
  const theme = useTheme();
  const { gameState } = useGameState();
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'difficulty' | 'speed'>('accuracy');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Calculate player statistics from game state
  useEffect(() => {
    if (!gameState) return;

    const stats: Record<string, PlayerStats> = {};
    
    gameState.players.forEach(player => {
      const playerShots = gameState.shots.filter(s => s.playerId === player.id);
      const successfulShots = playerShots.filter(s => s.success);
      
      // Calculate streaks
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      
      playerShots.forEach(shot => {
        if (shot.success) {
          tempStreak++;
          currentStreak = tempStreak;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      });

      // Calculate average shot time
      let avgShotTime = 0;
      if (playerShots.length > 1) {
        const timeDiffs = playerShots.slice(1).map((shot, i) => 
          new Date(shot.timestamp).getTime() - new Date(playerShots[i].timestamp).getTime()
        );
        avgShotTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length / 1000; // in seconds
      }

      // Calculate average difficulty
      const avgDifficulty = playerShots.length > 0
        ? playerShots.reduce((sum, shot) => sum + (shot.analysis?.difficulty || 0), 0) / playerShots.length
        : 0;

      // Calculate AI rating
      const aiRating = calculateAIRating({
        accuracy: successfulShots.length / Math.max(playerShots.length, 1),
        avgDifficulty,
        avgShotTime,
        fouls: gameState.rules.fouls.filter(f => f.includes(player.id)).length,
      });

      stats[player.id] = {
        playerId: player.id,
        name: player.name,
        avatar: player.avatar,
        shotsTotal: playerShots.length,
        shotsSuccessful: successfulShots.length,
        accuracy: playerShots.length > 0 ? (successfulShots.length / playerShots.length) * 100 : 0,
        avgShotTime,
        bestStreak,
        currentStreak,
        fouls: gameState.rules.fouls.filter(f => f.includes(player.id)).length,
        safetyShots: playerShots.filter(s => s.analysis?.aiScore && s.analysis.aiScore < 0.3).length,
        avgDifficulty,
        aiRating,
      };
    });

    setPlayerStats(stats);
  }, [gameState]);

  // Generate AI insights
  useEffect(() => {
    if (!showAIInsights || !gameState) return;

    const insights: AIInsight[] = [];
    
    // Analyze recent shots for patterns
    const recentShots = gameState.shots.slice(-5);
    if (recentShots.length >= 3) {
      const recentAccuracy = recentShots.filter(s => s.success).length / recentShots.length;
      
      if (recentAccuracy < 0.3) {
        insights.push({
          id: `insight_${Date.now()}_1`,
          type: 'tip',
          message: 'Consider taking easier shots to build momentum',
          confidence: 0.85,
          timestamp: new Date(),
        });
      }
      
      if (recentAccuracy > 0.8) {
        insights.push({
          id: `insight_${Date.now()}_2`,
          type: 'prediction',
          message: 'Player is on fire! Victory probability increased by 15%',
          confidence: 0.75,
          timestamp: new Date(),
        });
      }
    }

    // Check for safety play opportunities
    const lastShot = gameState.shots[gameState.shots.length - 1];
    if (lastShot && !lastShot.success) {
      insights.push({
        id: `insight_${Date.now()}_3`,
        type: 'tip',
        message: 'Consider a safety shot to leave your opponent in a difficult position',
        confidence: 0.7,
        timestamp: new Date(),
      });
    }

    // Foul warnings
    const recentFouls = gameState.rules.fouls.slice(-2);
    if (recentFouls.length >= 2) {
      insights.push({
        id: `insight_${Date.now()}_4`,
        type: 'warning',
        message: 'Multiple fouls detected. Focus on clean shots to avoid penalties',
        confidence: 0.9,
        timestamp: new Date(),
      });
    }

    setAIInsights(prev => [...prev, ...insights].slice(-10)); // Keep last 10 insights
  }, [gameState, showAIInsights]);

  const calculateAIRating = (stats: any): number => {
    const weights = {
      accuracy: 0.4,
      difficulty: 0.3,
      speed: 0.2,
      fouls: 0.1,
    };
    
    const normalizedAccuracy = stats.accuracy;
    const normalizedDifficulty = Math.min(stats.avgDifficulty * 20, 100);
    const normalizedSpeed = Math.max(100 - (stats.avgShotTime * 2), 0);
    const normalizedFouls = Math.max(100 - (stats.fouls * 20), 0);
    
    return (
      normalizedAccuracy * weights.accuracy +
      normalizedDifficulty * weights.difficulty +
      normalizedSpeed * weights.speed +
      normalizedFouls * weights.fouls
    );
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'tip':
        return <Lightbulb sx={{ color: neonColors.info }} />;
      case 'warning':
        return <Warning sx={{ color: neonColors.warning }} />;
      case 'prediction':
        return <Insights sx={{ color: neonColors.primary }} />;
    }
  };

  const chartData = useMemo(() => {
    return gameState?.players.map(player => {
      const stats = playerStats[player.id];
      return {
        name: player.name,
        accuracy: stats?.accuracy || 0,
        difficulty: stats?.avgDifficulty * 20 || 0,
        speed: Math.max(100 - (stats?.avgShotTime || 0) * 2, 0),
        rating: stats?.aiRating || 0,
      };
    }) || [];
  }, [gameState, playerStats]);

  if (compactMode) {
    return (
      <Card
        sx={{
          background: alpha(theme.palette.background.paper, 0.95),
          border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
          borderRadius: 2,
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ color: neonColors.primary, mb: 2 }}>
            Quick Stats
          </Typography>
          <Grid container spacing={2}>
            {Object.values(playerStats).map(stats => (
              <Grid item xs={6} key={stats.playerId}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: neonColors.info }}>
                    {stats.accuracy.toFixed(0)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    {stats.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
          }}
        >
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Live Analytics
        </Typography>
        <IconButton
          onClick={refreshAnalytics}
          disabled={refreshing}
          sx={{
            color: neonColors.info,
            border: `1px solid ${alpha(neonColors.info, 0.3)}`,
            '&:hover': {
              background: alpha(neonColors.info, 0.1),
              borderColor: neonColors.info,
            },
          }}
        >
          <Refresh className={refreshing ? 'rotating' : ''} />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Player Stats Cards */}
        {Object.values(playerStats).map(stats => (
          <Grid item xs={12} md={6} key={stats.playerId}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(neonColors.info, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                border: `1px solid ${alpha(neonColors.info, 0.3)}`,
                borderRadius: 2,
                boxShadow: `0 0 20px ${alpha(neonColors.info, 0.2)}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={stats.avatar}
                    sx={{
                      width: 48,
                      height: 48,
                      background: `linear-gradient(135deg, ${neonColors.primary} 0%, ${neonColors.secondary} 100%)`,
                      mr: 2,
                    }}
                  >
                    {stats.name[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ color: neonColors.info }}>
                      {stats.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        AI Rating:
                      </Typography>
                      <Chip
                        label={stats.aiRating.toFixed(0)}
                        size="small"
                        sx={{
                          background: alpha(neonColors.primary, 0.2),
                          color: neonColors.primary,
                          border: `1px solid ${neonColors.primary}`,
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ color: neonColors.primary, fontWeight: 'bold' }}>
                        {stats.accuracy.toFixed(0)}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Accuracy
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ color: neonColors.warning, fontWeight: 'bold' }}>
                        {stats.currentStreak}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Current Streak
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2, borderColor: alpha(neonColors.info, 0.3) }} />

                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: neonColors.info }}>
                        {stats.shotsTotal}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Total Shots
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: neonColors.warning }}>
                        {stats.avgShotTime.toFixed(1)}s
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Avg Time
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: neonColors.error }}>
                        {stats.fouls}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Fouls
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Progress Bars */}
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      Shot Difficulty
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={stats.avgDifficulty * 20}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(neonColors.purple, 0.2),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: `linear-gradient(90deg, ${neonColors.purple} 0%, ${neonColors.secondary} 100%)`,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* AI Insights */}
        {showAIInsights && (
          <Grid item xs={12}>
            <Card
              sx={{
                background: alpha(theme.palette.background.paper, 0.95),
                border: `1px solid ${alpha(neonColors.secondary, 0.3)}`,
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    color: neonColors.secondary,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Psychology sx={{ mr: 1 }} />
                  AI Insights
                </Typography>
                
                {aiInsights.length === 0 ? (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    AI is analyzing the game...
                  </Typography>
                ) : (
                  <List>
                    {aiInsights.slice(-5).reverse().map((insight, index) => (
                      <ListItem
                        key={insight.id}
                        sx={{
                          background: alpha(neonColors[insight.type === 'warning' ? 'warning' : insight.type === 'tip' ? 'info' : 'primary'], 0.1),
                          border: `1px solid ${alpha(neonColors[insight.type === 'warning' ? 'warning' : insight.type === 'tip' ? 'info' : 'primary'], 0.3)}`,
                          borderRadius: 1,
                          mb: 1,
                          animation: index === 0 ? 'fadeIn 0.5s' : undefined,
                          '@keyframes fadeIn': {
                            from: { opacity: 0, transform: 'translateY(-10px)' },
                            to: { opacity: 1, transform: 'translateY(0)' },
                          },
                        }}
                      >
                        <ListItemAvatar>
                          {getInsightIcon(insight.type)}
                        </ListItemAvatar>
                        <ListItemText
                          primary={insight.message}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                Confidence: {(insight.confidence * 100).toFixed(0)}%
                              </Typography>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                • {moment(insight.timestamp).fromNow()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Performance Chart */}
        <Grid item xs={12}>
          <Card
            sx={{
              background: alpha(theme.palette.background.paper, 0.95),
              border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ color: neonColors.primary, mb: 2 }}>
                Performance Comparison
              </Typography>
              
              <Box sx={{ height: 300, position: 'relative' }}>
                {/* Chart would go here - using placeholder */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: alpha(neonColors.primary, 0.05),
                    border: `1px solid ${alpha(neonColors.primary, 0.2)}`,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Performance chart visualization
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Add moment import at the top of the file
import moment from 'moment';

export default GameAnalytics;