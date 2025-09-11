import {
  ExpandLess,
  ExpandMore,
  Lightbulb,
  Refresh,
  TrendingUp,
  Warning,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Grid,
  LinearProgress,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  data: any;
  recommendations: string[];
  relatedMetrics: string[];
  timestamp: Date;
}

interface Recommendation {
  id: string;
  category: 'product' | 'technical' | 'business' | 'user-experience';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  expectedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
  successMetrics: string[];
  relatedInsights: string[];
}

const SAMPLE_INSIGHTS: Insight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Tournament Feature Underutilized',
    description:
      'Tournament participation is 40% below expected levels despite high user interest in competitive gaming',
    impact: 'high',
    confidence: 85,
    data: {
      currentParticipation: 156,
      expectedParticipation: 260,
      userInterest: 78,
    },
    recommendations: [
      'Improve tournament discoverability in the main navigation',
      'Add personalized tournament recommendations',
      'Implement tournament skill-based matchmaking',
      'Create tournament progression rewards',
    ],
    relatedMetrics: [
      'tournament_participation',
      'user_engagement',
      'feature_discovery',
    ],
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    type: 'risk',
    title: 'Mobile User Experience Issues',
    description:
      'Mobile users have 35% higher bounce rate and 50% lower session duration compared to desktop',
    impact: 'critical',
    confidence: 92,
    data: {
      mobileBounceRate: 0.35,
      desktopBounceRate: 0.22,
      mobileSessionDuration: 8.5,
      desktopSessionDuration: 17.2,
    },
    recommendations: [
      'Optimize mobile interface for touch interactions',
      'Improve mobile loading performance',
      'Fix mobile-specific UI/UX issues',
      'Implement mobile-first responsive design',
    ],
    relatedMetrics: ['bounce_rate', 'session_duration', 'device_type'],
    timestamp: new Date(Date.now() - 7200000),
  },
  {
    id: '3',
    type: 'trend',
    title: 'Evening Peak Usage Pattern',
    description:
      'User activity peaks between 7-9 PM with 3x higher engagement during these hours',
    impact: 'medium',
    confidence: 78,
    data: {
      peakHours: '19:00-21:00',
      peakMultiplier: 3.0,
      averageEngagement: 85,
    },
    recommendations: [
      'Schedule maintenance windows outside peak hours',
      'Optimize server capacity for evening load',
      'Launch new features during peak hours for maximum visibility',
      'Implement time-based feature promotions',
    ],
    relatedMetrics: ['hourly_activity', 'user_engagement', 'server_load'],
    timestamp: new Date(Date.now() - 10800000),
  },
  {
    id: '4',
    type: 'anomaly',
    title: 'Venue Check-in Spike',
    description:
      'Unexpected 200% increase in venue check-ins over the last 24 hours',
    impact: 'medium',
    confidence: 65,
    data: {
      currentCheckins: 450,
      previousDayCheckins: 150,
      percentageIncrease: 200,
    },
    recommendations: [
      'Monitor for potential system issues or gaming of the system',
      'Validate check-in data quality and authenticity',
      'Review venue partnership program effectiveness',
      'Consider implementing check-in rate limiting if needed',
    ],
    relatedMetrics: ['venue_checkins', 'user_location', 'system_health'],
    timestamp: new Date(Date.now() - 14400000),
  },
];

const SAMPLE_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec1',
    category: 'product',
    priority: 'high',
    title: 'Implement Tournament Skill Matching',
    description:
      'Add Elo-based matchmaking system for tournaments to improve competitive balance and user satisfaction',
    expectedImpact: '15-20% increase in tournament participation and retention',
    implementationEffort: 'medium',
    successMetrics: [
      'Tournament participation rate',
      'User satisfaction scores',
      'Tournament completion rates',
      'Repeat tournament participation',
    ],
    relatedInsights: ['1', '3'],
  },
  {
    id: 'rec2',
    category: 'user-experience',
    priority: 'urgent',
    title: 'Mobile Performance Optimization',
    description:
      'Comprehensive mobile UX overhaul focusing on performance, navigation, and touch interactions',
    expectedImpact:
      '25-30% reduction in mobile bounce rate, 40% increase in mobile session duration',
    implementationEffort: 'high',
    successMetrics: [
      'Mobile bounce rate',
      'Mobile session duration',
      'Mobile user satisfaction',
      'Mobile feature adoption',
    ],
    relatedInsights: ['2'],
  },
  {
    id: 'rec3',
    category: 'technical',
    priority: 'medium',
    title: 'Implement Smart Caching Strategy',
    description:
      'Add Redis-based caching for frequently accessed data and API responses',
    expectedImpact:
      '30-40% improvement in API response times, reduced server load',
    implementationEffort: 'medium',
    successMetrics: [
      'API response times',
      'Server CPU usage',
      'Cache hit rates',
      'User-perceived performance',
    ],
    relatedInsights: ['2', '3'],
  },
  {
    id: 'rec4',
    category: 'business',
    priority: 'low',
    title: 'Evening Peak Hour Promotions',
    description:
      'Leverage the 7-9 PM usage peak with targeted feature launches and promotions',
    expectedImpact: '10-15% increase in feature adoption during peak hours',
    implementationEffort: 'low',
    successMetrics: [
      'Peak hour engagement',
      'Feature adoption rates',
      'Time-based usage patterns',
      'Promotion effectiveness',
    ],
    relatedInsights: ['3', '4'],
  },
];

