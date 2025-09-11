import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useState } from 'react';

interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  query: string;
  parameters: QueryParameter[];
}

interface QueryParameter {
  name: string;
  type: 'date' | 'select' | 'text' | 'number';
  label: string;
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: 'user_engagement',
    name: 'User Engagement Analysis',
    description: 'Analyze user engagement patterns over time',
    category: 'User Behavior',
    query: `
      SELECT
        DATE_TRUNC('day', created_at) as date,
        COUNT(DISTINCT user_id) as active_users,
        AVG(session_duration) as avg_session_duration,
        COUNT(*) as total_actions
      FROM user_activities
      WHERE created_at BETWEEN $1 AND $2
        AND user_id IN (
          SELECT id FROM users
          WHERE created_at >= $3
          AND status = 'active'
        )
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `,
    parameters: [
      { name: 'start_date', type: 'date', label: 'Start Date', required: true },
      { name: 'end_date', type: 'date', label: 'End Date', required: true },
      {
        name: 'user_since',
        type: 'date',
        label: 'Users Since',
        required: false,
      },
    ],
  },
  {
    id: 'feature_adoption',
    name: 'Feature Adoption Trends',
    description: 'Track how features are adopted over time',
    category: 'Feature Analysis',
    query: `
      SELECT
        feature_name,
        DATE_TRUNC('$1', created_at) as period,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) as total_usage,
        AVG(time_spent) as avg_time_spent
      FROM feature_usage
      WHERE created_at BETWEEN $2 AND $3
        AND feature_name IN ($4)
      GROUP BY feature_name, period
      ORDER BY period DESC, unique_users DESC
    `,
    parameters: [
      {
        name: 'period',
        type: 'select',
        label: 'Time Period',
        required: true,
        options: ['hour', 'day', 'week', 'month'],
      },
      { name: 'start_date', type: 'date', label: 'Start Date', required: true },
      { name: 'end_date', type: 'date', label: 'End Date', required: true },
      {
        name: 'features',
        type: 'text',
        label: 'Feature Names (comma-separated)',
        required: true,
      },
    ],
  },
  {
    id: 'conversion_funnel',
    name: 'Conversion Funnel Analysis',
    description: 'Analyze user journey and conversion rates',
    category: 'Conversion',
    query: `
      WITH funnel_steps AS (
        SELECT
          user_id,
          MIN(CASE WHEN event_type = 'user_registered' THEN created_at END) as registration_date,
          MIN(CASE WHEN event_type = 'onboarding_completed' THEN created_at END) as onboarding_date,
          MIN(CASE WHEN event_type = 'first_game_played' THEN created_at END) as first_game_date,
          MIN(CASE WHEN event_type = 'tournament_joined' THEN created_at END) as tournament_date,
          MAX(created_at) as last_activity
        FROM user_events
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY user_id
      )
      SELECT
        COUNT(*) as total_users,
        COUNT(registration_date) as registered_users,
        COUNT(onboarding_date) as onboarded_users,
        COUNT(first_game_date) as first_game_users,
        COUNT(tournament_date) as tournament_users,
        ROUND(COUNT(onboarding_date)::decimal / NULLIF(COUNT(registration_date), 0) * 100, 2) as onboarding_rate,
        ROUND(COUNT(first_game_date)::decimal / NULLIF(COUNT(onboarding_date), 0) * 100, 2) as first_game_rate,
        ROUND(COUNT(tournament_date)::decimal / NULLIF(COUNT(first_game_date), 0) * 100, 2) as tournament_rate
      FROM funnel_steps
      WHERE registration_date IS NOT NULL
    `,
    parameters: [
      { name: 'start_date', type: 'date', label: 'Start Date', required: true },
      { name: 'end_date', type: 'date', label: 'End Date', required: true },
    ],
  },
  {
    id: 'cohort_analysis',
    name: 'User Cohort Analysis',
    description: 'Analyze user behavior by cohort groups',
    category: 'Cohort Analysis',
    query: `
      WITH user_cohorts AS (
        SELECT
          id as user_id,
          DATE_TRUNC('$1', created_at) as cohort_date,
          created_at as registration_date
        FROM users
        WHERE created_at BETWEEN $2 AND $3
      ),
      cohort_activity AS (
        SELECT
          uc.user_id,
          uc.cohort_date,
          DATE_TRUNC('$1', ua.created_at) as activity_date,
          COUNT(*) as activity_count
        FROM user_cohorts uc
        LEFT JOIN user_activities ua ON uc.user_id = ua.user_id
          AND ua.created_at BETWEEN uc.registration_date AND uc.registration_date + INTERVAL '$4 days'
        GROUP BY uc.user_id, uc.cohort_date, activity_date
      )
      SELECT
        cohort_date,
        activity_date,
        COUNT(DISTINCT user_id) as active_users,
        AVG(activity_count) as avg_activities_per_user,
        COUNT(DISTINCT user_id) * 100.0 / (
          SELECT COUNT(*) FROM user_cohorts WHERE cohort_date = ca.cohort_date
        ) as retention_rate
      FROM cohort_activity ca
      GROUP BY cohort_date, activity_date
      ORDER BY cohort_date DESC, activity_date DESC
    `,
    parameters: [
      {
        name: 'cohort_period',
        type: 'select',
        label: 'Cohort Period',
        required: true,
        options: ['week', 'month'],
      },
      { name: 'start_date', type: 'date', label: 'Start Date', required: true },
      { name: 'end_date', type: 'date', label: 'End Date', required: true },
      {
        name: 'analysis_days',
        type: 'number',
        label: 'Analysis Period (days)',
        required: true,
      },
    ],
  },
  {
    id: 'revenue_analysis',
    name: 'Revenue and Monetization Analysis',
    description: 'Analyze revenue patterns and user spending',
    category: 'Monetization',
    query: `
      SELECT
        DATE_TRUNC('$1', created_at) as period,
        COUNT(DISTINCT user_id) as paying_users,
        COUNT(*) as total_transactions,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_transaction_value,
        SUM(amount) / COUNT(DISTINCT user_id) as arpu,
        COUNT(DISTINCT user_id) * 100.0 / (
          SELECT COUNT(DISTINCT user_id) FROM user_activities
          WHERE created_at BETWEEN $2 AND $3
        ) as conversion_rate
      FROM monetization_events
      WHERE created_at BETWEEN $2 AND $3
        AND event_type = '$4'
      GROUP BY period
      ORDER BY period DESC
    `,
    parameters: [
      {
        name: 'period',
        type: 'select',
        label: 'Time Period',
        required: true,
        options: ['day', 'week', 'month'],
      },
      { name: 'start_date', type: 'date', label: 'Start Date', required: true },
      { name: 'end_date', type: 'date', label: 'End Date', required: true },
      {
        name: 'event_type',
        type: 'select',
        label: 'Revenue Event Type',
        required: true,
        options: ['purchase', 'subscription', 'tournament_fee', 'all'],
      },
    ],
  },
];

