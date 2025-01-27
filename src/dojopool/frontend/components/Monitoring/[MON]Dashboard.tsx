import {
  ErrorOutline as AnomalyIcon,
  AccountTree as CauseEffectIcon,
  FileCopy as CopyIcon,
  Description as CsvIcon,
  DragIndicator as DragIcon,
  Timeline as ForecastIcon,
  Code as JsonIcon,
  TrendingDown as NegativeCorrelationIcon,
  Insights as PatternsIcon,
  PictureAsPdf as PdfIcon,
  TrendingUp as PositiveCorrelationIcon,
  Share as ShareIcon,
  ShowChart as TrendLineIcon,
} from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Alert as MuiAlert,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  Tab,
  Tabs,
} from '@mui/material';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert, ErrorEvent, MetricData } from '../../types/monitoring';
import { ErrorTracker } from '../../utils/errorTracker';
import { gameMetricsMonitor } from '../../utils/monitoring';
import { ErrorBoundary } from './ErrorBoundary';
import { MetricsChart } from './MetricsChart';
import { exportToPDF } from '../../utils/pdfExport';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monitoring-tabpanel-${index}`}
      aria-labelledby={`monitoring-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

interface DashboardProps {
  gameId?: string;
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | 'custom';

const exportToCSV = (data: any[], filename: string) => {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((header) => JSON.stringify(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString()}.csv`;
  link.click();
};

const exportToJSON = (data: any[], filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString()}.json`;
  link.click();
};

// Data aggregation utilities
const aggregateDataPoints = (data: MetricData[], interval: number): MetricData[] => {
  if (!data.length) return [];

  const groups: { [key: string]: MetricData[] } = {};
  const startTime = Math.floor(data[0].timestamp / interval) * interval;

  // Group data points by interval
  data.forEach((point) => {
    const groupKey = Math.floor(point.timestamp / interval) * interval;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(point);
  });

  // Aggregate each group
  return Object.entries(groups).map(([timestamp, points]) => ({
    timestamp: parseInt(timestamp),
    value: points.reduce((sum, point) => sum + point.value, 0) / points.length,
    label: points[0].label,
  }));
};

const getAggregationInterval = (timeRange: { startTime: number; endTime: number }): number => {
  const duration = timeRange.endTime - timeRange.startTime;
  if (duration > 7 * 24 * 60 * 60 * 1000) {
    // > 7 days
    return 24 * 60 * 60 * 1000; // 1 day
  } else if (duration > 24 * 60 * 60 * 1000) {
    // > 1 day
    return 60 * 60 * 1000; // 1 hour
  } else if (duration > 6 * 60 * 60 * 1000) {
    // > 6 hours
    return 15 * 60 * 1000; // 15 minutes
  } else if (duration > 60 * 60 * 1000) {
    // > 1 hour
    return 5 * 60 * 1000; // 5 minutes
  }
  return 60 * 1000; // 1 minute
};

interface RetentionConfig {
  metrics: number;
  alerts: number;
  errors: number;
  autoCleanup: boolean;
}

const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  metrics: 30, // days
  alerts: 90, // days
  errors: 90, // days
  autoCleanup: true,
};

interface MetricConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  chartType: 'line' | 'bar' | 'pie';
  refreshInterval: number;
}

const DEFAULT_METRIC_CONFIG: MetricConfig[] = [
  {
    id: 'updateTimes',
    name: 'Update Times',
    enabled: true,
    order: 0,
    chartType: 'line',
    refreshInterval: 5000,
  },
  {
    id: 'latency',
    name: 'Latency',
    enabled: true,
    order: 1,
    chartType: 'line',
    refreshInterval: 5000,
  },
  {
    id: 'memoryUsage',
    name: 'Memory Usage',
    enabled: true,
    order: 2,
    chartType: 'line',
    refreshInterval: 5000,
  },
  {
    id: 'successRate',
    name: 'Success Rate',
    enabled: true,
    order: 3,
    chartType: 'pie',
    refreshInterval: 5000,
  },
];

interface ThresholdConfig {
  id: string;
  enabled: boolean;
  warning: number;
  critical: number;
  notifyOnBreach: boolean;
}

const DEFAULT_THRESHOLDS: Record<string, ThresholdConfig> = {
  updateTimes: {
    id: 'updateTimes',
    enabled: true,
    warning: 1000, // 1 second
    critical: 5000, // 5 seconds
    notifyOnBreach: true,
  },
  latency: {
    id: 'latency',
    enabled: true,
    warning: 200, // 200ms
    critical: 500, // 500ms
    notifyOnBreach: true,
  },
  memoryUsage: {
    id: 'memoryUsage',
    enabled: true,
    warning: 70, // 70%
    critical: 90, // 90%
    notifyOnBreach: true,
  },
  successRate: {
    id: 'successRate',
    enabled: true,
    warning: 95, // 95%
    critical: 90, // 90%
    notifyOnBreach: true,
  },
};

interface TrendAnalysis {
  trendLine: { timestamp: number; value: number }[];
  forecast: { timestamp: number; value: number; confidence: number }[];
  anomalies: {
    timestamp: number;
    value: number;
    severity: 'warning' | 'critical';
  }[];
}

interface DrillDownData {
  metricId: string;
  startTime: number;
  endTime: number;
  data: MetricData[];
  statistics: {
    min: number;
    max: number;
    avg: number;
    median: number;
    percentile95: number;
    breachCount: number;
  };
  trendAnalysis?: TrendAnalysis;
}

interface UpdateConfig {
  batchSize: number;
  compressionEnabled: boolean;
  dynamicFrequency: boolean;
  minInterval: number;
  maxInterval: number;
}

const DEFAULT_UPDATE_CONFIG: UpdateConfig = {
  batchSize: 50,
  compressionEnabled: true,
  dynamicFrequency: true,
  minInterval: 1000, // 1 second
  maxInterval: 30000, // 30 seconds
};

interface CorrelationData {
  metrics: [string, string];
  coefficient: number;
  scatterData: Array<{ x: number; y: number }>;
  timeRange: { startTime: number; endTime: number };
}

interface ExportData {
  metrics: Record<string, MetricData[]>;
  correlations: CorrelationData[];
  thresholds: Record<string, ThresholdConfig>;
  alerts: Alert[];
  errors: ErrorEvent[];
  timestamp: number;
}

interface PatternInfo {
  type: 'trend' | 'seasonal' | 'spike' | 'anomaly';
  startTime: number;
  endTime: number;
  confidence: number;
  description: string;
}

interface PredictionData {
  timestamp: number;
  value: number;
  confidence: number;
}

interface AnalyticsResult {
  patterns: PatternInfo[];
  seasonality: {
    period: number;
    strength: number;
    peaks: number[];
  };
  predictions: PredictionData[];
}

interface EventSequence {
  events: {
    metricId: string;
    timestamp: number;
    value: number;
    type: 'cause' | 'effect';
  }[];
  confidence: number;
  lagTime: number;
}

interface CauseEffectAnalysis {
  lagCorrelations: {
    metric1: string;
    metric2: string;
    lagTime: number;
    correlation: number;
  }[];
  sequences: EventSequence[];
  rootCauses: {
    metricId: string;
    confidence: number;
    affectedMetrics: string[];
  }[];
}

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  byComponent: Record<string, number>;
  recentErrors: Array<{
    error: Error;
    context: {
      component?: string;
      timestamp: number;
    };
  }>;
}

interface ErrorTrends {
  topErrorTypes: Array<{ type: string; count: number }>;
  topComponents: Array<{ component: string; count: number }>;
  errorRates: Array<{ component: string; rate: number }>;
  recentTrends: Array<{ timestamp: number; errorCount: number }>;
}