export const InsightsEngine: React.FC = () => {
  const theme = useTheme();
  const [insights, setInsights] = useState<Insight[]>(SAMPLE_INSIGHTS);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    SAMPLE_RECOMMENDATIONS
  );
  const [loading, setLoading] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const generateInsights = async () => {
    setLoading(true);
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // In a real implementation, this would analyze actual telemetry data
    // and generate insights using machine learning algorithms

    const newInsights: Insight[] = [
      ...SAMPLE_INSIGHTS,
      {
        id: '5',
        type: 'opportunity',
        title: 'Social Feature Engagement Gap',
        description:
          'Users who join social features have 60% higher retention but only 15% of users discover these features',
        impact: 'high',
        confidence: 88,
        data: {
          socialFeatureUsers: 180,
          totalUsers: 1200,
          retentionMultiplier: 1.6,
          discoveryRate: 0.15,
        },
        recommendations: [
          'Improve social feature discoverability in onboarding',
          'Add social feature prompts for inactive users',
          'Create social feature tutorial campaigns',
          'Implement friend referral incentives',
        ],
        relatedMetrics: [
          'social_engagement',
          'user_retention',
          'feature_discovery',
        ],
        timestamp: new Date(),
      },
    ];

    setInsights(newInsights);
    setLoading(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp sx={{ color: 'success.main' }} />;
      case 'risk':
        return <Warning sx={{ color: 'error.main' }} />;
      case 'trend':
        return <TrendingUp sx={{ color: 'info.main' }} />;
      case 'anomaly':
        return <Warning sx={{ color: 'warning.main' }} />;
      default:
        return <Lightbulb sx={{ color: 'primary.main' }} />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const filteredInsights =
    selectedCategory === 'all'
      ? insights
      : insights.filter((insight) => insight.type === selectedCategory);

  const filteredRecommendations =
    selectedCategory === 'all'
      ? recommendations
      : recommendations.filter((rec) => rec.category === selectedCategory);

  return (
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
            AI-Powered Insights Engine
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Automated analysis of telemetry data to identify patterns,
            opportunities, and recommendations.
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={generateInsights}
          disabled={loading}
          sx={{ minWidth: 150 }}
        >
          {loading ? 'Analyzing...' : 'Generate Insights'}
        </Button>
      </Box>

      {loading && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Analyzing telemetry data with AI algorithms...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Category Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Insights
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['all', 'opportunity', 'risk', 'trend', 'anomaly'].map(
            (category) => (
              <Chip
                key={category}
                label={category === 'all' ? 'All Insights' : category}
                clickable
                color={selectedCategory === category ? 'primary' : 'default'}
                onClick={() => setSelectedCategory(category)}
              />
            )
          )}
        </Box>
      </Paper>

      {/* Insights Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {filteredInsights.map((insight) => (
          <Grid item xs={12} md={6} key={insight.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getInsightIcon(insight.type)}
                  <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                    {insight.title}
                  </Typography>
                  <Chip
                    label={`${insight.confidence}% confidence`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {insight.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={insight.type} size="small" color="primary" />
                  <Chip
                    label={insight.impact}
                    size="small"
                    color={getImpactColor(insight.impact)}
                  />
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {insight.timestamp.toLocaleString()}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    onClick={() =>
                      setExpandedInsight(
                        expandedInsight === insight.id ? null : insight.id
                      )
                    }
                    endIcon={
                      expandedInsight === insight.id ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )
                    }
                  >
                    {expandedInsight === insight.id ? 'Hide' : 'Show'} Details
                  </Button>
                </Box>

                <Collapse in={expandedInsight === insight.id}>
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: theme.palette.grey[50],
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Key Data:
                    </Typography>
                    <Box
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        mb: 2,
                      }}
                    >
                      {Object.entries(insight.data).map(([key, value]) => (
                        <div key={key}>
                          {key}: {JSON.stringify(value)}
                        </div>
                      ))}
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>
                      Recommendations:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      {insight.recommendations.map((rec, index) => (
                        <li key={index}>
                          <Typography variant="body2">{rec}</Typography>
                        </li>
                      ))}
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>
                      Related Metrics:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {insight.relatedMetrics.map((metric) => (
                        <Chip
                          key={metric}
                          label={metric}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recommendations Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          AI-Generated Recommendations
        </Typography>

        <Grid container spacing={2}>
          {filteredRecommendations.map((recommendation) => (
            <Grid item xs={12} key={recommendation.id}>
              <Alert
                severity={
                  recommendation.priority === 'urgent' ? 'error' : 'info'
                }
                sx={{ mb: 2 }}
              >
                <AlertTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={recommendation.category}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={recommendation.priority}
                      size="small"
                      color={getPriorityColor(recommendation.priority)}
                    />
                    <Chip
                      label={recommendation.implementationEffort}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </AlertTitle>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {recommendation.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {recommendation.description}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'medium', mb: 1 }}
                >
                  Expected Impact: {recommendation.expectedImpact}
                </Typography>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    Success Metrics:
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      flexWrap: 'wrap',
                      mt: 0.5,
                    }}
                  >
                    {recommendation.successMetrics.map((metric) => (
                      <Chip
                        key={metric}
                        label={metric}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </Alert>
            </Grid>
          ))}
        </Grid>

        {filteredRecommendations.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', py: 4 }}
          >
            No recommendations available for the selected category.
          </Typography>
        )}
      </Paper>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {insights.filter((i) => i.type === 'opportunity').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Opportunities Identified
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {insights.filter((i) => i.type === 'risk').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Risks Detected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {
                  recommendations.filter(
                    (r) => r.priority === 'high' || r.priority === 'urgent'
                  ).length
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High-Priority Actions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary.main">
                {insights.reduce((sum, i) => sum + i.confidence, 0) /
                  insights.length || 0}
                %
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