const CATEGORIES = [...new Set(QUERY_TEMPLATES.map((t) => t.category))];

export const CustomQueryBuilder: React.FC = () => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] =
    useState<QueryTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedTemplate(null);
    setParameters({});
  };

  const handleTemplateSelect = (template: QueryTemplate) => {
    setSelectedTemplate(template);
    // Initialize parameters with default values
    const initialParams: Record<string, any> = {};
    template.parameters.forEach((param) => {
      if (param.defaultValue !== undefined) {
        initialParams[param.name] = param.defaultValue;
      }
    });
    setParameters(initialParams);
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters((prev) => ({ ...prev, [paramName]: value }));
  };

  const executeQuery = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      // This would typically call an API endpoint
      // For now, we'll simulate the query execution
      console.log('Executing query:', selectedTemplate.query);
      console.log('With parameters:', parameters);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock result
      setQueryResult({
        success: true,
        data: [
          { date: '2024-01-15', active_users: 1250, avg_session: 24.5 },
          { date: '2024-01-14', active_users: 1180, avg_session: 22.3 },
          { date: '2024-01-13', active_users: 1320, avg_session: 26.1 },
        ],
        executionTime: '2.3s',
        rowCount: 3,
      });
    } catch (error) {
      setQueryResult({
        success: false,
        error: 'Query execution failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (!queryResult?.data) return;

    const csvContent = [
      Object.keys(queryResult.data[0]).join(','),
      ...queryResult.data.map((row: any) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name.replace(/\s+/g, '_').toLowerCase()}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTemplates = selectedCategory
    ? QUERY_TEMPLATES.filter((t) => t.category === selectedCategory)
    : QUERY_TEMPLATES;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Custom Query Builder
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Build and execute custom analytics queries to gain deep insights into
          user behavior and platform performance.
        </Typography>

        {/* Category Selection */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            1. Select Category
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                label={category}
                clickable
                color={selectedCategory === category ? 'primary' : 'default'}
                onClick={() => handleCategoryChange(category)}
              />
            ))}
          </Box>
          {selectedCategory && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedCategory('')}
            >
              Clear Filter
            </Button>
          )}
        </Paper>

        {/* Template Selection */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            2. Select Query Template
          </Typography>
          <Grid container spacing={2}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border:
                      selectedTemplate?.id === template.id
                        ? `2px solid ${theme.palette.primary.main}`
                        : '1px solid #e0e0e0',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {template.description}
                    </Typography>
                    <Chip
                      label={template.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Parameter Configuration */}
        {selectedTemplate && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              3. Configure Parameters
            </Typography>
            <Grid container spacing={2}>
              {selectedTemplate.parameters.map((param) => (
                <Grid item xs={12} md={6} key={param.name}>
                  {param.type === 'date' && (
                    <DatePicker
                      label={param.label}
                      value={parameters[param.name] || null}
                      onChange={(date) =>
                        handleParameterChange(param.name, date)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: param.required,
                        },
                      }}
                    />
                  )}
                  {param.type === 'select' && (
                    <FormControl fullWidth required={param.required}>
                      <InputLabel>{param.label}</InputLabel>
                      <Select
                        value={parameters[param.name] || ''}
                        onChange={(e) =>
                          handleParameterChange(param.name, e.target.value)
                        }
                        label={param.label}
                      >
                        {param.options?.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  {param.type === 'text' && (
                    <TextField
                      fullWidth
                      label={param.label}
                      value={parameters[param.name] || ''}
                      onChange={(e) =>
                        handleParameterChange(param.name, e.target.value)
                      }
                      required={param.required}
                      multiline={param.name.includes('features')}
                      rows={param.name.includes('features') ? 3 : 1}
                    />
                  )}
                  {param.type === 'number' && (
                    <TextField
                      fullWidth
                      type="number"
                      label={param.label}
                      value={parameters[param.name] || ''}
                      onChange={(e) =>
                        handleParameterChange(param.name, e.target.value)
                      }
                      required={param.required}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Execute Query */}
        {selectedTemplate && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              4. Execute Query
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={executeQuery}
                disabled={loading}
                sx={{ minWidth: 150 }}
              >
                {loading ? 'Executing...' : 'Execute Query'}
              </Button>
              {queryResult?.success && (
                <Button
                  variant="outlined"
                  onClick={exportResults}
                  sx={{ minWidth: 120 }}
                >
                  Export CSV
                </Button>
              )}
            </Box>

            {queryResult && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Query executed in {queryResult.executionTime || 'N/A'} •{' '}
                  {queryResult.rowCount || 0} rows returned
                </Typography>

                {queryResult.success ? (
                  <Box
                    sx={{
                      backgroundColor: theme.palette.grey[50],
                      p: 2,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      maxHeight: 300,
                      overflow: 'auto',
                    }}
                  >
                    <pre>{JSON.stringify(queryResult.data, null, 2)}</pre>
                  </Box>
                ) : (
                  <Typography color="error">
                    Error: {queryResult.error}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
};
