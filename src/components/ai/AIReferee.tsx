import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Collapse,
  useTheme,
  alpha,
  Fade,
  Zoom,
  LinearProgress,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Gavel,
  Rule,
  Warning,
  CheckCircle,
  Cancel,
  Info,
  ExpandMore,
  ExpandLess,
  PlayArrow,
  Pause,
  VideoLibrary,
  Settings,
  ReportProblem,
  ThumbUp,
  ThumbDown,
  Visibility,
  Flag,
  SportsCricket,
  Timeline,
} from '@mui/icons-material';
import { useGameState } from '../gameflow/GameStateManager';

interface AIRefereeProps {
  gameId: string;
  enableAutoDecisions?: boolean;
  showExplanations?: boolean;
  onDecision?: (decision: RefDecision) => void;
}

interface RefDecision {
  id: string;
  type: 'foul' | 'no-foul' | 'warning' | 'info';
  category: string;
  description: string;
  explanation?: string;
  confidence: number;
  timestamp: Date;
  affectedPlayer?: string;
  severity: 'low' | 'medium' | 'high';
  videoTimestamp?: number;
  appealable: boolean;
  autoApplied: boolean;
}

interface RuleViolation {
  rule: string;
  description: string;
  evidence: string[];
  severity: 'warning' | 'foul' | 'serious-foul';
}

