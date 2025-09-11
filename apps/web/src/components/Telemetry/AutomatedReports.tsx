import { Add, Download, PlayArrow, Schedule } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useEffect, useState } from 'react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  schedule?: ReportSchedule;
  lastRun?: Date;
  status: 'active' | 'inactive' | 'running';
  recipients: string[];
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
}

interface ReportResult {
  id: string;
  templateId: string;
  executedAt: Date;
  status: 'success' | 'failed' | 'running';
  duration: number; // seconds
  rowCount: number;
  fileUrl?: string;
  errorMessage?: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'daily_user_activity',
    name: 'Daily User Activity Report',
    description:
      'Comprehensive overview of daily user engagement and platform usage',
    category: 'User Analytics',
    status: 'active',
    recipients: ['analytics@dojopool.com'],
  },
  {
    id: 'weekly_feature_adoption',
    name: 'Weekly Feature Adoption Report',
    description: 'Track how new features are being adopted by users over time',
    category: 'Feature Analytics',
    status: 'active',
    recipients: ['product@dojopool.com'],
  },
  {
    id: 'monthly_conversion_funnel',
    name: 'Monthly Conversion Funnel Report',
    description: 'Monthly analysis of user journey and conversion optimization',
    category: 'Conversion Analytics',
    status: 'active',
    recipients: ['growth@dojopool.com'],
  },
  {
    id: 'weekly_revenue_summary',
    name: 'Weekly Revenue Summary',
    description: 'Financial performance and monetization metrics',
    category: 'Business Intelligence',
    status: 'inactive',
    recipients: ['finance@dojopool.com'],
  },
  {
    id: 'technical_performance',
    name: 'Technical Performance Report',
    description: 'System performance, errors, and technical health metrics',
    category: 'Technical',
    status: 'active',
    recipients: ['engineering@dojopool.com'],
  },
];

const CATEGORIES = [...new Set(REPORT_TEMPLATES.map((t) => t.category))];

