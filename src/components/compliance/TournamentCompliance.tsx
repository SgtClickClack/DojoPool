import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Chip, Button, Tooltip, Divider, Grid, IconButton } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import ReportIcon from '@mui/icons-material/Report';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TournamentComplianceService, {
  ComplianceReport,
  ComplianceViolation,
  RegulatoryFramework,
  ComplianceMetrics,
  ComplianceConfig
} from '../../services/compliance/TournamentComplianceService';

const tabLabels = [
  { label: 'Reports', icon: <ReportIcon /> },
  { label: 'Violations', icon: <GavelIcon /> },
  { label: 'Frameworks', icon: <SecurityIcon /> },
  { label: 'Metrics', icon: <AssessmentIcon /> },
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

const TournamentCompliance: React.FC = () => {
  const service = TournamentComplianceService.getInstance();
  const [tab, setTab] = useState(0);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [frameworks, setFrameworks] = useState<RegulatoryFramework[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [config, setConfig] = useState<ComplianceConfig | null>(null);

  useEffect(() => {
    setReports(service.getReports());
    setViolations(service.getViolations());
    setFrameworks(service.getFrameworks());
    setMetrics(service.getMetrics());
    setConfig(service.getConfig());
    // Optionally, subscribe to WebSocket updates here
  }, []);

  return (
    <Box sx={{ width: '100%', minHeight: '80vh', mt: 2 }}>
      <Paper sx={cyberpunkPaper}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#00fff7', mb: 2, letterSpacing: 2 }}>
          Tournament Compliance & Regulatory Reporting
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
            <Typography variant="h6" sx={{ color: '#ff00ea', mb: 1 }}>Compliance Reports</Typography>
            <Grid container spacing={2}>
              {reports.map(r => (
                <Grid item xs={12} md={6} key={r.id}>
                  <Paper sx={{ ...cyberpunkPaper, p: 2, mb: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1" sx={{ color: '#00fff7', fontWeight: 600 }}>{r.title}</Typography>
                      <Chip label={r.status} color={r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'default'} sx={{ ml: 1, fontWeight: 700 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>{r.description}</Typography>
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      <Chip label={r.type} size="small" sx={{ bgcolor: '#ff00ea', color: '#fff' }} />
                      <Chip label={`Priority: ${r.priority}`} size="small" sx={{ bgcolor: '#00fff7', color: '#222' }} />
                      <Chip label={`Score: ${r.complianceScore}`} size="small" sx={{ bgcolor: '#222', color: '#00fff7' }} />
                    </Box>
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      {r.attachments.map(a => (
                        <Chip key={a} label={a} size="small" sx={{ bgcolor: '#222', color: '#ff00ea' }} />
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {tab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#ff00ea', mb: 1 }}>Violations</Typography>
            <Grid container spacing={2}>
              {violations.map(v => (
                <Grid item xs={12} md={6} key={v.id}>
                  <Paper sx={{ ...cyberpunkPaper, p: 2, mb: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1" sx={{ color: '#ff00ea', fontWeight: 600 }}>{v.description}</Typography>
                      <Chip label={v.status} color={v.status === 'resolved' ? 'success' : 'error'} sx={{ ml: 1, fontWeight: 700 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>{v.regulation} - {v.section}</Typography>
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      <Chip label={v.type} size="small" sx={{ bgcolor: '#ff00ea', color: '#fff' }} />
                      <Chip label={`Severity: ${v.severity}`} size="small" sx={{ bgcolor: '#00fff7', color: '#222' }} />
                      {v.fine && <Chip label={`Fine: $${v.fine}`} size="small" sx={{ bgcolor: '#222', color: '#ff00ea' }} />}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>Impact: {v.impact}</Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>Mitigation: {v.mitigation}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {tab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#ff00ea', mb: 1 }}>Regulatory Frameworks</Typography>
            <Grid container spacing={2}>
              {frameworks.map(f => (
                <Grid item xs={12} md={6} key={f.id}>
                  <Paper sx={{ ...cyberpunkPaper, p: 2, mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ color: '#00fff7', fontWeight: 600 }}>{f.name}</Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>{f.jurisdiction} - v{f.version}</Typography>
                    <Chip label={f.status} size="small" sx={{ bgcolor: '#ff00ea', color: '#fff', mt: 1 }} />
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>Compliance Deadline: {f.complianceDeadline.toLocaleDateString()}</Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>Last Review: {f.lastReview.toLocaleDateString()}</Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>Next Review: {f.nextReview.toLocaleDateString()}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {tab === 3 && metrics && (
          <Box>
            <Typography variant="h6" sx={{ color: '#ff00ea', mb: 1 }}>Compliance Metrics</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ ...cyberpunkPaper, p: 2, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: '#00fff7', fontWeight: 600 }}>Overall Compliance</Typography>
                  <Typography variant="h4" sx={{ color: '#ff00ea', fontWeight: 700 }}>{metrics.overallCompliance}%</Typography>
                  <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                    <Chip label={`Regulatory: ${metrics.regulatoryCompliance}%`} sx={{ bgcolor: '#00fff7', color: '#222' }} />
                    <Chip label={`Operational: ${metrics.operationalCompliance}%`} sx={{ bgcolor: '#ff00ea', color: '#fff' }} />
                    <Chip label={`Security: ${metrics.securityCompliance}%`} sx={{ bgcolor: '#222', color: '#00fff7' }} />
                    <Chip label={`Financial: ${metrics.financialCompliance}%`} sx={{ bgcolor: '#222', color: '#ff00ea' }} />
                  </Box>
                  <Box mt={2}>
                    <Chip label={`Open Violations: ${metrics.openViolations}`} sx={{ bgcolor: '#ff00ea', color: '#fff', mr: 1 }} />
                    <Chip label={`Resolved: ${metrics.resolvedViolations}`} sx={{ bgcolor: '#00fff7', color: '#222' }} />
                  </Box>
                  <Box mt={2}>
                    <Chip label={`Pending Reports: ${metrics.pendingReports}`} sx={{ bgcolor: '#ff00ea', color: '#fff', mr: 1 }} />
                    <Chip label={`Overdue: ${metrics.overdueReports}`} sx={{ bgcolor: '#00fff7', color: '#222' }} />
                  </Box>
                  <Box mt={2}>
                    <Chip label={`Risk: ${metrics.riskLevel}`} sx={{ bgcolor: '#ff00ea', color: '#fff', mr: 1 }} />
                    <Chip label={`Audit: ${metrics.auditStatus}`} sx={{ bgcolor: '#00fff7', color: '#222' }} />
                  </Box>
                  <Box mt={2}>
                    <Typography variant="body2" sx={{ color: '#fff' }}>Next Deadline: {metrics.nextDeadline.toLocaleDateString()}</Typography>
                    <Typography variant="body2" sx={{ color: '#fff' }}>Last Audit: {metrics.lastAudit.toLocaleDateString()}</Typography>
                    <Typography variant="body2" sx={{ color: '#fff' }}>Next Audit: {metrics.nextAudit.toLocaleDateString()}</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
        {tab === 4 && config && (
          <Box>
            <Typography variant="h6" sx={{ color: '#ff00ea', mb: 1 }}>Compliance Configuration</Typography>
            <Paper sx={{ ...cyberpunkPaper, p: 2, mb: 1 }}>
              <Typography variant="subtitle1" sx={{ color: '#00fff7', fontWeight: 600 }}>Auto Reporting: {config.autoReporting ? 'Enabled' : 'Disabled'}</Typography>
              <Typography variant="subtitle1" sx={{ color: '#00fff7', fontWeight: 600 }}>Real-Time Monitoring: {config.realTimeMonitoring ? 'Enabled' : 'Disabled'}</Typography>
              <Typography variant="subtitle1" sx={{ color: '#00fff7', fontWeight: 600 }}>Automated Assessments: {config.automatedAssessments ? 'Enabled' : 'Disabled'}</Typography>
              <Box mt={2}>
                <Typography variant="body2" sx={{ color: '#fff' }}>Frameworks: {config.frameworks.join(', ')}</Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>Jurisdictions: {config.jurisdictions.join(', ')}</Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TournamentCompliance; 