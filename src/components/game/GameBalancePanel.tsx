import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Speed,
  Psychology,
  Analytics,
  Feedback,
  Settings,
  Assessment,
  Timeline,
  Star
} from '@mui/icons-material';
import GameBalanceService, {
  PlayerSkillProfile,
  DifficultyAdjustment,
  MatchmakingCriteria,
  GameBalanceMetrics,
  ProgressionCurve,
  SeasonalEvent,
  PlayerFeedback
} from '../../services/GameBalanceService';

interface GameBalancePanelProps {
  playerId?: string;
}

const GameBalancePanel: React.FC<GameBalancePanelProps> = ({ playerId = 'player1' }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [playerProfile, setPlayerProfile] = useState<PlayerSkillProfile | null>(null);
  const [difficultyAdjustment, setDifficultyAdjustment] = useState<DifficultyAdjustment | null>(null);
  const [matchmakingCriteria, setMatchmakingCriteria] = useState<MatchmakingCriteria>({
    skillRange: 200,
    experienceRange: 5000,
    maxWaitTime: 60,
    preferredMode: 'competitive',
    allowCrossSkill: false
  });
  const [balanceMetrics, setBalanceMetrics] = useState<GameBalanceMetrics | null>(null);
  const [progressionCurves, setProgressionCurves] = useState<ProgressionCurve[]>([]);
  const [seasonalEvents, setSeasonalEvents] = useState<SeasonalEvent[]>([]);
  const [playerFeedback, setPlayerFeedback] = useState<PlayerFeedback[]>([]);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [newFeedback, setNewFeedback] = useState<Partial<PlayerFeedback>>({
    feedbackType: 'balance',
    rating: 5,
    comment: '',
    category: 'competitive'
  });

  const gameBalanceService = GameBalanceService.getInstance();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [playerId]);

  const loadData = () => {
    const profile = gameBalanceService.getPlayerProfile(playerId);
    const adjustment = gameBalanceService.getDifficultyAdjustment(playerId);
    const metrics = gameBalanceService.calculateBalanceMetrics();
    const curves = [
      gameBalanceService.getProgressionCurve('casual'),
      gameBalanceService.getProgressionCurve('competitive'),
      gameBalanceService.getProgressionCurve('professional')
    ].filter(Boolean) as ProgressionCurve[];
    const events = gameBalanceService.getActiveSeasonalEvents();
    const feedback = gameBalanceService.getPlayerFeedback();

    setPlayerProfile(profile || null);
    setDifficultyAdjustment(adjustment || null);
    setBalanceMetrics(metrics);
    setProgressionCurves(curves);
    setSeasonalEvents(events);
    setPlayerFeedback(feedback);
  };

  const handleCalculateDifficulty = () => {
    try {
      const adjustment = gameBalanceService.calculateDifficultyAdjustment(playerId);
      setDifficultyAdjustment(adjustment);
    } catch (error) {
      console.error('Error calculating difficulty adjustment:', error);
    }
  };

  const handleFindOpponents = () => {
    const opponents = gameBalanceService.findMatchmakingOpponents(playerId, matchmakingCriteria);
    console.log('Found opponents:', opponents);
  };

  const handleSubmitFeedback = () => {
    if (newFeedback.feedbackType && newFeedback.rating && newFeedback.comment && newFeedback.category) {
      const feedback: PlayerFeedback = {
        playerId,
        feedbackType: newFeedback.feedbackType as any,
        rating: newFeedback.rating,
        comment: newFeedback.comment,
        category: newFeedback.category as any,
        timestamp: new Date()
      };
      
      gameBalanceService.submitFeedback(feedback);
      setFeedbackDialog(false);
      setNewFeedback({
        feedbackType: 'balance',
        rating: 5,
        comment: '',
        category: 'competitive'
      });
      loadData();
    }
  };

  const getBalanceScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getSkillCategoryColor = (category: string) => {
    switch (category) {
      case 'professional': return 'error';
      case 'competitive': return 'warning';
      case 'casual': return 'success';
      default: return 'default';
    }
  };

  const tabs = [
    { label: 'Player Profile', icon: <Assessment /> },
    { label: 'Difficulty Adjustment', icon: <Settings /> },
    { label: 'Matchmaking', icon: <Psychology /> },
    { label: 'Progression Curves', icon: <TrendingUp /> },
    { label: 'Balance Metrics', icon: <Analytics /> },
    { label: 'Seasonal Events', icon: <Timeline /> },
    { label: 'Player Feedback', icon: <Feedback /> }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Star color="primary" />
        Game Balance & Progression Tuning
      </Typography>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Grid container spacing={1}>
          {tabs.map((tab, index) => (
            <Grid item key={index}>
              <Button
                variant={activeTab === index ? 'contained' : 'outlined'}
                startIcon={tab.icon}
                onClick={() => setActiveTab(index)}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                {tab.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && (
          <PlayerProfileTab playerProfile={playerProfile} />
        )}

        {activeTab === 1 && (
          <DifficultyAdjustmentTab 
            playerProfile={playerProfile}
            difficultyAdjustment={difficultyAdjustment}
            onCalculate={handleCalculateDifficulty}
          />
        )}

        {activeTab === 2 && (
          <MatchmakingTab 
            matchmakingCriteria={matchmakingCriteria}
            setMatchmakingCriteria={setMatchmakingCriteria}
            onFindOpponents={handleFindOpponents}
          />
        )}

        {activeTab === 3 && (
          <ProgressionCurvesTab progressionCurves={progressionCurves} />
        )}

        {activeTab === 4 && (
          <BalanceMetricsTab balanceMetrics={balanceMetrics} />
        )}

        {activeTab === 5 && (
          <SeasonalEventsTab seasonalEvents={seasonalEvents} />
        )}

        {activeTab === 6 && (
          <PlayerFeedbackTab 
            playerFeedback={playerFeedback}
            onOpenFeedbackDialog={() => setFeedbackDialog(true)}
          />
        )}
      </Box>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Game Balance Feedback</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Feedback Type</InputLabel>
                <Select
                  value={newFeedback.feedbackType}
                  onChange={(e) => setNewFeedback({ ...newFeedback, feedbackType: e.target.value })}
                >
                  <MenuItem value="balance">Game Balance</MenuItem>
                  <MenuItem value="progression">Progression</MenuItem>
                  <MenuItem value="matchmaking">Matchmaking</MenuItem>
                  <MenuItem value="rewards">Rewards</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newFeedback.category}
                  onChange={(e) => setNewFeedback({ ...newFeedback, category: e.target.value })}
                >
                  <MenuItem value="casual">Casual</MenuItem>
                  <MenuItem value="competitive">Competitive</MenuItem>
                  <MenuItem value="professional">Professional</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Rating</Typography>
              <Slider
                value={newFeedback.rating || 5}
                onChange={(_, value) => setNewFeedback({ ...newFeedback, rating: value as number })}
                min={1}
                max={5}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comment"
                value={newFeedback.comment}
                onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitFeedback} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Tab Components
const PlayerProfileTab: React.FC<{ playerProfile: PlayerSkillProfile | null }> = ({ playerProfile }) => {
  if (!playerProfile) {
    return <Alert severity="info">No player profile found</Alert>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Player Information</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Player ID" secondary={playerProfile.playerId} />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Skill Category" 
                  secondary={
                    <Chip 
                      label={playerProfile.skillCategory} 
                      color={playerProfile.skillCategory === 'professional' ? 'error' : 
                             playerProfile.skillCategory === 'competitive' ? 'warning' : 'success'}
                      size="small"
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Progression Curve" 
                  secondary={
                    <Chip 
                      label={playerProfile.progressionCurve} 
                      color={playerProfile.progressionCurve === 'fast' ? 'success' : 
                             playerProfile.progressionCurve === 'normal' ? 'warning' : 'error'}
                      size="small"
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Matches Played" secondary={playerProfile.matchesPlayed} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Win Rate" secondary={`${(playerProfile.winRate * 100).toFixed(1)}%`} />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Skill Ratings</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>Overall Rating: {playerProfile.overallRating}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={(playerProfile.overallRating / 3000) * 100} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>Accuracy: {playerProfile.accuracy}%</Typography>
              <LinearProgress 
                variant="determinate" 
                value={playerProfile.accuracy} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>Strategy: {playerProfile.strategy}%</Typography>
              <LinearProgress 
                variant="determinate" 
                value={playerProfile.strategy} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>Consistency: {playerProfile.consistency}%</Typography>
              <LinearProgress 
                variant="determinate" 
                value={playerProfile.consistency} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Performance</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {playerProfile.recentPerformance.map((perf, index) => (
                <Chip
                  key={index}
                  label={`${(perf * 100).toFixed(0)}%`}
                  color={perf >= 0.7 ? 'success' : perf >= 0.5 ? 'warning' : 'error'}
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const DifficultyAdjustmentTab: React.FC<{
  playerProfile: PlayerSkillProfile | null;
  difficultyAdjustment: DifficultyAdjustment | null;
  onCalculate: () => void;
}> = ({ playerProfile, difficultyAdjustment, onCalculate }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Dynamic Difficulty Adjustment</Typography>
            <Button 
              variant="contained" 
              onClick={onCalculate}
              startIcon={<Settings />}
              sx={{ mb: 2 }}
            >
              Calculate Difficulty Adjustment
            </Button>

            {difficultyAdjustment && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>Adjustment Factors:</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Base Difficulty</Typography>
                    <Typography variant="h6">{difficultyAdjustment.baseDifficulty.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Adjusted Difficulty</Typography>
                    <Typography variant="h6" color="primary">{difficultyAdjustment.adjustedDifficulty.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Recent Performance</Typography>
                    <Typography variant="h6">{difficultyAdjustment.factors.recentPerformance.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Skill Gap</Typography>
                    <Typography variant="h6">{difficultyAdjustment.factors.skillGap.toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const MatchmakingTab: React.FC<{
  matchmakingCriteria: MatchmakingCriteria;
  setMatchmakingCriteria: (criteria: MatchmakingCriteria) => void;
  onFindOpponents: () => void;
}> = ({ matchmakingCriteria, setMatchmakingCriteria, onFindOpponents }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Matchmaking Criteria</Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Skill Range: {matchmakingCriteria.skillRange}</Typography>
              <Slider
                value={matchmakingCriteria.skillRange}
                onChange={(_, value) => setMatchmakingCriteria({ ...matchmakingCriteria, skillRange: value as number })}
                min={50}
                max={500}
                step={50}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Experience Range: {matchmakingCriteria.experienceRange}</Typography>
              <Slider
                value={matchmakingCriteria.experienceRange}
                onChange={(_, value) => setMatchmakingCriteria({ ...matchmakingCriteria, experienceRange: value as number })}
                min={1000}
                max={20000}
                step={1000}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Max Wait Time: {matchmakingCriteria.maxWaitTime}s</Typography>
              <Slider
                value={matchmakingCriteria.maxWaitTime}
                onChange={(_, value) => setMatchmakingCriteria({ ...matchmakingCriteria, maxWaitTime: value as number })}
                min={30}
                max={300}
                step={30}
              />
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Preferred Mode</InputLabel>
              <Select
                value={matchmakingCriteria.preferredMode}
                onChange={(e) => setMatchmakingCriteria({ ...matchmakingCriteria, preferredMode: e.target.value as any })}
              >
                <MenuItem value="casual">Casual</MenuItem>
                <MenuItem value="competitive">Competitive</MenuItem>
                <MenuItem value="tournament">Tournament</MenuItem>
              </Select>
            </FormControl>

            <Button 
              variant="contained" 
              onClick={onFindOpponents}
              startIcon={<Psychology />}
              fullWidth
            >
              Find Opponents
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Matchmaking Settings</Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Allow Cross-Skill Matches" 
                  secondary="Match players from different skill categories"
                />
                <ListItemSecondaryAction>
                  <Button
                    variant={matchmakingCriteria.allowCrossSkill ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setMatchmakingCriteria({ 
                      ...matchmakingCriteria, 
                      allowCrossSkill: !matchmakingCriteria.allowCrossSkill 
                    })}
                  >
                    {matchmakingCriteria.allowCrossSkill ? 'Enabled' : 'Disabled'}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const ProgressionCurvesTab: React.FC<{ progressionCurves: ProgressionCurve[] }> = ({ progressionCurves }) => {
  return (
    <Grid container spacing={3}>
      {progressionCurves.map((curve) => (
        <Grid item xs={12} md={4} key={curve.playerType}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                {curve.playerType} Progression
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>Experience Multiplier: {curve.experienceMultiplier}x</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={curve.experienceMultiplier * 50} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>Skill Gain Rate: {curve.skillGainRate}x</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={curve.skillGainRate * 50} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>Reward Scaling: {curve.rewardScaling}x</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={curve.rewardScaling * 50} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Chip 
                label={curve.seasonalResets ? 'Seasonal Resets' : 'No Resets'} 
                color={curve.seasonalResets ? 'primary' : 'default'}
                size="small"
              />

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Milestones:</Typography>
              <List dense>
                {curve.milestones.map((milestone, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={`Level ${milestone.level}`}
                      secondary={`${milestone.experienceRequired.toLocaleString()} XP`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const BalanceMetricsTab: React.FC<{ balanceMetrics: GameBalanceMetrics | null }> = ({ balanceMetrics }) => {
  if (!balanceMetrics) {
    return <Alert severity="info">No balance metrics available</Alert>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Balance Score</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h3" color={getBalanceScoreColor(balanceMetrics.balanceScore) as any}>
                {balanceMetrics.balanceScore}
              </Typography>
              <Typography variant="body2" color="textSecondary">/ 100</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={balanceMetrics.balanceScore} 
              color={getBalanceScoreColor(balanceMetrics.balanceScore) as any}
              sx={{ height: 12, borderRadius: 6 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Skill Gap Analysis</Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Average Gap" 
                  secondary={balanceMetrics.skillGapAnalysis.averageGap.toFixed(0)}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Max Gap" 
                  secondary={balanceMetrics.skillGapAnalysis.maxGap.toFixed(0)}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Problematic Gaps" 
                  secondary={balanceMetrics.skillGapAnalysis.problematicGaps}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recommendations</Typography>
            <List>
              {balanceMetrics.recommendations.map((rec, index) => (
                <ListItem key={index}>
                  <ListItemText primary={rec} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const SeasonalEventsTab: React.FC<{ seasonalEvents: SeasonalEvent[] }> = ({ seasonalEvents }) => {
  if (seasonalEvents.length === 0) {
    return <Alert severity="info">No active seasonal events</Alert>;
  }

  return (
    <Grid container spacing={3}>
      {seasonalEvents.map((event) => (
        <Grid item xs={12} md={6} key={event.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{event.name}</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
              </Typography>
              
              <Chip 
                label={event.type} 
                color="primary" 
                size="small" 
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" gutterBottom>Rewards:</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">Experience: {event.rewards.experience.toLocaleString()}</Typography>
                <Typography variant="body2">Coins: {event.rewards.coins.toLocaleString()}</Typography>
                <Typography variant="body2">Items: {event.rewards.items.join(', ')}</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip 
                  label={`${event.progressionMultiplier}x Progression`} 
                  color="success" 
                  size="small"
                />
                <Chip 
                  label={`${event.skillAdjustment > 0 ? '+' : ''}${(event.skillAdjustment * 100).toFixed(0)}% Skill`} 
                  color="warning" 
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const PlayerFeedbackTab: React.FC<{
  playerFeedback: PlayerFeedback[];
  onOpenFeedbackDialog: () => void;
}> = ({ playerFeedback, onOpenFeedbackDialog }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Player Feedback</Typography>
          <Button 
            variant="contained" 
            onClick={onOpenFeedbackDialog}
            startIcon={<Feedback />}
          >
            Submit Feedback
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12}>
        {playerFeedback.length === 0 ? (
          <Alert severity="info">No feedback submitted yet</Alert>
        ) : (
          <Card>
            <CardContent>
              <List>
                {playerFeedback.map((feedback, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{feedback.feedbackType}</Typography>
                          <Chip 
                            label={feedback.category} 
                            size="small" 
                            color={getSkillCategoryColor(feedback.category) as any}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                color={i < feedback.rating ? 'primary' : 'disabled'} 
                                fontSize="small"
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {feedback.comment}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {feedback.timestamp.toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );
};

export default GameBalancePanel; 