export const Dashboard: React.FC<DashboardProps> = ({ gameId }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [retentionConfig, setRetentionConfig] = useState<RetentionConfig>(DEFAULT_RETENTION_CONFIG);
  const [showRetentionDialog, setShowRetentionDialog] = useState(false);
  const [metricConfig, setMetricConfig] = useState<MetricConfig[]>(DEFAULT_METRIC_CONFIG);
  const [showMetricConfig, setShowMetricConfig] = useState(false);
  const [thresholds, setThresholds] = useState<Record<string, ThresholdConfig>>(DEFAULT_THRESHOLDS);
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [thresholdBreaches, setThresholdBreaches] = useState<
    {
      metric: string;
      level: 'warning' | 'critical';
      value: number;
    }[]
  >([]);
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [showTrendLine, setShowTrendLine] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [updateConfig, setUpdateConfig] = useState<UpdateConfig>(DEFAULT_UPDATE_CONFIG);
  const [showUpdateConfig, setShowUpdateConfig] = useState(false);
  const [dataBuffer, setDataBuffer] = useState<Record<string, MetricData[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(updateConfig.minInterval);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [showCorrelation, setShowCorrelation] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<[string, string] | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedMetricAnalytics, setSelectedMetricAnalytics] = useState<string | null>(null);
  const [analyticsResult, setAnalyticsResult] = useState<AnalyticsResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCauseEffect, setShowCauseEffect] = useState(false);
  const [causeEffectAnalysis, setCauseEffectAnalysis] = useState<CauseEffectAnalysis | null>(null);
  const [analyzingCauseEffect, setAnalyzingCauseEffect] = useState(false);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [errorTrends, setErrorTrends] = useState<ErrorTrends | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const errorTracker = ErrorTracker.getInstance();
  const [errorData, setErrorData] = useState<ErrorData[]>([]);

  const getTimeRangeInMs = (): { startTime: number; endTime: number } => {
    const now = Date.now();
    switch (timeRange) {
      case '1h':
        return { startTime: now - 3600000, endTime: now };
      case '6h':
        return { startTime: now - 21600000, endTime: now };
      case '24h':
        return { startTime: now - 86400000, endTime: now };
      case '7d':
        return { startTime: now - 604800000, endTime: now };
      case 'custom':
        return {
          startTime: customStartDate?.getTime() || now - 3600000,
          endTime: customEndDate?.getTime() || now,
        };
      default:
        return { startTime: now - 3600000, endTime: now };
    }
  };

  const aggregatedMetrics = useMemo(() => {
    const timeRange = getTimeRangeInMs();
    const interval = getAggregationInterval(timeRange);
    const metrics = gameMetricsMonitor.getMetrics();

    return {
      updateTimes: aggregateDataPoints(
        metrics.updateTimes.filter(
          (point) => point.timestamp >= timeRange.startTime && point.timestamp <= timeRange.endTime
        ),
        interval
      ),
      latency: aggregateDataPoints(
        metrics.latency.filter(
          (point) => point.timestamp >= timeRange.startTime && point.timestamp <= timeRange.endTime
        ),
        interval
      ),
      memoryUsage: aggregateDataPoints(
        metrics.memoryUsage.filter(
          (point) => point.timestamp >= timeRange.startTime && point.timestamp <= timeRange.endTime
        ),
        interval
      ),
    };
  }, [timeRange, customStartDate, customEndDate]);

  const calculateStatistics = (data: MetricData[]): DrillDownData['statistics'] => {
    if (!data.length) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        median: 0,
        percentile95: 0,
        breachCount: 0,
      };
    }

    const sortedValues = data.map((d) => d.value).sort((a, b) => a - b);
    const sum = sortedValues.reduce((a, b) => a + b, 0);
    const breachCount = data.filter((d) => {
      const threshold = thresholds[drillDownData?.metricId || ''];
      return threshold && (d.value >= threshold.critical || d.value >= threshold.warning);
    }).length;

    return {
      min: sortedValues[0],
      max: sortedValues[sortedValues.length - 1],
      avg: sum / sortedValues.length,
      median: sortedValues[Math.floor(sortedValues.length / 2)],
      percentile95: sortedValues[Math.floor(sortedValues.length * 0.95)],
      breachCount,
    };
  };

  const calculateTrendAnalysis = (data: MetricData[]): TrendAnalysis => {
    if (data.length < 2) {
      return {
        trendLine: [],
        forecast: [],
        anomalies: [],
      };
    }

    // Calculate linear regression for trend line
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.timestamp, 0);
    const sumY = data.reduce((sum, point) => sum + point.value, 0);
    const sumXY = data.reduce((sum, point) => sum + point.timestamp * point.value, 0);
    const sumXX = data.reduce((sum, point) => sum + point.timestamp * point.timestamp, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate trend line points
    const trendLine = data.map((point) => ({
      timestamp: point.timestamp,
      value: slope * point.timestamp + intercept,
    }));

    // Generate forecast points (next 24 hours)
    const lastTimestamp = data[data.length - 1].timestamp;
    const forecast = Array.from({ length: 24 }).map((_, i) => {
      const timestamp = lastTimestamp + i * 60 * 60 * 1000; // hourly points
      const value = slope * timestamp + intercept;
      const confidence = 0.95 - i * 0.01; // confidence decreases over time
      return { timestamp, value, confidence };
    });

    // Detect anomalies using Z-score
    const mean = sumY / n;
    const stdDev = Math.sqrt(
      data.reduce((sum, point) => sum + Math.pow(point.value - mean, 2), 0) / n
    );
    const zScoreThreshold = 2;

    const anomalies = data
      .filter((point) => {
        const zScore = Math.abs((point.value - mean) / stdDev);
        return zScore > zScoreThreshold;
      })
      .map((point) => ({
        timestamp: point.timestamp,
        value: point.value,
        severity: Math.abs((point.value - mean) / stdDev) > 3 ? 'critical' : 'warning',
      }));

    return {
      trendLine,
      forecast,
      anomalies,
    };
  };

  const handleMetricClick = (metricId: string, dataPoint: MetricData) => {
    const timeRange = getTimeRangeInMs();
    const metrics = gameMetricsMonitor.getMetrics();
    let metricData: MetricData[] = [];

    switch (metricId) {
      case 'updateTimes':
        metricData = metrics.updateTimes;
        break;
      case 'latency':
        metricData = metrics.latency;
        break;
      case 'memoryUsage':
        metricData = metrics.memoryUsage;
        break;
      case 'successRate':
        metricData = [{ timestamp: Date.now(), value: metrics.successRate }];
        break;
    }

    // Filter data for the selected time range
    const filteredData = metricData.filter(
      (d) => d.timestamp >= timeRange.startTime && d.timestamp <= timeRange.endTime
    );

    const trendAnalysis = calculateTrendAnalysis(filteredData);

    setDrillDownData({
      metricId,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      data: filteredData,
      statistics: calculateStatistics(filteredData),
      trendAnalysis,
    });
    setShowDrillDown(true);
  };

  // Update MetricsChart to include drill-down capability
  const renderMetricsChart = () => (
    <Grid container spacing={2}>
      {metricConfig
        .filter((m) => m.enabled)
        .sort((a, b) => a.order - b.order)
        .map((metric) => (
          <Grid item xs={12} md={6} key={metric.id}>
            <MetricsChart
              gameId={gameId}
              metricId={metric.id}
              chartType={metric.chartType}
              refreshInterval={metric.refreshInterval}
              timeRange={getTimeRangeInMs()}
              aggregatedData={aggregatedMetrics}
              aggregationInterval={getAggregationInterval(getTimeRangeInMs())}
              onDataPointClick={(dataPoint) => handleMetricClick(metric.id, dataPoint)}
              showTrendLine={showTrendLine}
              showForecast={showForecast}
              showAnomalies={showAnomalies}
              trendAnalysis={drillDownData?.trendAnalysis}
            />
          </Grid>
        ))}
    </Grid>
  );

  useEffect(() => {
    // Subscribe to alerts
    const alertUnsubscribe = gameMetricsMonitor.subscribeToAlerts((alert: Alert) => {
      const { startTime, endTime } = getTimeRangeInMs();
      if (!alert.acknowledged && alert.timestamp >= startTime && alert.timestamp <= endTime) {
        setAlertCount((prev) => prev + 1);
      }
    });

    // Subscribe to errors
    const errorUnsubscribe = gameMetricsMonitor.subscribeToErrors((error: ErrorEvent) => {
      const { startTime, endTime } = getTimeRangeInMs();
      if (error.timestamp >= startTime && error.timestamp <= endTime) {
        setErrorCount((prev) => prev + 1);
      }
    });

    // Get initial counts
    const { startTime, endTime } = getTimeRangeInMs();
    const metrics = gameMetricsMonitor.getMetrics();
    setAlertCount(
      metrics.alerts?.filter(
        (a) => !a.acknowledged && a.timestamp >= startTime && a.timestamp <= endTime
      ).length || 0
    );
    setErrorCount(
      metrics.errors?.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime).length || 0
    );

    return () => {
      alertUnsubscribe();
      errorUnsubscribe();
    };
  }, [timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    // Load saved retention configuration
    const savedConfig = localStorage.getItem('monitoringRetentionConfig');
    if (savedConfig) {
      setRetentionConfig(JSON.parse(savedConfig));
    }
  }, []);

  useEffect(() => {
    // Save retention configuration
    localStorage.setItem('monitoringRetentionConfig', JSON.stringify(retentionConfig));

    // Apply retention policy if auto-cleanup is enabled
    if (retentionConfig.autoCleanup) {
      const now = Date.now();
      const metrics = gameMetricsMonitor.getMetrics();

      // Clean up old metrics
      const metricsRetention = retentionConfig.metrics * 24 * 60 * 60 * 1000;
      const cleanedMetrics = {
        updateTimes: metrics.updateTimes.filter((m) => now - m.timestamp <= metricsRetention),
        latency: metrics.latency.filter((m) => now - m.timestamp <= metricsRetention),
        memoryUsage: metrics.memoryUsage.filter((m) => now - m.timestamp <= metricsRetention),
      };

      // Clean up old alerts
      const alertsRetention = retentionConfig.alerts * 24 * 60 * 60 * 1000;
      const cleanedAlerts =
        metrics.alerts?.filter((a) => now - a.timestamp <= alertsRetention) || [];

      // Clean up old errors
      const errorsRetention = retentionConfig.errors * 24 * 60 * 60 * 1000;
      const cleanedErrors =
        metrics.errors?.filter((e) => now - e.timestamp <= errorsRetention) || [];

      // Update metrics with cleaned data
      gameMetricsMonitor.updateMetrics({
        ...metrics,
        ...cleanedMetrics,
        alerts: cleanedAlerts,
        errors: cleanedErrors,
      });
    }
  }, [retentionConfig]);

  useEffect(() => {
    // Load saved metric configuration
    const savedConfig = localStorage.getItem('monitoringMetricConfig');
    if (savedConfig) {
      setMetricConfig(JSON.parse(savedConfig));
    }
  }, []);

  useEffect(() => {
    // Save metric configuration
    localStorage.setItem('monitoringMetricConfig', JSON.stringify(metricConfig));
  }, [metricConfig]);

  useEffect(() => {
    // Load saved threshold configuration
    const savedThresholds = localStorage.getItem('monitoringThresholds');
    if (savedThresholds) {
      setThresholds(JSON.parse(savedThresholds));
    }
  }, []);

  useEffect(() => {
    // Save threshold configuration
    localStorage.setItem('monitoringThresholds', JSON.stringify(thresholds));
  }, [thresholds]);

  useEffect(() => {
    // Check for threshold breaches
    const metrics = gameMetricsMonitor.getMetrics();
    const newBreaches = [];

    for (const [metricId, config] of Object.entries(thresholds)) {
      if (!config.enabled) continue;

      let currentValue: number;
      switch (metricId) {
        case 'updateTimes':
          currentValue = metrics.updateTimes[metrics.updateTimes.length - 1]?.value || 0;
          break;
        case 'latency':
          currentValue = metrics.latency[metrics.latency.length - 1]?.value || 0;
          break;
        case 'memoryUsage':
          currentValue = metrics.memoryUsage[metrics.memoryUsage.length - 1]?.value || 0;
          break;
        case 'successRate':
          currentValue = metrics.successRate;
          break;
        default:
          continue;
      }

      if (currentValue >= config.critical) {
        newBreaches.push({
          metric: metricId,
          level: 'critical',
          value: currentValue,
        });
      } else if (currentValue >= config.warning) {
        newBreaches.push({
          metric: metricId,
          level: 'warning',
          value: currentValue,
        });
      }
    }

    setThresholdBreaches(newBreaches);

    // Notify if configured
    newBreaches.forEach((breach) => {
      if (thresholds[breach.metric].notifyOnBreach) {
        gameMetricsMonitor.addAlert({
          severity: breach.level === 'critical' ? 'error' : 'warning',
          message: `${metricConfig.find((m) => m.id === breach.metric)?.name} threshold breach: ${breach.value}`,
          timestamp: Date.now(),
          details: {
            metric: breach.metric,
            value: breach.value,
            threshold: thresholds[breach.metric][breach.level],
          },
        });
      }
    });
  }, [aggregatedMetrics]);

  const handleAlertAcknowledge = (alert: Alert) => {
    gameMetricsMonitor.acknowledgeAlert(alert.id, alert.details?.acknowledgeNote);
    setAlertCount((prev) => Math.max(0, prev - 1));
  };

  const handleErrorClick = (error: ErrorEvent) => {
    setSelectedError(error);
    gameMetricsMonitor.monitorError(new Error(error.message), {
      errorId: error.id,
      type: error.type,
      playerId: error.playerId,
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    // Reset count when viewing the tab
    if (newValue === 0) setAlertCount(0);
    if (newValue === 2) setErrorCount(0);
  };

  const handleExport = (format: 'csv' | 'json') => {
    const { startTime, endTime } = getTimeRangeInMs();
    const metrics = gameMetricsMonitor.getMetrics();

    switch (selectedTab) {
      case 0: // Alerts
        const alertData =
          metrics.alerts?.filter((a) => a.timestamp >= startTime && a.timestamp <= endTime) || [];
        format === 'csv' ? exportToCSV(alertData, 'alerts') : exportToJSON(alertData, 'alerts');
        break;

      case 1: // Metrics
        const metricData = {
          updateTimes: metrics.updateTimes,
          latency: metrics.latency,
          memoryUsage: metrics.memoryUsage,
          successRate: metrics.successRate,
          playerSpeeds: metrics.playerSpeeds,
        };
        format === 'csv'
          ? exportToCSV([metricData], 'metrics')
          : exportToJSON([metricData], 'metrics');
        break;

      case 2: // Errors
        const errorData =
          metrics.errors?.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime) || [];
        format === 'csv' ? exportToCSV(errorData, 'errors') : exportToJSON(errorData, 'errors');
        break;
    }
  };

  const createSnapshot = () => {
    const { startTime, endTime } = getTimeRangeInMs();
    const metrics = gameMetricsMonitor.getMetrics();

    const snapshot = {
      timestamp: Date.now(),
      timeRange: { startTime, endTime },
      metrics: {
        alerts: metrics.alerts?.filter((a) => a.timestamp >= startTime && a.timestamp <= endTime),
        errors: metrics.errors?.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime),
        performance: {
          updateTimes: metrics.updateTimes,
          latency: metrics.latency,
          memoryUsage: metrics.memoryUsage,
          successRate: metrics.successRate,
        },
      },
    };

    exportToJSON([snapshot], 'monitoring_snapshot');
  };

  const handleRetentionSave = () => {
    setShowRetentionDialog(false);
    // Retention config is already saved in the useEffect
  };

  const handleMetricConfigSave = () => {
    setShowMetricConfig(false);
    // Config is already saved in the useEffect
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(metricConfig);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setMetricConfig(updatedItems);
  };

  const renderRetentionDialog = () => (
    <Dialog open={showRetentionDialog} onClose={() => setShowRetentionDialog(false)}>
      <DialogTitle>Data Retention Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Specify how long to keep monitoring data (in days)
          </Typography>

          <TextField
            label="Metrics Retention"
            type="number"
            value={retentionConfig.metrics}
            onChange={(e) =>
              setRetentionConfig((prev) => ({
                ...prev,
                metrics: Math.max(1, parseInt(e.target.value) || 1),
              }))
            }
            helperText="Performance metrics, memory usage, etc."
          />

          <TextField
            label="Alerts Retention"
            type="number"
            value={retentionConfig.alerts}
            onChange={(e) =>
              setRetentionConfig((prev) => ({
                ...prev,
                alerts: Math.max(1, parseInt(e.target.value) || 1),
              }))
            }
            helperText="System alerts and notifications"
          />

          <TextField
            label="Errors Retention"
            type="number"
            value={retentionConfig.errors}
            onChange={(e) =>
              setRetentionConfig((prev) => ({
                ...prev,
                errors: Math.max(1, parseInt(e.target.value) || 1),
              }))
            }
            helperText="Error logs and reports"
          />

          <FormControlLabel
            control={
              <Switch
                checked={retentionConfig.autoCleanup}
                onChange={(e) =>
                  setRetentionConfig((prev) => ({
                    ...prev,
                    autoCleanup: e.target.checked,
                  }))
                }
              />
            }
            label="Enable automatic cleanup"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowRetentionDialog(false)}>Cancel</Button>
        <Button onClick={handleRetentionSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderMetricConfigDialog = () => (
    <Dialog
      open={showMetricConfig}
      onClose={() => setShowMetricConfig(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Customize Metrics Display</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Configure which metrics to display and how they should appear
        </Typography>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="metrics">
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef}>
                {metricConfig
                  .sort((a, b) => a.order - b.order)
                  .map((metric, index) => (
                    <Draggable key={metric.id} draggableId={metric.id} index={index}>
                      {(provided) => (
                        <Paper ref={provided.innerRef} {...provided.draggableProps} sx={{ mb: 1 }}>
                          <ListItem>
                            <ListItemIcon {...provided.dragHandleProps}>
                              <DragIcon />
                            </ListItemIcon>
                            <ListItemIcon>
                              <Checkbox
                                checked={metric.enabled}
                                onChange={(e) => {
                                  const updated = metricConfig.map((m) =>
                                    m.id === metric.id ? { ...m, enabled: e.target.checked } : m
                                  );
                                  setMetricConfig(updated);
                                }}
                              />
                            </ListItemIcon>
                            <ListItemText primary={metric.name} />
                            <FormControl sx={{ minWidth: 120, mr: 2 }}>
                              <Select
                                size="small"
                                value={metric.chartType}
                                onChange={(e) => {
                                  const updated = metricConfig.map((m) =>
                                    m.id === metric.id ? { ...m, chartType: e.target.value } : m
                                  );
                                  setMetricConfig(updated);
                                }}
                              >
                                <MenuItem value="line">Line Chart</MenuItem>
                                <MenuItem value="bar">Bar Chart</MenuItem>
                                <MenuItem value="pie">Pie Chart</MenuItem>
                              </Select>
                            </FormControl>
                            <TextField
                              type="number"
                              label="Refresh (ms)"
                              size="small"
                              value={metric.refreshInterval}
                              onChange={(e) => {
                                const updated = metricConfig.map((m) =>
                                  m.id === metric.id
                                    ? {
                                        ...m,
                                        refreshInterval: parseInt(e.target.value) || 5000,
                                      }
                                    : m
                                );
                                setMetricConfig(updated);
                              }}
                              sx={{ width: 120 }}
                            />
                          </ListItem>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowMetricConfig(false)}>Cancel</Button>
        <Button onClick={handleMetricConfigSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderThresholdConfigDialog = () => (
    <Dialog
      open={showThresholdConfig}
      onClose={() => setShowThresholdConfig(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Configure Metric Thresholds</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Set warning and critical thresholds for metrics
        </Typography>

        {metricConfig.map((metric) => (
          <Paper key={metric.id} sx={{ p: 2, mb: 2 }}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="subtitle1">{metric.name}</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={thresholds[metric.id]?.enabled}
                      onChange={(e) => {
                        setThresholds((prev) => ({
                          ...prev,
                          [metric.id]: {
                            ...prev[metric.id],
                            enabled: e.target.checked,
                          },
                        }));
                      }}
                    />
                  }
                  label="Enable Thresholds"
                />
              </Box>

              {thresholds[metric.id]?.enabled && (
                <>
                  <Box>
                    <Typography gutterBottom>Warning Threshold</Typography>
                    <Slider
                      value={thresholds[metric.id].warning}
                      onChange={(e, value) => {
                        setThresholds((prev) => ({
                          ...prev,
                          [metric.id]: {
                            ...prev[metric.id],
                            warning: value as number,
                          },
                        }));
                      }}
                      min={0}
                      max={metric.id === 'successRate' ? 100 : 10000}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <Box>
                    <Typography gutterBottom>Critical Threshold</Typography>
                    <Slider
                      value={thresholds[metric.id].critical}
                      onChange={(e, value) => {
                        setThresholds((prev) => ({
                          ...prev,
                          [metric.id]: {
                            ...prev[metric.id],
                            critical: value as number,
                          },
                        }));
                      }}
                      min={0}
                      max={metric.id === 'successRate' ? 100 : 10000}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={thresholds[metric.id].notifyOnBreach}
                        onChange={(e) => {
                          setThresholds((prev) => ({
                            ...prev,
                            [metric.id]: {
                              ...prev[metric.id],
                              notifyOnBreach: e.target.checked,
                            },
                          }));
                        }}
                      />
                    }
                    label="Notify on threshold breach"
                  />
                </>
              )}
            </Stack>
          </Paper>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowThresholdConfig(false)}>Cancel</Button>
        <Button onClick={() => setShowThresholdConfig(false)} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderThresholdBreaches = () => (
    <Box sx={{ mb: 2 }}>
      {thresholdBreaches.map((breach, index) => (
        <MuiAlert
          key={`${breach.metric}-${index}`}
          severity={breach.level === 'critical' ? 'error' : 'warning'}
          sx={{ mb: 1 }}
        >
          {metricConfig.find((m) => m.id === breach.metric)?.name} threshold breach: {breach.value}
        </MuiAlert>
      ))}
    </Box>
  );

  const renderDrillDownDrawer = () => {
    if (!drillDownData) return null;

    const metric = metricConfig.find((m) => m.id === drillDownData.metricId);
    const threshold = thresholds[drillDownData.metricId];

    return (
      <Drawer
        anchor="right"
        open={showDrillDown}
        onClose={() => setShowDrillDown(false)}
        sx={{ '& .MuiDrawer-paper': { width: '60%' } }}
      >
        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6">{metric?.name} Analysis</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <ToggleButtonGroup size="small">
              <ToggleButton
                value="trendLine"
                selected={showTrendLine}
                onChange={() => setShowTrendLine(!showTrendLine)}
              >
                <Tooltip title="Show Trend Line">
                  <TrendLineIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton
                value="forecast"
                selected={showForecast}
                onChange={() => setShowForecast(!showForecast)}
              >
                <Tooltip title="Show Forecast">
                  <ForecastIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton
                value="anomalies"
                selected={showAnomalies}
                onChange={() => setShowAnomalies(!showAnomalies)}
              >
                <Tooltip title="Show Anomalies">
                  <AnomalyIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* Trend Analysis Summary */}
          {drillDownData.trendAnalysis && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Trend Analysis
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Trend Direction
                  </Typography>
                  <Typography variant="h6">
                    {drillDownData.trendAnalysis.trendLine[0]?.value <
                    drillDownData.trendAnalysis.trendLine[
                      drillDownData.trendAnalysis.trendLine.length - 1
                    ]?.value
                      ? 'Increasing'
                      : 'Decreasing'}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Anomalies Detected
                  </Typography>
                  <Typography variant="h6" color="error">
                    {drillDownData.trendAnalysis.anomalies.length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Forecast Confidence
                  </Typography>
                  <Typography variant="h6">
                    {(drillDownData.trendAnalysis.forecast[0]?.confidence * 100).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Minimum
                    </Typography>
                    <Typography variant="h6">{drillDownData.statistics.min.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Maximum
                    </Typography>
                    <Typography variant="h6">{drillDownData.statistics.max.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Average
                    </Typography>
                    <Typography variant="h6">{drillDownData.statistics.avg.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Median
                    </Typography>
                    <Typography variant="h6">
                      {drillDownData.statistics.median.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      95th Percentile
                    </Typography>
                    <Typography variant="h6">
                      {drillDownData.statistics.percentile95.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Threshold Breaches
                    </Typography>
                    <Typography variant="h6" color="error">
                      {drillDownData.statistics.breachCount}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Detailed Data
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {drillDownData.data.map((point, index) => {
                        let status = 'normal';
                        if (threshold?.enabled) {
                          if (point.value >= threshold.critical) {
                            status = 'critical';
                          } else if (point.value >= threshold.warning) {
                            status = 'warning';
                          }
                        }

                        return (
                          <TableRow key={index}>
                            <TableCell>{new Date(point.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{point.value.toFixed(2)}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={status}
                                color={
                                  status === 'critical'
                                    ? 'error'
                                    : status === 'warning'
                                      ? 'warning'
                                      : 'default'
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Drawer>
    );
  };

  // Calculate optimal update interval based on data change rate
  const calculateOptimalInterval = useCallback(
    (metricId: string) => {
      const recentData = dataBuffer[metricId] || [];
      if (recentData.length < 2) return updateConfig.minInterval;

      // Calculate average change rate
      let totalChange = 0;
      for (let i = 1; i < recentData.length; i++) {
        totalChange += Math.abs(recentData[i].value - recentData[i - 1].value);
      }
      const avgChange = totalChange / (recentData.length - 1);

      // Adjust interval based on change rate
      if (avgChange > 10) {
        return updateConfig.minInterval;
      } else if (avgChange > 5) {
        return updateConfig.minInterval * 2;
      } else {
        return Math.min(updateConfig.maxInterval, updateConfig.minInterval * 4);
      }
    },
    [dataBuffer, updateConfig]
  );

  // Batch process updates
  const processBatchedUpdates = useCallback(() => {
    if (isProcessing || Object.keys(dataBuffer).length === 0) return;

    setIsProcessing(true);
    const batchSize = updateConfig.batchSize;
    const updates: Record<string, MetricData[]> = {};

    // Process each metric's buffer
    Object.entries(dataBuffer).forEach(([metricId, data]) => {
      if (data.length > batchSize) {
        // Sample data points to reduce size while maintaining pattern
        const stride = Math.ceil(data.length / batchSize);
        updates[metricId] = data.filter((_, index) => index % stride === 0);
      } else {
        updates[metricId] = data;
      }
    });

    // Clear processed data from buffer
    setDataBuffer({});
    setIsProcessing(false);

    // Update metrics with batched data
    if (Object.keys(updates).length > 0) {
      gameMetricsMonitor.batchUpdate(updates);
      setLastUpdateTime(Date.now());
    }
  }, [dataBuffer, isProcessing, updateConfig.batchSize]);

  // Handle incoming metric updates
  const handleMetricUpdate = useCallback((metricId: string, data: MetricData) => {
    setDataBuffer((prev) => ({
      ...prev,
      [metricId]: [...(prev[metricId] || []), data],
    }));
  }, []);

  useEffect(() => {
    if (!updateConfig.dynamicFrequency) {
      setUpdateInterval(updateConfig.minInterval);
      return;
    }

    // Calculate new interval based on all active metrics
    const intervals = metricConfig
      .filter((m) => m.enabled)
      .map((m) => calculateOptimalInterval(m.id));

    setUpdateInterval(Math.min(...intervals));
  }, [updateConfig, metricConfig, calculateOptimalInterval]);

  useEffect(() => {
    const timer = setInterval(processBatchedUpdates, updateInterval);
    return () => clearInterval(timer);
  }, [processBatchedUpdates, updateInterval]);

  const renderUpdateConfigDialog = () => (
    <Dialog
      open={showUpdateConfig}
      onClose={() => setShowUpdateConfig(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Real-time Update Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Configure real-time update behavior
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={updateConfig.dynamicFrequency}
                onChange={(e) =>
                  setUpdateConfig((prev) => ({
                    ...prev,
                    dynamicFrequency: e.target.checked,
                  }))
                }
              />
            }
            label="Dynamic Update Frequency"
          />

          <Box>
            <Typography gutterBottom>Batch Size</Typography>
            <Slider
              value={updateConfig.batchSize}
              onChange={(_, value) =>
                setUpdateConfig((prev) => ({
                  ...prev,
                  batchSize: value as number,
                }))
              }
              min={10}
              max={100}
              step={10}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={updateConfig.compressionEnabled}
                onChange={(e) =>
                  setUpdateConfig((prev) => ({
                    ...prev,
                    compressionEnabled: e.target.checked,
                  }))
                }
              />
            }
            label="Enable Data Compression"
          />

          <Box>
            <Typography gutterBottom>Update Interval Range (ms)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Minimum"
                  type="number"
                  value={updateConfig.minInterval}
                  onChange={(e) =>
                    setUpdateConfig((prev) => ({
                      ...prev,
                      minInterval: Math.max(100, parseInt(e.target.value) || 1000),
                    }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Maximum"
                  type="number"
                  value={updateConfig.maxInterval}
                  onChange={(e) =>
                    setUpdateConfig((prev) => ({
                      ...prev,
                      maxInterval: Math.max(
                        updateConfig.minInterval,
                        parseInt(e.target.value) || 30000
                      ),
                    }))
                  }
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Current Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">Current Interval</Typography>
                <Typography variant="h6">{updateInterval}ms</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Buffer Size</Typography>
                <Typography variant="h6">
                  {Object.values(dataBuffer).reduce((sum, arr) => sum + arr.length, 0)}
                </Typography>
              </Grid>
            </Grid>
            {isProcessing && <LinearProgress sx={{ mt: 1 }} />}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowUpdateConfig(false)}>Cancel</Button>
        <Button onClick={() => setShowUpdateConfig(false)} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  const calculateCorrelation = useCallback(
    (metric1: string, metric2: string) => {
      const timeRange = getTimeRangeInMs();
      const metrics = gameMetricsMonitor.getMetrics();

      // Get data points for both metrics
      const data1 = metrics[metric1] || [];
      const data2 = metrics[metric2] || [];

      // Filter data points within the time range
      const filteredData1 = data1.filter(
        (d) => d.timestamp >= timeRange.startTime && d.timestamp <= timeRange.endTime
      );
      const filteredData2 = data2.filter(
        (d) => d.timestamp >= timeRange.startTime && d.timestamp <= timeRange.endTime
      );

      // Create paired data points
      const pairedData = filteredData1.map((d1) => {
        const closest = filteredData2.reduce((prev, curr) => {
          return Math.abs(curr.timestamp - d1.timestamp) < Math.abs(prev.timestamp - d1.timestamp)
            ? curr
            : prev;
        });
        return { x: d1.value, y: closest.value };
      });

      // Calculate correlation coefficient
      const n = pairedData.length;
      if (n < 2) return null;

      const sumX = pairedData.reduce((sum, p) => sum + p.x, 0);
      const sumY = pairedData.reduce((sum, p) => sum + p.y, 0);
      const sumXY = pairedData.reduce((sum, p) => sum + p.x * p.y, 0);
      const sumX2 = pairedData.reduce((sum, p) => sum + p.x * p.x, 0);
      const sumY2 = pairedData.reduce((sum, p) => sum + p.y * p.y, 0);

      const coefficient =
        (n * sumXY - sumX * sumY) /
        Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

      return {
        metrics: [metric1, metric2] as [string, string],
        coefficient,
        scatterData: pairedData,
        timeRange,
      };
    },
    [getTimeRangeInMs]
  );

  const handleCorrelationAnalysis = useCallback(() => {
    if (!selectedMetrics) return;
    const correlation = calculateCorrelation(selectedMetrics[0], selectedMetrics[1]);
    if (correlation) {
      setCorrelationData(correlation);
    }
  }, [selectedMetrics, calculateCorrelation]);

  useEffect(() => {
    if (selectedMetrics) {
      handleCorrelationAnalysis();
    }
  }, [selectedMetrics, handleCorrelationAnalysis]);

  const renderCorrelationDialog = () => (
    <Dialog
      open={showCorrelation}
      onClose={() => setShowCorrelation(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Metric Correlation Analysis</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Analyze relationships between different metrics
          </Typography>

          <Box>
            <Autocomplete
              multiple
              value={selectedMetrics || []}
              onChange={(_, newValue) => {
                if (newValue.length <= 2) {
                  setSelectedMetrics(newValue.length === 2 ? [newValue[0], newValue[1]] : null);
                }
              }}
              options={metricConfig.filter((m) => m.enabled).map((m) => m.id)}
              getOptionLabel={(option) => metricConfig.find((m) => m.id === option)?.name || option}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Two Metrics to Compare"
                  placeholder="Choose metrics..."
                />
              )}
              sx={{ mb: 2 }}
            />
          </Box>

          {correlationData && (
            <>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Correlation Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body1" sx={{ mr: 1 }}>
                        Correlation Coefficient:
                      </Typography>
                      <Typography
                        variant="h6"
                        color={
                          Math.abs(correlationData.coefficient) > 0.7
                            ? 'error'
                            : Math.abs(correlationData.coefficient) > 0.3
                              ? 'warning'
                              : 'text.primary'
                        }
                      >
                        {correlationData.coefficient.toFixed(3)}
                      </Typography>
                      {correlationData.coefficient > 0 ? (
                        <PositiveCorrelationIcon color="success" sx={{ ml: 1 }} />
                      ) : (
                        <NegativeCorrelationIcon color="error" sx={{ ml: 1 }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {Math.abs(correlationData.coefficient) > 0.7
                        ? 'Strong correlation detected'
                        : Math.abs(correlationData.coefficient) > 0.3
                          ? 'Moderate correlation detected'
                          : 'Weak or no correlation detected'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={metricConfig.find((m) => m.id === correlationData.metrics[0])?.name}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={metricConfig.find((m) => m.id === correlationData.metrics[1])?.name}
                    />
                    <RechartsTooltip />
                    <Scatter data={correlationData.scatterData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </Paper>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowCorrelation(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const generateExportData = (): ExportData => {
    const metrics = gameMetricsMonitor.getMetrics();
    const timeRange = getTimeRangeInMs();

    return {
      metrics,
      correlations: correlationData ? [correlationData] : [],
      thresholds,
      alerts: metrics.alerts || [],
      errors: metrics.errors || [],
      timestamp: Date.now(),
    };
  };

  const exportToJson = () => {
    const data = generateExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    saveAs(blob, `monitoring-data-${new Date().toISOString()}.json`);
    handleExportClose();
  };

  const exportToCsv = () => {
    const data = generateExportData();
    const metrics = data.metrics;

    // Convert metrics to CSV format
    const headers = ['timestamp', ...Object.keys(metrics)];
    const rows = [headers];

    // Combine all timestamps
    const timestamps = new Set<number>();
    Object.values(metrics).forEach((metricData) => {
      metricData.forEach((point) => timestamps.add(point.timestamp));
    });

    // Create rows with data
    Array.from(timestamps)
      .sort()
      .forEach((timestamp) => {
        const row = [timestamp.toString()];
        Object.keys(metrics).forEach((metricKey) => {
          const point = metrics[metricKey].find((p) => p.timestamp === timestamp);
          row.push(point ? point.value.toString() : '');
        });
        rows.push(row);
      });

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `monitoring-data-${new Date().toISOString()}.csv`);
    handleExportClose();
  };

  const exportToPdf = async () => {
    try {
      await exportToPDF('monitoring-dashboard', 'dojopool-monitoring');
      handleExportClose();
    } catch (error) {
      console.error('Failed to export PDF:', error);
      // Add error notification here
    }
  };

  const generateShareUrl = () => {
    const data = generateExportData();
    // In a real implementation, you would send this to a backend service
    // and get a shareable URL. For now, we'll simulate it.
    const shareId = Math.random().toString(36).substring(7);
    const url = `${window.location.origin}/share/${shareId}`;
    setShareUrl(url);
    handleExportClose();
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const renderExportMenu = () => (
    <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={handleExportClose}>
      <MenuItem onClick={exportToJson}>
        <ListItemIcon>
          <JsonIcon />
        </ListItemIcon>
        <ListItemText primary="Export as JSON" />
      </MenuItem>
      <MenuItem onClick={exportToCsv}>
        <ListItemIcon>
          <CsvIcon />
        </ListItemIcon>
        <ListItemText primary="Export as CSV" />
      </MenuItem>
      <MenuItem onClick={exportToPdf}>
        <ListItemIcon>
          <PdfIcon />
        </ListItemIcon>
        <ListItemText primary="Export as PDF" />
      </MenuItem>
      <Divider />
      <MenuItem onClick={generateShareUrl}>
        <ListItemIcon>
          <ShareIcon />
        </ListItemIcon>
        <ListItemText primary="Generate Share URL" />
      </MenuItem>
    </Menu>
  );

  const renderShareDialog = () => (
    <Dialog open={Boolean(shareUrl)} onClose={() => setShareUrl(null)}>
      <DialogTitle>Share Dashboard</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Share this URL to give others access to this dashboard snapshot:
          </Typography>
          <TextField
            value={shareUrl}
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={copyShareUrl} size="small">
                  <CopyIcon />
                </IconButton>
              ),
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShareUrl(null)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const analyzeMetricPatterns = useCallback(
    async (metricId: string) => {
      setIsAnalyzing(true);
      const metrics = gameMetricsMonitor.getMetrics();
      const timeRange = getTimeRangeInMs();
      const metricData = metrics[metricId] || [];

      // Filter data within time range
      const data = metricData.filter(
        (d) => d.timestamp >= timeRange.startTime && d.timestamp <= timeRange.endTime
      );

      if (data.length < 2) {
        setIsAnalyzing(false);
        return;
      }

      // Detect patterns
      const patterns: PatternInfo[] = [];

      // Simple trend detection
      const values = data.map((d) => d.value);
      const trend = values.reduce((a, b) => a + b, 0) / values.length;
      const trendStrength = Math.abs(values[values.length - 1] - values[0]) / trend;

      if (trendStrength > 0.1) {
        patterns.push({
          type: 'trend',
          startTime: data[0].timestamp,
          endTime: data[data.length - 1].timestamp,
          confidence: Math.min(trendStrength, 1),
          description: `${trendStrength > 0 ? 'Upward' : 'Downward'} trend detected`,
        });
      }

      // Seasonality detection using autocorrelation
      const detectSeasonality = (values: number[]) => {
        const maxLag = Math.floor(values.length / 2);
        let bestPeriod = 0;
        let maxCorrelation = 0;

        for (let lag = 1; lag <= maxLag; lag++) {
          let correlation = 0;
          for (let i = 0; i < values.length - lag; i++) {
            correlation += values[i] * values[i + lag];
          }
          correlation /= values.length;

          if (correlation > maxCorrelation) {
            maxCorrelation = correlation;
            bestPeriod = lag;
          }
        }

        return {
          period: bestPeriod,
          strength: maxCorrelation,
          peaks: values.map((v, i) => (i % bestPeriod === 0 ? i : -1)).filter((i) => i !== -1),
        };
      };

      const seasonality = detectSeasonality(values);

      // Generate predictions using simple exponential smoothing
      const generatePredictions = (values: number[], timestamps: number[]) => {
        const alpha = 0.3; // smoothing factor
        let lastValue = values[values.length - 1];
        const predictions: PredictionData[] = [];
        const interval = timestamps[1] - timestamps[0];

        // Predict next 10 points
        for (let i = 1; i <= 10; i++) {
          const nextValue = alpha * lastValue + (1 - alpha) * values[values.length - 1];
          const confidence = Math.max(0.95 - i * 0.05, 0.5); // Decrease confidence over time
          predictions.push({
            timestamp: timestamps[timestamps.length - 1] + interval * i,
            value: nextValue,
            confidence,
          });
          lastValue = nextValue;
        }

        return predictions;
      };

      const predictions = generatePredictions(
        values,
        data.map((d) => d.timestamp)
      );

      setAnalyticsResult({
        patterns,
        seasonality,
        predictions,
      });
      setIsAnalyzing(false);
    },
    [getTimeRangeInMs]
  );

  useEffect(() => {
    if (selectedMetricAnalytics) {
      analyzeMetricPatterns(selectedMetricAnalytics);
    }
  }, [selectedMetricAnalytics, analyzeMetricPatterns]);

  const renderAnalyticsDialog = () => (
    <Dialog open={showAnalytics} onClose={() => setShowAnalytics(false)} maxWidth="md" fullWidth>
      <DialogTitle>Advanced Analytics</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Analyze patterns and predict future trends
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Select Metric</InputLabel>
            <Select
              value={selectedMetricAnalytics || ''}
              onChange={(e) => setSelectedMetricAnalytics(e.target.value as string)}
              label="Select Metric"
            >
              {metricConfig
                .filter((m) => m.enabled)
                .map((metric) => (
                  <MenuItem key={metric.id} value={metric.id}>
                    {metric.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {isAnalyzing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            analyticsResult && (
              <>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Detected Patterns
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {analyticsResult.patterns.map((pattern, index) => (
                      <Chip
                        key={index}
                        label={pattern.description}
                        color={pattern.confidence > 0.7 ? 'primary' : 'default'}
                        icon={<PatternsIcon />}
                      />
                    ))}
                  </Stack>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Seasonality Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Period Length
                      </Typography>
                      <Typography variant="h6">
                        {analyticsResult.seasonality.period} points
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Seasonal Strength
                      </Typography>
                      <Typography variant="h6">
                        {(analyticsResult.seasonality.strength * 100).toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Peak Count
                      </Typography>
                      <Typography variant="h6">
                        {analyticsResult.seasonality.peaks.length}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Predictions
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsResult.predictions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value: any, name: string) => [
                            value,
                            name === 'confidence' ? 'Confidence' : 'Predicted Value',
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#8884d8"
                          name="Predicted Value"
                        />
                        <Line
                          type="monotone"
                          dataKey="confidence"
                          stroke="#82ca9d"
                          name="Confidence"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </>
            )
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowAnalytics(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const analyzeCauseEffect = useCallback(async () => {
    setAnalyzingCauseEffect(true);
    const metrics = gameMetricsMonitor.getMetrics();
    const timeRange = getTimeRangeInMs();

    // Calculate lag correlations between all metric pairs
    const lagCorrelations: CauseEffectAnalysis['lagCorrelations'] = [];
    const enabledMetrics = metricConfig.filter((m) => m.enabled);

    for (let i = 0; i < enabledMetrics.length; i++) {
      for (let j = i + 1; j < enabledMetrics.length; j++) {
        const metric1 = enabledMetrics[i];
        const metric2 = enabledMetrics[j];
        const data1 = metrics[metric1.id] || [];
        const data2 = metrics[metric2.id] || [];

        // Calculate cross-correlation with different lags
        const maxLag = Math.min(50, Math.floor(data1.length / 2));
        let bestLag = 0;
        let bestCorrelation = 0;

        for (let lag = -maxLag; lag <= maxLag; lag++) {
          let correlation = 0;
          let count = 0;

          for (let k = Math.max(0, -lag); k < Math.min(data1.length, data2.length - lag); k++) {
            correlation += data1[k].value * data2[k + lag].value;
            count++;
          }

          correlation /= count;

          if (Math.abs(correlation) > Math.abs(bestCorrelation)) {
            bestCorrelation = correlation;
            bestLag = lag;
          }
        }

        if (Math.abs(bestCorrelation) > 0.5) {
          lagCorrelations.push({
            metric1: metric1.id,
            metric2: metric2.id,
            lagTime: bestLag,
            correlation: bestCorrelation,
          });
        }
      }
    }

    // Detect event sequences
    const sequences: EventSequence[] = [];
    lagCorrelations.forEach((corr) => {
      const data1 = metrics[corr.metric1] || [];
      const data2 = metrics[corr.metric2] || [];

      // Find significant changes in both metrics
      const threshold = 0.1;
      const events: EventSequence['events'] = [];

      data1.forEach((point, i) => {
        if (i > 0) {
          const change = Math.abs(point.value - data1[i - 1].value) / data1[i - 1].value;
          if (change > threshold) {
            events.push({
              metricId: corr.metric1,
              timestamp: point.timestamp,
              value: point.value,
              type: corr.lagTime >= 0 ? 'cause' : 'effect',
            });
          }
        }
      });

      data2.forEach((point, i) => {
        if (i > 0) {
          const change = Math.abs(point.value - data2[i - 1].value) / data2[i - 1].value;
          if (change > threshold) {
            events.push({
              metricId: corr.metric2,
              timestamp: point.timestamp,
              value: point.value,
              type: corr.lagTime >= 0 ? 'effect' : 'cause',
            });
          }
        }
      });

      if (events.length >= 2) {
        sequences.push({
          events: events.sort((a, b) => a.timestamp - b.timestamp),
          confidence: Math.abs(corr.correlation),
          lagTime: Math.abs(corr.lagTime),
        });
      }
    });

    // Identify root causes
    const rootCauses: CauseEffectAnalysis['rootCauses'] = [];
    enabledMetrics.forEach((metric) => {
      const relatedCorrelations = lagCorrelations.filter(
        (corr) => corr.metric1 === metric.id || corr.metric2 === metric.id
      );

      const causeCount = relatedCorrelations.filter(
        (corr) =>
          (corr.metric1 === metric.id && corr.lagTime <= 0) ||
          (corr.metric2 === metric.id && corr.lagTime >= 0)
      ).length;

      if (causeCount > 0) {
        const confidence = causeCount / relatedCorrelations.length;
        const affectedMetrics = relatedCorrelations
          .map((corr) => (corr.metric1 === metric.id ? corr.metric2 : corr.metric1))
          .filter((m) => m !== metric.id);

        rootCauses.push({
          metricId: metric.id,
          confidence,
          affectedMetrics,
        });
      }
    });

    setCauseEffectAnalysis({
      lagCorrelations,
      sequences,
      rootCauses,
    });
    setAnalyzingCauseEffect(false);
  }, [metricConfig, getTimeRangeInMs]);

  useEffect(() => {
    if (showCauseEffect && !causeEffectAnalysis && !analyzingCauseEffect) {
      analyzeCauseEffect();
    }
  }, [showCauseEffect, causeEffectAnalysis, analyzingCauseEffect, analyzeCauseEffect]);

  const renderCauseEffectDialog = () => (
    <Dialog
      open={showCauseEffect}
      onClose={() => setShowCauseEffect(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Cause-Effect Analysis</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Analyze relationships and identify root causes
          </Typography>

          {analyzingCauseEffect ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            causeEffectAnalysis && (
              <>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Root Causes
                  </Typography>
                  <List>
                    {causeEffectAnalysis.rootCauses
                      .sort((a, b) => b.confidence - a.confidence)
                      .map((cause, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CauseEffectIcon color={cause.confidence > 0.7 ? 'error' : 'warning'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={metricConfig.find((m) => m.id === cause.metricId)?.name}
                            secondary={`Confidence: ${(cause.confidence * 100).toFixed(1)}% | Affects ${
                              cause.affectedMetrics.length
                            } metrics`}
                          />
                        </ListItem>
                      ))}
                  </List>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Event Sequences
                  </Typography>
                  <Timeline>
                    {causeEffectAnalysis.sequences.map((sequence, index) => (
                      <TimelineItem key={index}>
                        <TimelineSeparator>
                          <TimelineDot color={sequence.confidence > 0.7 ? 'primary' : 'grey'} />
                          <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="subtitle1">
                            Sequence {index + 1} (Confidence:{' '}
                            {(sequence.confidence * 100).toFixed(1)}%)
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Lag time: {sequence.lagTime}ms
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {sequence.events.map((event, eventIndex) => (
                              <Chip
                                key={eventIndex}
                                label={`${metricConfig.find((m) => m.id === event.metricId)?.name} (${
                                  event.type
                                })`}
                                color={event.type === 'cause' ? 'primary' : 'secondary'}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Lag Correlations
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric 1</TableCell>
                          <TableCell>Metric 2</TableCell>
                          <TableCell>Lag Time (ms)</TableCell>
                          <TableCell>Correlation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {causeEffectAnalysis.lagCorrelations
                          .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
                          .map((corr, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {metricConfig.find((m) => m.id === corr.metric1)?.name}
                              </TableCell>
                              <TableCell>
                                {metricConfig.find((m) => m.id === corr.metric2)?.name}
                              </TableCell>
                              <TableCell>{corr.lagTime}</TableCell>
                              <TableCell
                                sx={{
                                  color:
                                    Math.abs(corr.correlation) > 0.7
                                      ? 'error.main'
                                      : Math.abs(corr.correlation) > 0.5
                                        ? 'warning.main'
                                        : 'text.primary',
                                }}
                              >
                                {(corr.correlation * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </>
            )
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCauseEffectAnalysis(null)}>Refresh</Button>
        <Button onClick={() => setShowCauseEffect(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  useEffect(() => {
    // Subscribe to error updates
    const unsubscribe = errorTracker.onError(() => {
      // Update stats when new errors occur
      setErrorStats(errorTracker.getErrorStats());
      errorTracker.analyzeErrorTrends().then(setErrorTrends);
    });

    // Initial load
    setErrorStats(errorTracker.getErrorStats());
    errorTracker.analyzeErrorTrends().then(setErrorTrends);

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatErrorRate = (rate: number): string => {
    return `${rate.toFixed(2)} errors/hour`;
  };

  useEffect(() => {
    const updateStats = () => {
      const stats = ErrorTracker.getInstance().getErrorStats();
      setErrorStats(stats);

      // Update error data for chart
      const now = Date.now();
      const newDataPoint = {
        timestamp: now,
        count: stats.total,
      };

      setErrorData((prevData) => {
        const newData = [...prevData, newDataPoint].filter(
          (d) => now - d.timestamp <= 3600000 // Keep last hour
        );
        return newData;
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredErrors = selectedComponent
    ? errorStats.recentErrors.filter(({ context }) => context.component === selectedComponent)
    : errorStats.recentErrors;

  return (
    <ErrorBoundary>
      <Box sx={{ width: '100%', height: '100%' }} id="monitoring-dashboard">
        <Stack spacing={2}>
          {/* Error Overview */}
          <section className="error-overview">
            <h3>Overview</h3>
            {errorStats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Total Errors</h4>
                  <p>{errorStats.total}</p>
                </div>
                <div className="stat-card">
                  <h4>Active Components with Errors</h4>
                  <p>{Object.keys(errorStats.byComponent).length}</p>
                </div>
                <div className="stat-card">
                  <h4>Error Types</h4>
                  <p>{Object.keys(errorStats.byType).length}</p>
                </div>
              </div>
            )}
          </section>

          {/* Error Trends */}
          {errorTrends && (
            <section className="error-trends">
              <h3>Error Trends</h3>

              {/* Top Error Types */}
              <div className="trend-section">
                <h4>Top Error Types</h4>
                <ul className="trend-list">
                  {errorTrends.topErrorTypes.map(({ type, count }) => (
                    <li key={type} className="trend-item">
                      <span className="trend-label">{type}</span>
                      <span className="trend-value">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Top Components */}
              <div className="trend-section">
                <h4>Most Affected Components</h4>
                <ul className="trend-list">
                  {errorTrends.topComponents.map(({ component, count }) => (
                    <li
                      key={component}
                      className="trend-item"
                      onClick={() => setSelectedComponent(component)}
                    >
                      <span className="trend-label">{component}</span>
                      <span className="trend-value">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Error Rates */}
              <div className="trend-section">
                <h4>Error Rates</h4>
                <ul className="trend-list">
                  {errorTrends.errorRates.map(({ component, rate }) => (
                    <li key={component} className="trend-item">
                      <span className="trend-label">{component}</span>
                      <span className="trend-value">{formatErrorRate(rate)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Recent Errors */}
          {errorStats && (
            <section className="recent-errors">
              <h3>Recent Errors</h3>
              <div className="error-list">
                {filteredErrors.map(({ error, context }, index) => (
                  <div key={index} className="error-item">
                    <div className="error-header">
                      <span className="error-type">{error.name}</span>
                      <span className="error-component">{context.component || 'Unknown'}</span>
                      <span className="error-time">{formatTimestamp(context.timestamp)}</span>
                    </div>
                    <div className="error-message">{error.message}</div>
                    {error.stack && <pre className="error-stack">{error.stack}</pre>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Component Filter */}
          {selectedComponent && (
            <div className="filter-banner">
              <span>Filtering by component: {selectedComponent}</span>
              <button onClick={() => setSelectedComponent(null)} className="clear-filter">
                Clear Filter
              </button>
            </div>
          )}
        </Stack>
      </Box>
    </ErrorBoundary>
  );
};