export const AutomatedReports: React.FC = () => {
  const theme = useTheme();
  const [reports, setReports] = useState<ReportTemplate[]>(REPORT_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [reportHistory, setReportHistory] = useState<ReportResult[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(
    null
  );
  const [scheduleForm, setScheduleForm] = useState<ReportSchedule>({
    frequency: 'daily',
    time: '09:00',
    timezone: 'UTC',
  });

  useEffect(() => {
    // Simulate loading report history
    const mockHistory: ReportResult[] = [
      {
        id: '1',
        templateId: 'daily_user_activity',
        executedAt: new Date(Date.now() - 86400000),
        status: 'success',
        duration: 45,
        rowCount: 1250,
        fileUrl: '/reports/daily_user_activity_2024-01-15.csv',
      },
      {
        id: '2',
        templateId: 'weekly_feature_adoption',
        executedAt: new Date(Date.now() - 604800000),
        status: 'success',
        duration: 120,
        rowCount: 3200,
        fileUrl: '/reports/weekly_feature_adoption_2024-01-08.csv',
      },
    ];
    setReportHistory(mockHistory);
  }, []);

  const handleScheduleDialogOpen = (report: ReportTemplate) => {
    setSelectedReport(report);
    setScheduleForm(
      report.schedule || {
        frequency: 'daily',
        time: '09:00',
        timezone: 'UTC',
      }
    );
    setScheduleDialogOpen(true);
  };

  const handleScheduleDialogClose = () => {
    setScheduleDialogOpen(false);
    setSelectedReport(null);
  };

  const handleScheduleSave = () => {
    if (!selectedReport) return;

    const updatedReports = reports.map((report) =>
      report.id === selectedReport.id
        ? { ...report, schedule: scheduleForm, status: 'active' as const }
        : report
    );
    setReports(updatedReports);
    handleScheduleDialogClose();
  };

  const handleRunReport = async (reportId: string) => {
    const updatedReports = reports.map((report) =>
      report.id === reportId
        ? { ...report, status: 'running' as const }
        : report
    );
    setReports(updatedReports);

    // Simulate report execution
    setTimeout(() => {
      const newResult: ReportResult = {
        id: Date.now().toString(),
        templateId: reportId,
        executedAt: new Date(),
        status: 'success',
        duration: Math.floor(Math.random() * 120) + 30,
        rowCount: Math.floor(Math.random() * 5000) + 1000,
        fileUrl: `/reports/${reportId}_${new Date().toISOString().split('T')[0]}.csv`,
      };

      setReportHistory((prev) => [newResult, ...prev]);

      const finalReports = reports.map((report) =>
        report.id === reportId
          ? { ...report, status: 'active' as const, lastRun: new Date() }
          : report
      );
      setReports(finalReports);
    }, 3000);
  };

  const handleToggleReport = (reportId: string) => {
    const updatedReports = reports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            status: report.status === 'active' ? 'inactive' : 'active',
          }
        : report
    );
    setReports(updatedReports);
  };

  const filteredReports = selectedCategory
    ? reports.filter((r) => r.category === selectedCategory)
    : reports;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'running':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <PlayArrow sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <div>
            <Typography variant="h4" gutterBottom>
              Automated Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Schedule and manage automated analytics reports for continuous
              insights.
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ minWidth: 150 }}
          >
            Create Custom Report
          </Button>
        </Box>

        {/* Category Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter by Category
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                label={category}
                clickable
                color={selectedCategory === category ? 'primary' : 'default'}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category ? '' : category
                  )
                }
              />
            ))}
          </Box>
        </Paper>

        {/* Reports Table */}
        <Paper sx={{ mb: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Last Run</TableCell>
                  <TableCell>Recipients</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {report.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        size="small"
                        color={getStatusColor(report.status)}
                        icon={getStatusIcon(report.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {report.schedule ? (
                        <Box>
                          <Typography variant="body2">
                            {report.schedule.frequency} at{' '}
                            {report.schedule.time}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.schedule.timezone}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not scheduled
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {report.lastRun ? (
                        <Typography variant="body2">
                          {report.lastRun.toLocaleDateString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Never
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {report.recipients
                          .slice(0, 2)
                          .map((recipient, index) => (
                            <Chip
                              key={index}
                              label={recipient.split('@')[0]}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        {report.recipients.length > 2 && (
                          <Chip
                            label={`+${report.recipients.length - 2}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={report.status === 'active'}
                              onChange={() => handleToggleReport(report.id)}
                              size="small"
                            />
                          }
                          label=""
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleScheduleDialogOpen(report)}
                          color="primary"
                        >
                          <Schedule />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRunReport(report.id)}
                          color="success"
                          disabled={report.status === 'running'}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Report History */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Report Execution History
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Report</TableCell>
                  <TableCell>Executed</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Rows</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportHistory.map((result) => {
                  const report = reports.find(
                    (r) => r.id === result.templateId
                  );
                  return (
                    <TableRow key={result.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {report?.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {result.executedAt.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={result.status}
                          size="small"
                          color={
                            result.status === 'success' ? 'success' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {result.duration}s
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {result.rowCount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {result.fileUrl && (
                          <IconButton
                            size="small"
                            href={result.fileUrl}
                            color="primary"
                          >
                            <Download />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Schedule Dialog */}
        <Dialog
          open={scheduleDialogOpen}
          onClose={handleScheduleDialogClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Schedule Report: {selectedReport?.name}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={scheduleForm.frequency}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        frequency: e.target
                          .value as ReportSchedule['frequency'],
                      }))
                    }
                    label="Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Time (HH:MM)"
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      time: e.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {scheduleForm.frequency === 'weekly' && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Day of Week</InputLabel>
                    <Select
                      value={scheduleForm.dayOfWeek || 1}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          dayOfWeek: parseInt(e.target.value as string),
                        }))
                      }
                      label="Day of Week"
                    >
                      <MenuItem value={0}>Sunday</MenuItem>
                      <MenuItem value={1}>Monday</MenuItem>
                      <MenuItem value={2}>Tuesday</MenuItem>
                      <MenuItem value={3}>Wednesday</MenuItem>
                      <MenuItem value={4}>Thursday</MenuItem>
                      <MenuItem value={5}>Friday</MenuItem>
                      <MenuItem value={6}>Saturday</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {scheduleForm.frequency === 'monthly' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Day of Month"
                    type="number"
                    inputProps={{ min: 1, max: 31 }}
                    value={scheduleForm.dayOfMonth || 1}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        dayOfMonth: parseInt(e.target.value),
                      }))
                    }
                  />
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Timezone"
                  value={scheduleForm.timezone}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                  placeholder="UTC"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleScheduleDialogClose}>Cancel</Button>
            <Button onClick={handleScheduleSave} variant="contained">
              Save Schedule
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};
