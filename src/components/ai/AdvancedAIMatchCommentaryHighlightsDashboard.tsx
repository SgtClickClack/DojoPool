import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Badge,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  VolumeOff,
  Share,
  Favorite,
  FavoriteBorder,
  ThumbUp,
  ThumbDown,
  Comment,
  Settings,
  Analytics,
  VideoLibrary,
  Mic,
  MicOff,
  AutoAwesome,
  TrendingUp,
  Visibility,
  Download,
  Delete,
  Edit,
  Refresh,
  Add,
  Speed,
  HighQuality,
  LowQuality
} from '@mui/icons-material';
import {
  useAdvancedAIMatchCommentaryHighlights,
  useMatchHighlights,
  useMatchCommentary,
  useAllHighlights,
  useAdvancedCommentaryConfig,
  useAdvancedCommentaryMetrics,
  useAdvancedCommentaryHealth,
  AdvancedHighlightRequest,
  AdvancedCommentaryRequest,
  AdvancedHighlight,
  AdvancedCommentaryEvent
} from '../../hooks/useAdvancedAIMatchCommentaryHighlights';

interface AdvancedAIMatchCommentaryHighlightsDashboardProps {
  matchId?: string;
  userId?: string;
  onHighlightGenerated?: (highlight: AdvancedHighlight) => void;
  onCommentaryGenerated?: (commentary: AdvancedCommentaryEvent) => void;
}