export const AIReferee: React.FC<AIRefereeProps> = ({
  gameId,
  enableAutoDecisions = true,
  showExplanations = true,
  onDecision,
}) => {
  const theme = useTheme();
  const { gameState, reportFoul } = useGameState();
  const [decisions, setDecisions] = useState<RefDecision[]>([]);
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [appealDialog, setAppealDialog] = useState<RefDecision | null>(null);
  const [settings, setSettings] = useState({
    autoDecisions: enableAutoDecisions,
    showExplanations,
    strictMode: false,
    instantReplay: true,
  });
  const [replayMode, setReplayMode] = useState(false);
  const [confidence, setConfidence] = useState(0);

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

  // Simulate AI analysis of game state
  useEffect(() => {
    if (!gameState) return;

    const analyzeInterval = setInterval(() => {
      if (gameState.status === 'in-progress') {
        analyzeGameState();
      }
    }, 2000); // Analyze every 2 seconds

    return () => clearInterval(analyzeInterval);
  }, [gameState]);

  const analyzeGameState = useCallback(async () => {
    if (!gameState || gameState.shots.length === 0) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get the last shot
    const lastShot = gameState.shots[gameState.shots.length - 1];
    
    // Simulate AI analysis
    const analysisResult = analyzeShot(lastShot);
    
    if (analysisResult) {
      const decision: RefDecision = {
        id: `ref_${Date.now()}`,
        type: analysisResult.type,
        category: analysisResult.category,
        description: analysisResult.description,
        explanation: generateExplanation(analysisResult),
        confidence: analysisResult.confidence,
        timestamp: new Date(),
        affectedPlayer: lastShot.playerId,
        severity: analysisResult.severity,
        videoTimestamp: Date.now() - 5000, // 5 seconds ago
        appealable: analysisResult.confidence < 0.9,
        autoApplied: settings.autoDecisions && analysisResult.confidence > 0.8,
      };
      
      setDecisions(prev => [decision, ...prev].slice(0, 20)); // Keep last 20 decisions
      setConfidence(analysisResult.confidence * 100);
      
      // Auto-apply decision if enabled and confidence is high
      if (decision.autoApplied && decision.type === 'foul') {
        reportFoul(decision.affectedPlayer || '', decision.category);
      }
      
      onDecision?.(decision);
    }
    
    setIsAnalyzing(false);
  }, [gameState, settings.autoDecisions, reportFoul, onDecision]);

  const analyzeShot = (shot: any): any => {
    // Simulate various rule checks
    const checks = [
      checkBallInHand(shot),
      checkDoubleTap(shot),
      checkWrongBall(shot),
      checkPushShot(shot),
      checkJumpShot(shot),
      checkTableLeave(shot),
    ];
    
    // Return the most severe violation found
    return checks.filter(c => c !== null).sort((a, b) => 
      b.confidence - a.confidence
    )[0];
  };

  const checkBallInHand = (shot: any) => {
    // Simulate ball-in-hand violation check
    if (Math.random() > 0.95) {
      return {
        type: 'foul',
        category: 'Ball in Hand Violation',
        description: 'Cue ball was moved illegally',
        confidence: 0.85,
        severity: 'medium',
      };
    }
    return null;
  };

  const checkDoubleTap = (shot: any) => {
    // Simulate double tap check
    if (Math.random() > 0.98) {
      return {
        type: 'foul',
        category: 'Double Tap',
        description: 'Cue stick contacted the cue ball twice',
        confidence: 0.92,
        severity: 'medium',
      };
    }
    return null;
  };

  const checkWrongBall = (shot: any) => {
    // Simulate wrong ball first contact
    if (Math.random() > 0.97) {
      return {
        type: 'foul',
        category: 'Wrong Ball First',
        description: 'Cue ball did not contact the correct ball first',
        confidence: 0.88,
        severity: 'medium',
      };
    }
    return null;
  };

  const checkPushShot = (shot: any) => {
    // Simulate push shot detection
    if (Math.random() > 0.99) {
      return {
        type: 'foul',
        category: 'Push Shot',
        description: 'Cue stick maintained contact for too long',
        confidence: 0.75,
        severity: 'low',
      };
    }
    return null;
  };

  const checkJumpShot = (shot: any) => {
    // Check for legal jump shots
    if (Math.random() > 0.985) {
      return {
        type: 'info',
        category: 'Legal Jump Shot',
        description: 'Jump shot executed within rules',
        confidence: 0.90,
        severity: 'low',
      };
    }
    return null;
  };

  const checkTableLeave = (shot: any) => {
    // Check if balls left the table
    if (Math.random() > 0.99) {
      return {
        type: 'foul',
        category: 'Ball Off Table',
        description: 'Object ball left the playing surface',
        confidence: 0.95,
        severity: 'high',
      };
    }
    return null;
  };

  const generateExplanation = (analysis: any): string => {
    const explanations = {
      'Ball in Hand Violation': 'The cue ball was moved without proper ball-in-hand rights. Sky-T1 AI detected unauthorized movement based on game state and previous foul status.',
      'Double Tap': 'High-speed analysis shows the cue tip contacted the cue ball twice during the stroke. Frame-by-frame analysis confirms violation.',
      'Wrong Ball First': 'Ball trajectory analysis indicates the cue ball contacted an opponent\'s ball before hitting a legal target ball.',
      'Push Shot': 'Cue stick contact duration exceeded legal limits. AI measured extended contact through motion analysis.',
      'Legal Jump Shot': 'Shot analysis confirms legal execution with proper cue elevation and contact point.',
      'Ball Off Table': 'Object ball trajectory exceeded table boundaries. Confirmed through 3D position tracking.',
    };
    
    return explanations[analysis.category] || 'AI analysis completed with high confidence.';
  };

  const handleAppeal = (decision: RefDecision) => {
    setAppealDialog(decision);
  };

  const processAppeal = (approved: boolean) => {
    if (appealDialog && approved) {
      // Reverse the decision
      setDecisions(prev => prev.map(d => 
        d.id === appealDialog.id 
          ? { ...d, type: 'no-foul', description: 'Decision overturned on appeal' }
          : d
      ));
    }
    setAppealDialog(null);
  };

  const getDecisionIcon = (type: RefDecision['type']) => {
    switch (type) {
      case 'foul':
        return <Cancel sx={{ color: neonColors.error }} />;
      case 'no-foul':
        return <CheckCircle sx={{ color: neonColors.primary }} />;
      case 'warning':
        return <Warning sx={{ color: neonColors.warning }} />;
      case 'info':
        return <Info sx={{ color: neonColors.info }} />;
    }
  };

  const getSeverityColor = (severity: RefDecision['severity']) => {
    switch (severity) {
      case 'high':
        return neonColors.error;
      case 'medium':
        return neonColors.warning;
      case 'low':
        return neonColors.info;
    }
  };

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
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Gavel sx={{ fontSize: 32 }} />
          Sky-T1 AI Referee
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Instant Replay">
            <IconButton
              onClick={() => setReplayMode(!replayMode)}
              sx={{
                color: replayMode ? neonColors.primary : theme.palette.text.secondary,
                border: `1px solid ${alpha(replayMode ? neonColors.primary : theme.palette.text.secondary, 0.3)}`,
              }}
            >
              <VideoLibrary />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Settings">
            <IconButton
              sx={{
                color: theme.palette.text.secondary,
                border: `1px solid ${alpha(theme.palette.text.secondary, 0.3)}`,
              }}
            >
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* AI Status */}
      <Card
        sx={{
          background: alpha(theme.palette.background.paper, 0.95),
          border: `1px solid ${alpha(neonColors.info, 0.3)}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: isAnalyzing ? neonColors.warning : neonColors.primary,
                  animation: isAnalyzing ? 'pulse 1s infinite' : undefined,
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
              <Typography variant="body1">
                {isAnalyzing ? 'Analyzing shot...' : 'Monitoring game'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Confidence:
              </Typography>
              <Chip
                label={`${confidence.toFixed(0)}%`}
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
          
          {/* Settings toggles */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoDecisions}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoDecisions: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.primary,
                    },
                  }}
                />
              }
              label="Auto Decisions"
              sx={{ color: theme.palette.text.secondary }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.strictMode}
                  onChange={(e) => setSettings(prev => ({ ...prev, strictMode: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: neonColors.warning,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: neonColors.warning,
                    },
                  }}
                />
              }
              label="Strict Mode"
              sx={{ color: theme.palette.text.secondary }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Decision History */}
      <Card
        sx={{
          background: alpha(theme.palette.background.paper, 0.95),
          border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
          borderRadius: 2,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              color: neonColors.primary,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Timeline />
            Decision History
          </Typography>
          
          {decisions.length === 0 ? (
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center', py: 4 }}>
              No decisions yet. AI is monitoring the game...
            </Typography>
          ) : (
            <List>
              {decisions.map((decision, index) => (
                <Fade in key={decision.id} timeout={300 * (index + 1)}>
                  <ListItem
                    sx={{
                      background: alpha(
                        decision.type === 'foul' ? neonColors.error :
                        decision.type === 'warning' ? neonColors.warning :
                        decision.type === 'info' ? neonColors.info :
                        neonColors.primary,
                        0.1
                      ),
                      border: `1px solid ${alpha(
                        decision.type === 'foul' ? neonColors.error :
                        decision.type === 'warning' ? neonColors.warning :
                        decision.type === 'info' ? neonColors.info :
                        neonColors.primary,
                        0.3
                      )}`,
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      {getDecisionIcon(decision.type)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {decision.category}
                          </Typography>
                          {decision.autoApplied && (
                            <Chip
                              label="Auto"
                              size="small"
                              sx={{
                                background: alpha(neonColors.info, 0.2),
                                color: neonColors.info,
                                border: `1px solid ${neonColors.info}`,
                                height: 20,
                              }}
                            />
                          )}
                          <Chip
                            label={decision.severity}
                            size="small"
                            sx={{
                              background: alpha(getSeverityColor(decision.severity), 0.2),
                              color: getSeverityColor(decision.severity),
                              border: `1px solid ${getSeverityColor(decision.severity)}`,
                              height: 20,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {decision.description}
                          </Typography>
                          {showExplanations && expandedDecision === decision.id && (
                            <Collapse in={expandedDecision === decision.id}>
                              <Box sx={{ mt: 1, p: 1, background: alpha(theme.palette.background.default, 0.5), borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ color: neonColors.info }}>
                                  AI Explanation:
                                </Typography>
                                <Typography variant="caption" component="div" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                                  {decision.explanation}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  {decision.appealable && (
                                    <Button
                                      size="small"
                                      startIcon={<Flag />}
                                      onClick={() => handleAppeal(decision)}
                                      sx={{
                                        color: neonColors.warning,
                                        borderColor: neonColors.warning,
                                        '&:hover': {
                                          background: alpha(neonColors.warning, 0.1),
                                        },
                                      }}
                                    >
                                      Appeal
                                    </Button>
                                  )}
                                  {decision.videoTimestamp && (
                                    <Button
                                      size="small"
                                      startIcon={<VideoLibrary />}
                                      sx={{
                                        color: neonColors.info,
                                        borderColor: neonColors.info,
                                        '&:hover': {
                                          background: alpha(neonColors.info, 0.1),
                                        },
                                      }}
                                    >
                                      View Replay
                                    </Button>
                                  )}
                                </Box>
                              </Box>
                            </Collapse>
                          )}
                          <Typography variant="caption" component="div" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                            {moment(decision.timestamp).fromNow()} • Confidence: {(decision.confidence * 100).toFixed(0)}%
                          </Typography>
                        </>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => setExpandedDecision(expandedDecision === decision.id ? null : decision.id)}
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        {expandedDecision === decision.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Fade>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Appeal Dialog */}
      <Dialog
        open={appealDialog !== null}
        onClose={() => setAppealDialog(null)}
        PaperProps={{
          sx: {
            background: theme.palette.background.paper,
            border: `2px solid ${alpha(neonColors.warning, 0.5)}`,
            boxShadow: `0 0 30px ${alpha(neonColors.warning, 0.3)}`,
          },
        }}
      >
        <DialogTitle sx={{ color: neonColors.warning }}>
          Appeal Decision
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to appeal this decision?
          </DialogContentText>
          {appealDialog && (
            <Box sx={{ mt: 2, p: 2, background: alpha(neonColors.warning, 0.1), borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ color: neonColors.warning }}>
                {appealDialog.category}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                {appealDialog.description}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 1, display: 'block' }}>
                Confidence: {(appealDialog.confidence * 100).toFixed(0)}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppealDialog(null)} sx={{ color: theme.palette.text.secondary }}>
            Cancel
          </Button>
          <Button
            onClick={() => processAppeal(true)}
            variant="contained"
            sx={{
              background: neonColors.warning,
              color: theme.palette.background.paper,
              '&:hover': {
                background: alpha(neonColors.warning, 0.8),
              },
            }}
          >
            Submit Appeal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Add moment import
import moment from 'moment';

export default AIReferee;