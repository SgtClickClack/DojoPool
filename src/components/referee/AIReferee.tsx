import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Chip, Button, Grid, Divider } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import RuleIcon from '@mui/icons-material/Rule';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import AIRefereeService, {
  RefereeDecision,
  RuleViolation,
  MatchAnalysis,
  RefereeConfig
} from '../../services/referee/AIRefereeService';

const tabLabels = [
  { label: 'Decisions', icon: <GavelIcon /> },
  { label: 'Rules', icon: <RuleIcon /> },
  { label: 'Analysis', icon: <AnalyticsIcon /> },
  { label: 'Config', icon: <SettingsIcon /> },
];

const cyberpunkPaper = {
  background: 'rgba(20, 20, 40, 0.95)',
  border: '1.5px solid #00fff7',
  boxShadow: '0 0 24px #00fff7, 0 0 8px #ff00ea',
  borderRadius: 10,
  color: '#fff',
  margin: '1.5rem 0',
  padding: '1.5rem',
};

const AIReferee: React.FC = () => {
  const service = AIRefereeService.getInstance();
  const [tab, setTab] = useState(0);
  const [decisions, setDecisions] = useState<RefereeDecision[]>([]);
  const [violations, setViolations] = useState<RuleViolation[]>([]);
  const [analyses, setAnalyses] = useState<MatchAnalysis[]>([]);
  const [config, setConfig] = useState<RefereeConfig | null>(null);

  useEffect(() => {
    setDecisions(service.getDecisions());
    setViolations(service.getViolations());
    setAnalyses(service.getAnalyses());
    setConfig(service.getConfig());
  }, []);

  return (
    <Box sx={{ width: '100%', minHeight: '80vh', mt: 2 }}>
      <Paper sx={cyberpunkPaper}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#00fff7', mb: 2, letterSpacing: 2 }}>
          AI Referee & Decision Support System
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
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
          {tabLabels.map((t, i) => (
            <Tab key={t.label} icon={t.icon} label={t.label} />
          ))}
        </Tabs>
        <Divider sx={{ mb: 2, borderColor: '#00fff7' }} />
        {tab === 0 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#ff00ea', mb: 1 }}>Referee Decisions</Typography>
            <Grid container spacing={2}>
              {decisions.map(decision => (
                <Grid item xs={12} md={6} key={decision.id}>
                  <Paper sx={{ ...cyberpunkPaper, p: 2, mb: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1" sx={{ color: '#00fff7', fontWeight: 600 }}>{decision.type}</Typography>
                      <Chip label={decision.severity} color={decision.severity === 'critical' ? 'error' : 'warning'} sx={{ ml: 1, fontWeight: 700 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>{decision.description}</Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>Rule: {decision.rule}</Typography>
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      <Chip label={`Player: ${decision.player}`} size="small" sx={{ bgcolor: '#ff00ea', color: '#fff' }} />
                      <Chip label={`Match: ${decision.match}`} size="small" sx={{ bgcolor: '#00fff7', color: '#222' }} />
                      <Chip label={`Confidence: ${decision.confidence}%`} size="small" sx={{ bgcolor: '#222', color: '#00fff7' }} />
                    </Box>
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      <Chip label={decision.reviewed ? 'Reviewed' : 'Pending'} size="small" sx={{ bgcolor: decision.reviewed ? '#00fff7' : '#ff00ea', color: decision.reviewed ? '#222' : '#fff' }} />
                      {decision.overturned && <Chip label="Overturned" size="small" sx={{ bgcolor: '#ff00ea', color: '#fff' }} />}
                    </Box>
                    {decision.explanation && (
                      <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>Explanation: {decision.explanation}</Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {tab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#ff00ea', mb: 1 }}>Rule Violations</Typography>
            <Grid container spacing={2}>
              {violations.map(violation => (
                <Grid item xs={12} md={6} key={violation.id}>
                  <Paper sx={{ ...cyberpunkPaper, p: 2, mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ color: '#ff00ea', fontWeight: 600 }}>{violation.rule}</Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>{violation.description}</Typography>
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      <Chip label={`Penalty: ${violation.penalty}`} size="small" sx={{ bgcolor: '#ff00ea', color: '#fff' }} />
                      <Chip label={`Points: ${violation.points}`} size="small" sx={{ bgcolor: '#00fff7', color: '#222' }} />
                      <Chip label={violation.category} size="small" sx={{ bgcolor: '#222', color: '#00fff7' }} />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {tab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#ff00ea', mb: 1 }}>Match Analysis</Typography>
            <Grid container spacing={2}>
              {analyses.map(analysis => (
                <Grid item xs={12} md={6} key={analysis.id}>
                  <Paper sx={{ ...cyberpunkPaper, p: 2, mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ color: '#00fff7', fontWeight: 600 }}>Match {analysis.match}</Typography>
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      <Chip label={`Fouls: ${analysis.foulCount}`} sx={{ bgcolor: '#ff00ea', color: '#fff' }} />
                      <Chip label={`Warnings: ${analysis.warnings}`} sx={{ bgcolor: '#00fff7', color: '#222' }} />
                      <Chip label={`Penalties: ${analysis.penalties}`} sx={{ bgcolor: '#222', color: '#00fff7' }} />
                      <Chip label={`Accuracy: ${analysis.accuracy}%`} sx={{ bgcolor: '#222', color: '#ff00ea' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>Start: {analysis.startTime.toLocaleDateString()}</Typography>
                    {analysis.endTime && (
                      <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>End: {analysis.endTime.toLocaleDateString()}</Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {tab === 3 && config && (
          <Box>
            <Typography variant="h6" sx={{ color: '#ff00ea', mb: 1 }}>AI Referee Configuration</Typography>
            <Paper sx={{ ...cyberpunkPaper, p: 2, mb: 1 }}>
              <Typography variant="subtitle1" sx={{ color: '#00fff7', fontWeight: 600 }}>Settings</Typography>
              <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                <Chip label={`Sensitivity: ${config.sensitivity}`} sx={{ bgcolor: '#ff00ea', color: '#fff' }} />
                <Chip label={`Auto Review: ${config.autoReview ? 'Enabled' : 'Disabled'}`} sx={{ bgcolor: '#00fff7', color: '#222' }} />
                <Chip label={`Confidence Threshold: ${config.confidenceThreshold}`} sx={{ bgcolor: '#222', color: '#00fff7' }} />
                <Chip label={`Enabled: ${config.enabled ? 'Yes' : 'No'}`} sx={{ bgcolor: '#222', color: '#ff00ea' }} />
              </Box>
              <Box mt={2}>
                <Typography variant="subtitle1" sx={{ color: '#00fff7', fontWeight: 600 }}>Rules</Typography>
                <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                  {config.rules.map(rule => (
                    <Chip key={rule} label={rule} sx={{ bgcolor: '#ff00ea', color: '#fff' }} />
                  ))}
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AIReferee; 