const AdvancedAIMatchCommentaryHighlightsDashboard: React.FC<AdvancedAIMatchCommentaryHighlightsDashboardProps> = ({
  matchId,
  userId,
  onHighlightGenerated,
  onCommentaryGenerated
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState(matchId || '');
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<AdvancedHighlight | null>(null);
  const [commentaryStyle, setCommentaryStyle] = useState<'professional' | 'casual' | 'excited' | 'analytical' | 'dramatic' | 'technical'>('professional');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeVideo, setIncludeVideo] = useState(true);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [duration, setDuration] = useState(60);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Hooks
  const {
    generateHighlights,
    generateCommentary,
    addReaction,
    shareHighlight,
    deleteHighlight,
    updateConfig,
    isGenerating: isGeneratingFromHook,
    generationProgress: progressFromHook,
    generateError,
    commentaryError
  } = useAdvancedAIMatchCommentaryHighlights();

  const { data: matchData, isLoading: isLoadingMatch } = useMatchHighlights(selectedMatchId);
  const { data: commentaryData, isLoading: isLoadingCommentary } = useMatchCommentary(selectedMatchId);
  const { data: allHighlights, isLoading: isLoadingAll } = useAllHighlights();
  const { data: config, isLoading: isLoadingConfig } = useAdvancedCommentaryConfig();
  const { data: metrics, isLoading: isLoadingMetrics } = useAdvancedCommentaryMetrics();
  const { data: health, isLoading: isLoadingHealth } = useAdvancedCommentaryHealth();

  // Effects
  useEffect(() => {
    if (matchId) setSelectedMatchId(matchId);
    if (userId) setSelectedUserId(userId);
  }, [matchId, userId]);

  useEffect(() => {
    setIsGenerating(isGeneratingFromHook);
    setGenerationProgress(progressFromHook);
  }, [isGeneratingFromHook, progressFromHook]);

  useEffect(() => {
    if (generateError) {
      setSnackbar({
        open: true,
        message: `Failed to generate highlights: ${generateError.message}`,
        severity: 'error'
      });
    }
  }, [generateError]);

  useEffect(() => {
    if (commentaryError) {
      setSnackbar({
        open: true,
        message: `Failed to generate commentary: ${commentaryError.message}`,
        severity: 'error'
      });
    }
  }, [commentaryError]);

  // Handlers
  const handleGenerateHighlights = async () => {
    if (!selectedMatchId || !selectedUserId) {
      setSnackbar({
        open: true,
        message: 'Please select a match and user',
        severity: 'error'
      });
      return;
    }

    try {
      const request: AdvancedHighlightRequest = {
        matchId: selectedMatchId,
        userId: selectedUserId,
        gameType: '8-ball',
        highlights: matchData?.highlights || [],
        commentaryStyle,
        includeAudio,
        includeVideo,
        duration,
        quality,
        customization: {
          theme: 'modern',
          effects: ['slow-motion', 'replay'],
          branding: 'DojoPool'
        }
      };

      const result = await generateHighlights(request);
      setSnackbar({
        open: true,
        message: 'Advanced highlights generated successfully!',
        severity: 'success'
      });
      setShowGenerateDialog(false);
      onHighlightGenerated?.(result);
    } catch (error) {
      console.error('Failed to generate highlights:', error);
    }
  };

  const handleGenerateCommentary = async (type: AdvancedCommentaryRequest['type'], description: string) => {
    if (!selectedMatchId) return;

    try {
      const request: AdvancedCommentaryRequest = {
        matchId: selectedMatchId,
        type,
        playerName: 'Player',
        description,
        context: {
          timestamp: new Date().toISOString(),
          gameState: 'active'
        }
      };

      const result = await generateCommentary(request);
      setSnackbar({
        open: true,
        message: 'Commentary generated successfully!',
        severity: 'success'
      });
      onCommentaryGenerated?.(result);
    } catch (error) {
      console.error('Failed to generate commentary:', error);
    }
  };

  const handleAddReaction = async (commentaryId: string, type: 'like' | 'love' | 'wow' | 'insightful' | 'funny' | 'disagree') => {
    try {
      await addReaction({
        commentaryId,
        userId: selectedUserId || 'user',
        userName: 'User',
        type
      });
      setSnackbar({
        open: true,
        message: 'Reaction added successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleShareHighlight = async (highlightId: string, platform: 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'tiktok') => {
    try {
      await shareHighlight({
        highlightId,
        platform,
        message: 'Check out this amazing pool highlight!'
      });
      setSnackbar({
        open: true,
        message: `Shared to ${platform} successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to share highlight:', error);
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    try {
      await deleteHighlight(highlightId);
      setSnackbar({
        open: true,
        message: 'Highlight deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to delete highlight:', error);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<typeof config>) => {
    try {
      await updateConfig(newConfig);
      setSnackbar({
        open: true,
        message: 'Configuration updated successfully!',
        severity: 'success'
      });
      setShowSettingsDialog(false);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'generating': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getCommentaryTypeIcon = (type: string) => {
    switch (type) {
      case 'shot': return <PlayArrow />;
      case 'foul': return <ThumbDown />;
      case 'score': return <TrendingUp />;
      case 'highlight': return <AutoAwesome />;
      case 'analysis': return <Analytics />;
      case 'blessing': return <AutoAwesome />;
      case 'fluke': return <Speed />;
      default: return <Comment />;
    }
  };

  if (isLoadingConfig || isLoadingHealth) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Advanced AI Match Commentary & Highlights
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Analytics />}
            onClick={() => setShowMetricsDialog(true)}
            sx={{ mr: 1 }}
          >
            Metrics
          </Button>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setShowSettingsDialog(true)}
            sx={{ mr: 1 }}
          >
            Settings
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setShowGenerateDialog(true)}
          >
            Generate Highlights
          </Button>
        </Box>
      </Box>

      {/* Health Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={health?.enabled ? 'Active' : 'Inactive'}
              color={health?.enabled ? 'success' : 'error'}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              Total Events: {metrics?.totalEvents || 0} | 
              Total Highlights: {metrics?.totalHighlights || 0} | 
              Last Activity: {health?.lastActivity ? new Date(health.lastActivity).toLocaleString() : 'N/A'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {isGenerating && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h6">Generating Advanced Highlights</Typography>
              <Chip label={`${Math.round(generationProgress)}%`} color="primary" />
            </Box>
            <LinearProgress variant="determinate" value={generationProgress} />
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Match Highlights */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Match Highlights ({matchData?.count || 0})
              </Typography>
              {isLoadingMatch ? (
                <LinearProgress />
              ) : matchData?.highlights && matchData.highlights.length > 0 ? (
                <List>
                  {matchData.highlights.slice(0, 5).map((highlight) => (
                    <ListItem key={highlight.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <VideoLibrary />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={highlight.title}
                        secondary={`${formatDuration(highlight.duration)} • ${highlight.quality} • ${highlight.views} views`}
                      />
                      <Box>
                        <Chip
                          label={highlight.status}
                          color={getStatusColor(highlight.status) as any}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => setSelectedHighlight(highlight)}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No highlights available for this match
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Live Commentary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Commentary ({commentaryData?.length || 0})
              </Typography>
              {isLoadingCommentary ? (
                <LinearProgress />
              ) : commentaryData && commentaryData.length > 0 ? (
                <List>
                  {commentaryData.slice(-5).reverse().map((commentary) => (
                    <ListItem key={commentary.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          {getCommentaryTypeIcon(commentary.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={commentary.description}
                        secondary={`${commentary.type} • ${new Date(commentary.timestamp).toLocaleTimeString()}`}
                      />
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleAddReaction(commentary.id, 'like')}
                        >
                          <ThumbUp fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleAddReaction(commentary.id, 'love')}
                        >
                          <Favorite fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No commentary available for this match
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* All Highlights Gallery */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All Highlights ({allHighlights?.length || 0})
              </Typography>
              {isLoadingAll ? (
                <LinearProgress />
              ) : allHighlights && allHighlights.length > 0 ? (
                <Grid container spacing={2}>
                  {allHighlights.slice(0, 8).map((highlight) => (
                    <Grid item xs={12} sm={6} md={3} key={highlight.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <VideoLibrary fontSize="small" />
                            <Typography variant="subtitle2" noWrap>
                              {highlight.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {formatDuration(highlight.duration)} • {highlight.quality}
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Chip
                              label={highlight.status}
                              color={getStatusColor(highlight.status) as any}
                              size="small"
                            />
                            <Box>
                              <IconButton
                                size="small"
                                onClick={() => handleShareHighlight(highlight.id, 'twitter')}
                              >
                                <Share fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteHighlight(highlight.id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No highlights available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Generate Highlights Dialog */}
      <Dialog open={showGenerateDialog} onClose={() => setShowGenerateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Advanced Highlights</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Match ID"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="User ID"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Commentary Style</InputLabel>
                <Select
                  value={commentaryStyle}
                  onChange={(e) => setCommentaryStyle(e.target.value as any)}
                  label="Commentary Style"
                >
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="casual">Casual</MenuItem>
                  <MenuItem value="excited">Excited</MenuItem>
                  <MenuItem value="analytical">Analytical</MenuItem>
                  <MenuItem value="dramatic">Dramatic</MenuItem>
                  <MenuItem value="technical">Technical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Quality</InputLabel>
                <Select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as any)}
                  label="Quality"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="ultra">Ultra</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (seconds)"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                margin="normal"
                inputProps={{ min: 10, max: 600 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeAudio}
                    onChange={(e) => setIncludeAudio(e.target.checked)}
                  />
                }
                label="Include Audio"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={includeVideo}
                    onChange={(e) => setIncludeVideo(e.target.checked)}
                  />
                }
                label="Include Video"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateHighlights}
            variant="contained"
            disabled={!selectedMatchId || !selectedUserId || isGenerating}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Advanced Commentary Settings</DialogTitle>
        <DialogContent>
          {config && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enabled}
                      onChange={(e) => handleUpdateConfig({ enabled: e.target.checked })}
                    />
                  }
                  label="Enable Advanced Commentary"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.realTimeCommentary}
                      onChange={(e) => handleUpdateConfig({ realTimeCommentary: e.target.checked })}
                    />
                  }
                  label="Real-time Commentary"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.highlightGeneration}
                      onChange={(e) => handleUpdateConfig({ highlightGeneration: e.target.checked })}
                    />
                  }
                  label="Highlight Generation"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.audioSynthesis}
                      onChange={(e) => handleUpdateConfig({ audioSynthesis: e.target.checked })}
                    />
                  }
                  label="Audio Synthesis"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.videoSynthesis}
                      onChange={(e) => handleUpdateConfig({ videoSynthesis: e.target.checked })}
                    />
                  }
                  label="Video Synthesis"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettingsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Metrics Dialog */}
      <Dialog open={showMetricsDialog} onClose={() => setShowMetricsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Advanced Commentary Metrics</DialogTitle>
        <DialogContent>
          {metrics && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">Total Events</Typography>
                    <Typography variant="h4">{metrics.totalEvents}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">Total Highlights</Typography>
                    <Typography variant="h4">{metrics.totalHighlights}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">Average Generation Time</Typography>
                    <Typography variant="h4">{metrics.averageGenerationTime}s</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">Share Rate</Typography>
                    <Typography variant="h4">{metrics.shareRate}%</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Popular Styles</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {metrics.popularStyles.map((style, index) => (
                    <Chip key={index} label={style} variant="outlined" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Top Reactions</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {metrics.topReactions.map((reaction, index) => (
                    <Chip key={index} label={reaction} variant="outlined" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMetricsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle="Generate Highlights"
          onClick={() => setShowGenerateDialog(true)}
        />
        <SpeedDialAction
          icon={<Analytics />}
          tooltipTitle="View Metrics"
          onClick={() => setShowMetricsDialog(true)}
        />
        <SpeedDialAction
          icon={<Settings />}
          tooltipTitle="Settings"
          onClick={() => setShowSettingsDialog(true)}
        />
        <SpeedDialAction
          icon={<Refresh />}
          tooltipTitle="Refresh"
          onClick={() => window.location.reload()}
        />
      </SpeedDial>
    </Box>
  );
};

export default AdvancedAIMatchCommentaryHighlightsDashboard; 