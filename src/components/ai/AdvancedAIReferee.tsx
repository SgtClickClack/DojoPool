import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Paper,
  Grid,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Gavel,
  Analytics,
  Settings,
  Notifications,
  PlayArrow,
  Stop,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  Timeline,
  Assessment,
  Rule,
  Psychology
} from '@mui/icons-material';
import AdvancedAIRefereeService, {
  AIRefereeDecision,
  AIRefereeAnalysis,
  AIRefereeConfig,
  AIRefereeMetrics
} from '../../services/ai/AdvancedAIRefereeService';

const AdvancedAIReferee: React.FC = () => {
  const service = AdvancedAIRefereeService.getInstance();
  const [tabValue, setTabValue] = useState(0);
  const [decisions, setDecisions] = useState<AIRefereeDecision[]>([]);
  const [analyses, setAnalyses] = useState<AIRefereeAnalysis[]>([]);
  const [config, setConfig] = useState<AIRefereeConfig | null>(null);
  const [metrics, setMetrics] = useState<AIRefereeMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<AIRefereeDecision | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIRefereeAnalysis | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [newDecisionDialogOpen, setNewDecisionDialogOpen] = useState(false);
  const [newAnalysisDialogOpen, setNewAnalysisDialogOpen] = useState(false);

  // Form states
  const [newDecision, setNewDecision] = useState({
    matchId: '',
    decisionType: 'foul' as AIRefereeDecision['decisionType'],
    severity: 'medium' as AIRefereeDecision['severity'],
    description: '',
    ruleReference: '',
    confidence: 85,
    evidence: '',
    playerId: '',
    explanation: '',
    appealable: true
  });

  const [newAnalysis, setNewAnalysis] = useState({
    matchId: '',
    analysisType: 'shot_analysis' as AIRefereeAnalysis['analysisType'],
    content: '',
    insights: '',
    recommendations: '',
    confidence: 85,
    context: ''
  });

  useEffect(() => {
    loadData();
    setupEventListeners();

    return () => {
      service.removeAllListeners();
    };
  }, []);

  const loadData = () => {
    setDecisions(service.getDecisions());
    setAnalyses(service.getAnalyses());
    setConfig(service.getConfig());
    setMetrics(service.getMetrics());
    setIsConnected(service.getConnectionStatus());
  };

  const setupEventListeners = () => {
    service.on('decisionMade', (decision: AIRefereeDecision) => {
      setDecisions(service.getDecisions());
      setMetrics(service.getMetrics());
    });

    service.on('decisionUpdated', () => {
      setDecisions(service.getDecisions());
      setMetrics(service.getMetrics());
    });

    service.on('analysisGenerated', (analysis: AIRefereeAnalysis) => {
      setAnalyses(service.getAnalyses());
    });

    service.on('configUpdated', (newConfig: AIRefereeConfig) => {
      setConfig(newConfig);
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMakeDecision = async () => {
    try {
      await service.makeDecision({
        ...newDecision,
        evidence: newDecision.evidence.split(',').map(e => e.trim()).filter(e => e)
      });
      setNewDecisionDialogOpen(false);
      setNewDecision({
        matchId: '',
        decisionType: 'foul',
        severity: 'medium',
        description: '',
        ruleReference: '',
        confidence: 85,
        evidence: '',
        playerId: '',
        explanation: '',
        appealable: true
      });
    } catch (error) {
      console.error('Error making decision:', error);
    }
  };

  const handleGenerateAnalysis = async () => {
    try {
      await service.generateAnalysis({
        matchId: newAnalysis.matchId,
        analysisType: newAnalysis.analysisType,
        content: newAnalysis.content,
        insights: newAnalysis.insights.split('\n').filter(i => i.trim()),
        recommendations: newAnalysis.recommendations.split('\n').filter(r => r.trim()),
        confidence: newAnalysis.confidence,
        context: JSON.parse(newAnalysis.context || '{}')
      });
      setNewAnalysisDialogOpen(false);
      setNewAnalysis({
        matchId: '',
        analysisType: 'shot_analysis',
        content: '',
        insights: '',
        recommendations: '',
        confidence: 85,
        context: ''
      });
    } catch (error) {
      console.error('Error generating analysis:', error);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<AIRefereeConfig>) => {
    try {
      await service.updateConfig(newConfig);
      setConfigDialogOpen(false);
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const getSeverityColor = (severity: AIRefereeDecision['severity']) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getDecisionTypeIcon = (type: AIRefereeDecision['decisionType']) => {
    switch (type) {
      case 'foul': return <Warning />;
      case 'warning': return <Info />;
      case 'penalty': return <Error />;
      case 'disqualification': return <Error />;
      case 'rule_clarification': return <Rule />;
      default: return <Info />;
    }
  };

  const getAnalysisTypeIcon = (type: AIRefereeAnalysis['analysisType']) => {
    switch (type) {
      case 'shot_analysis': return <Timeline />;
      case 'rule_interpretation': return <Rule />;
      case 'strategy_recommendation': return <Psychology />;
      case 'performance_assessment': return <Assessment />;
      default: return <Analytics />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <Gavel sx={{ mr: 2, color: '#00ff9d' }} />
          Advanced AI Referee System
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
          />
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setConfigDialogOpen(true)}
          >
            Configuration
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Decisions" icon={<Gavel />} />
          <Tab label="Analyses" icon={<Analytics />} />
          <Tab label="Metrics" icon={<Assessment />} />
          <Tab label="Real-time" icon={<Timeline />} />
        </Tabs>
      </Paper>

      {/* Decisions Tab */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">AI Referee Decisions</Typography>
            <Button
              variant="contained"
              startIcon={<Gavel />}
              onClick={() => setNewDecisionDialogOpen(true)}
            >
              Make Decision
            </Button>
          </Box>

          <Grid container spacing={2}>
            {decisions.map((decision) => (
              <Grid item xs={12} md={6} key={decision.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getDecisionTypeIcon(decision.decisionType)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {decision.decisionType.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Box>
                      <Chip
                        label={decision.severity}
                        color={getSeverityColor(decision.severity) as any}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {decision.description}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Rule: {decision.ruleReference}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {decision.explanation}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {decision.confidence}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimestamp(decision.timestamp)}
                      </Typography>
                    </Box>

                    {decision.playerId && (
                      <Typography variant="body2" color="text.secondary">
                        Player: {decision.playerId}
                      </Typography>
                    )}

                    <Box sx={{ mt: 2 }}>
                      {decision.evidence.map((evidence, index) => (
                        <Chip
                          key={index}
                          label={evidence}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedDecision(decision)}
                      >
                        View Details
                      </Button>
                      {decision.appealable && (
                        <Button size="small" variant="outlined" color="warning">
                          Appeal
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Analyses Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">AI Analysis Reports</Typography>
            <Button
              variant="contained"
              startIcon={<Analytics />}
              onClick={() => setNewAnalysisDialogOpen(true)}
            >
              Generate Analysis
            </Button>
          </Box>

          <Grid container spacing={2}>
            {analyses.map((analysis) => (
              <Grid item xs={12} md={6} key={analysis.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getAnalysisTypeIcon(analysis.analysisType)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {analysis.analysisType.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {analysis.content}
                    </Typography>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle2">Insights</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {analysis.insights.map((insight, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={insight} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle2">Recommendations</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {analysis.recommendations.map((recommendation, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={recommendation} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {analysis.confidence}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimestamp(analysis.timestamp)}
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Metrics Tab */}
      {tabValue === 2 && metrics && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>AI Referee Performance Metrics</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Decisions
                  </Typography>
                  <Typography variant="h4">
                    {metrics.totalDecisions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Average Confidence
                  </Typography>
                  <Typography variant="h4">
                    {metrics.averageConfidence.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Accuracy Rate
                  </Typography>
                  <Typography variant="h4">
                    {metrics.analysisAccuracy.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Response Time
                  </Typography>
                  <Typography variant="h4">
                    {metrics.responseTime}ms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Decisions by Type</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(metrics.decisionsByType).map(([type, count]) => (
                      <Grid item xs={6} md={3} key={type}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5">{count}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Real-time Tab */}
      {tabValue === 3 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Real-time AI Referee Monitoring</Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Real-time monitoring is {config?.enableRealTimeAnalysis ? 'enabled' : 'disabled'}. 
            {config?.enableRealTimeAnalysis && ' AI is actively analyzing matches and making decisions.'}
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Live Match Analysis</Typography>
                  <Typography variant="body2" color="text.secondary">
                    No active matches being analyzed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>System Status</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Connection:</Typography>
                      <Chip
                        label={isConnected ? 'Connected' : 'Disconnected'}
                        color={isConnected ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>AI Analysis:</Typography>
                      <Chip
                        label={config?.enableRealTimeAnalysis ? 'Active' : 'Inactive'}
                        color={config?.enableRealTimeAnalysis ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Automated Decisions:</Typography>
                      <Chip
                        label={config?.enablePredictiveDecisions ? 'Enabled' : 'Disabled'}
                        color={config?.enablePredictiveDecisions ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>AI Referee Configuration</DialogTitle>
        <DialogContent>
          {config && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableRealTimeAnalysis}
                        onChange={(e) => setConfig({ ...config, enableRealTimeAnalysis: e.target.checked })}
                      />
                    }
                    label="Real-time Analysis"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enablePredictiveDecisions}
                        onChange={(e) => setConfig({ ...config, enablePredictiveDecisions: e.target.checked })}
                      />
                    }
                    label="Predictive Decisions"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableRuleLearning}
                        onChange={(e) => setConfig({ ...config, enableRuleLearning: e.target.checked })}
                      />
                    }
                    label="Rule Learning"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableAppeals}
                        onChange={(e) => setConfig({ ...config, enableAppeals: e.target.checked })}
                      />
                    }
                    label="Enable Appeals"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.autoEscalation}
                        onChange={(e) => setConfig({ ...config, autoEscalation: e.target.checked })}
                      />
                    }
                    label="Auto Escalation"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confidence Threshold (%)"
                    type="number"
                    value={config.confidenceThreshold}
                    onChange={(e) => setConfig({ ...config, confidenceThreshold: Number(e.target.value) })}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Analysis Depth"
                    type="number"
                    value={config.maxAnalysisDepth}
                    onChange={(e) => setConfig({ ...config, maxAnalysisDepth: Number(e.target.value) })}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Rule Set</InputLabel>
                    <Select
                      value={config.ruleSet}
                      onChange={(e) => setConfig({ ...config, ruleSet: e.target.value as any })}
                    >
                      <MenuItem value="standard">Standard</MenuItem>
                      <MenuItem value="tournament">Tournament</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => config && handleUpdateConfig(config)} variant="contained">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Decision Dialog */}
      <Dialog open={newDecisionDialogOpen} onClose={() => setNewDecisionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Make New Decision</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Match ID"
                value={newDecision.matchId}
                onChange={(e) => setNewDecision({ ...newDecision, matchId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Decision Type</InputLabel>
                <Select
                  value={newDecision.decisionType}
                  onChange={(e) => setNewDecision({ ...newDecision, decisionType: e.target.value as any })}
                >
                  <MenuItem value="foul">Foul</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="penalty">Penalty</MenuItem>
                  <MenuItem value="disqualification">Disqualification</MenuItem>
                  <MenuItem value="rule_clarification">Rule Clarification</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={newDecision.severity}
                  onChange={(e) => setNewDecision({ ...newDecision, severity: e.target.value as any })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confidence (%)"
                type="number"
                value={newDecision.confidence}
                onChange={(e) => setNewDecision({ ...newDecision, confidence: Number(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newDecision.description}
                onChange={(e) => setNewDecision({ ...newDecision, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rule Reference"
                value={newDecision.ruleReference}
                onChange={(e) => setNewDecision({ ...newDecision, ruleReference: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Player ID (optional)"
                value={newDecision.playerId}
                onChange={(e) => setNewDecision({ ...newDecision, playerId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Evidence (comma-separated)"
                value={newDecision.evidence}
                onChange={(e) => setNewDecision({ ...newDecision, evidence: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Explanation"
                multiline
                rows={3}
                value={newDecision.explanation}
                onChange={(e) => setNewDecision({ ...newDecision, explanation: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newDecision.appealable}
                    onChange={(e) => setNewDecision({ ...newDecision, appealable: e.target.checked })}
                  />
                }
                label="Appealable"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewDecisionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMakeDecision} variant="contained">
            Make Decision
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Analysis Dialog */}
      <Dialog open={newAnalysisDialogOpen} onClose={() => setNewAnalysisDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate New Analysis</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Match ID"
                value={newAnalysis.matchId}
                onChange={(e) => setNewAnalysis({ ...newAnalysis, matchId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Analysis Type</InputLabel>
                <Select
                  value={newAnalysis.analysisType}
                  onChange={(e) => setNewAnalysis({ ...newAnalysis, analysisType: e.target.value as any })}
                >
                  <MenuItem value="shot_analysis">Shot Analysis</MenuItem>
                  <MenuItem value="rule_interpretation">Rule Interpretation</MenuItem>
                  <MenuItem value="strategy_recommendation">Strategy Recommendation</MenuItem>
                  <MenuItem value="performance_assessment">Performance Assessment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confidence (%)"
                type="number"
                value={newAnalysis.confidence}
                onChange={(e) => setNewAnalysis({ ...newAnalysis, confidence: Number(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                multiline
                rows={3}
                value={newAnalysis.content}
                onChange={(e) => setNewAnalysis({ ...newAnalysis, content: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Insights (one per line)"
                multiline
                rows={3}
                value={newAnalysis.insights}
                onChange={(e) => setNewAnalysis({ ...newAnalysis, insights: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recommendations (one per line)"
                multiline
                rows={3}
                value={newAnalysis.recommendations}
                onChange={(e) => setNewAnalysis({ ...newAnalysis, recommendations: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Context (JSON)"
                multiline
                rows={2}
                value={newAnalysis.context}
                onChange={(e) => setNewAnalysis({ ...newAnalysis, context: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewAnalysisDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateAnalysis} variant="contained">
            Generate Analysis
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decision Details Dialog */}
      <Dialog open={!!selectedDecision} onClose={() => setSelectedDecision(null)} maxWidth="md" fullWidth>
        <DialogTitle>Decision Details</DialogTitle>
        <DialogContent>
          {selectedDecision && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{selectedDecision.description}</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedDecision.explanation}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Rule: {selectedDecision.ruleReference}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Confidence: {selectedDecision.confidence}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Timestamp: {formatTimestamp(selectedDecision.timestamp)}
              </Typography>
              {selectedDecision.playerId && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Player: {selectedDecision.playerId}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Appealable: {selectedDecision.appealable ? 'Yes' : 'No'}
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 1 }}>Evidence:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedDecision.evidence.map((evidence, index) => (
                  <Chip key={index} label={evidence} />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDecision(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Analysis Details Dialog */}
      <Dialog open={!!selectedAnalysis} onClose={() => setSelectedAnalysis(null)} maxWidth="md" fullWidth>
        <DialogTitle>Analysis Details</DialogTitle>
        <DialogContent>
          {selectedAnalysis && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{selectedAnalysis.content}</Typography>
              
              <Typography variant="h6" sx={{ mb: 1 }}>Insights:</Typography>
              <List dense>
                {selectedAnalysis.insights.map((insight, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={insight} />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="h6" sx={{ mb: 1 }}>Recommendations:</Typography>
              <List dense>
                {selectedAnalysis.recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Confidence: {selectedAnalysis.confidence}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Timestamp: {formatTimestamp(selectedAnalysis.timestamp)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAnalysis(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedAIReferee; 