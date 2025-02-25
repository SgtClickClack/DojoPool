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
  Close as CloseIcon,
  Info as InfoIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Search as SearchIcon,
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
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@mui/lab';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { Alert, ErrorData, ErrorEvent as MonitoringErrorEvent, MetricData, MetricsSnapshot } from '../../types/monitoring';
import { ErrorTracker, gameMetricsMonitor } from '../../utils/monitoring';
import { ErrorBoundary } from './[ERR]ErrorBoundary';
import { MetricsChart } from './[MON]MetricsChart';
import { exportToPDF } from '../../utils/pdfExport';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MetricCard from './[MON]MetricCard';
import { keyframes } from '@emotion/react';
import { HelpIcon, RestoreIcon, VisibilityIcon, VisibilityOffIcon, RefreshIcon } from '@mui/icons-material';
import { Virtuoso } from 'react-virtuoso';
import { debounce } from 'lodash';

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
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}_${new Date().toISOString()}.csv`);
};

const exportToJSON = (data: any, filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  saveAs(blob, `${filename}.json`);
};

const convertToCSV = (data: any[]): string => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
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
  errors: MonitoringErrorEvent[];
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

// Add SortableItem component with enhanced styling and animations
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const SortableItem = ({ id, children }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 0.3s ease',
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
    backgroundColor: isDragging 
      ? 'rgba(63, 81, 181, 0.12)' 
      : isOver 
        ? 'rgba(63, 81, 181, 0.08)'
        : 'transparent',
    borderRadius: '8px',
    boxShadow: isDragging 
      ? '0 8px 16px rgba(0,0,0,0.1)' 
      : '0 2px 4px rgba(0,0,0,0.05)',
    cursor: isDragging ? 'grabbing' : 'grab',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    animation: isDragging 
      ? `${shake} 0.3s ease infinite`
      : `${fadeIn} 0.3s ease`,
  };

  return (
    <Paper 
      ref={setNodeRef} 
      sx={{
        ...style,
        mb: 2,
        p: 2,
        border: isDragging 
          ? '2px dashed #3f51b5' 
          : isOver 
            ? '2px solid #3f51b5'
            : '2px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      elevation={isDragging ? 8 : isOver ? 4 : 1}
    >
      <Box 
        {...attributes} 
        {...listeners}
        sx={{
          '&:active': {
            cursor: 'grabbing',
            animation: `${pulse} 0.3s ease`,
          }
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

interface ConfigHelpSection {
  title: string;
  description: string;
  tips: string[];
}

const CONFIG_HELP_SECTIONS: ConfigHelpSection[] = [
  {
    title: 'Metric Configuration',
    description: 'Configure how metrics are displayed and updated in the dashboard.',
    tips: [
      'Enable/disable metrics to control what data is shown',
      'Adjust refresh intervals based on data importance',
      'Choose chart types that best represent your data',
      'Drag and drop metrics to organize your dashboard layout'
    ]
  },
  {
    title: 'Chart Types',
    description: 'Different chart types are suitable for different kinds of data:',
    tips: [
      'Line Charts: Best for time-series data and trends',
      'Bar Charts: Good for comparing values across categories',
      'Pie Charts: Ideal for showing proportions of a whole'
    ]
  },
  {
    title: 'Refresh Intervals',
    description: 'Balance between real-time updates and system performance:',
    tips: [
      'Critical metrics: 1-5 seconds',
      'Important metrics: 5-15 seconds',
      'Background metrics: 15-60 seconds',
      'Consider browser performance when setting intervals'
    ]
  }
];

// Add cache interfaces
interface MetricsCache {
  data: MetricsSnapshot | null;
  timestamp: number;
  timeRange: { startTime: number; endTime: number };
}

interface AggregatedMetricsCache {
  data: {
    updateTimes: MetricData[];
    latency: MetricData[];
    memoryUsage: MetricData[];
  };
  timestamp: number;
  interval: number;
}

// Lazy load components
const ConfigHelpDialog = lazy(() => import('./[MON]ConfigHelpDialog'));

// Add data cleanup and optimization utilities
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Maximum number of data points to keep in memory

// Add data management utilities
const cleanupOldData = (data: MetricData[], maxAge: number): MetricData[] => {
  const now = Date.now();
  return data.filter(point => now - point.timestamp <= maxAge);
};

const downSampleData = (data: MetricData[], targetPoints: number): MetricData[] => {
  if (data.length <= targetPoints) return data;
  
  const interval = Math.floor(data.length / targetPoints);
  return data.filter((_, index) => index % interval === 0);
};

// Add memory leak prevention utilities
const MEMORY_CHECK_INTERVAL = 60000; // 1 minute
const MAX_HISTORICAL_POINTS = 10000;
const MAX_ERROR_LOGS = 1000;

// Add resource management interfaces
interface ResourceUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

interface ResourceManager {
  lastCheck: number;
  warningThreshold: number;
  criticalThreshold: number;
}

// Add request optimization utilities
const REQUEST_BATCH_DELAY = 100; // 100ms
const MAX_BATCH_SIZE = 50;

interface RequestBatch {
  timestamp: number;
  requests: Array<{
    type: string;
    params: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>;
}

// Add network optimization utilities
const COMPRESSION_THRESHOLD = 1024; // 1KB
const CACHE_VERSION = '1.0.0';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface NetworkCache {
  version: string;
  data: {
    [key: string]: {
      value: any;
      timestamp: number;
      etag: string;
    };
  };
}

// Add WebSocket and Worker optimizations
const WS_RECONNECT_DELAY = 1000;
const WS_MAX_RECONNECT_ATTEMPTS = 5;
const WORKER_CHUNK_SIZE = 1000;

// Add WebSocket manager with reconnection and compression
class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private subscribers = new Map<string, Set<(data: any) => void>>();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private compressionEnabled = true;

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(url: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.ws?.send(JSON.stringify({ type: 'init', compression: this.compressionEnabled }));
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect(url);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = async (event) => {
      try {
        let data;
        if (this.compressionEnabled && event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          const id = Date.now().toString();
          workerCallbacks.current.set(id, (decompressed) => {
            try {
              const parsed = JSON.parse(decompressed);
              const subscribers = this.subscribers.get(parsed.type);
              subscribers?.forEach(callback => callback(parsed.payload));
            } catch (error) {
              console.error('Error processing WebSocket message:', error);
            }
          });
          metricsWorker.postMessage({
            id,
            type: 'decompressData',
            data: new Uint8Array(arrayBuffer)
          });
        } else {
          data = JSON.parse(event.data);
          const subscribers = this.subscribers.get(data.type);
          subscribers?.forEach(callback => callback(data.payload));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
  }

  private reconnect(url: string) {
    if (this.reconnectAttempts >= WS_MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(url);
    }, WS_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts));
  }

  subscribe(type: string, callback: (data: any) => void) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback);

    return () => {
      const subscribers = this.subscribers.get(type);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(type);
        }
      }
    };
  }

  async send(type: string, payload: any) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    try {
      if (this.compressionEnabled && JSON.stringify(payload).length > COMPRESSION_THRESHOLD) {
        const id = Date.now().toString();
        const compressedData = await new Promise<Uint8Array>((resolve) => {
          workerCallbacks.current.set(id, resolve);
          metricsWorker.postMessage({
            id,
            type: 'compressData',
            data: { type, payload }
          });
        });
        this.ws.send(compressedData);
      } else {
        this.ws.send(JSON.stringify({ type, payload }));
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
  }

  setCompression(enabled: boolean) {
    this.compressionEnabled = enabled;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'setCompression', enabled }));
    }
  }
}

// Add MetricsWorker for heavy computations
const metricsWorker = new Worker(
  new URL('../../workers/metrics.worker.ts', import.meta.url)
);

// Add lazy-loaded components with prefetch
const MetricsChart = lazy(() => {
  const modulePromise = import('./[MON]MetricsChart');
  // Prefetch related components
  import('./[MON]MetricCard');
  import('./[MON]ConfigHelpDialog');
  return modulePromise;
});

const ConfigHelpDialog = lazy(() => import('./[MON]ConfigHelpDialog'));
const ErrorBoundary = lazy(() => import('./[ERR]ErrorBoundary'));
const MetricCard = lazy(() => import('./[MON]MetricCard'));

export const Dashboard: React.FC<DashboardProps> = ({ gameId }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedError, setSelectedError] = useState<MonitoringErrorEvent | null>(null);
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
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [historicalData, setHistoricalData] = useState<MetricData[]>([]);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [metricSearchQuery, setMetricSearchQuery] = useState('');
  const [metricTypeFilter, setMetricTypeFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [metricsCache, setMetricsCache] = useState<MetricsCache>({
    data: null,
    timestamp: 0,
    timeRange: { startTime: 0, endTime: 0 }
  });
  const [aggregatedCache, setAggregatedCache] = useState<AggregatedMetricsCache>({
    data: { updateTimes: [], latency: [], memoryUsage: [] },
    timestamp: 0,
    interval: 0
  });
  const [dataCleanupTime, setDataCleanupTime] = useState(Date.now());
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null);
  const [resourceManager] = useState<ResourceManager>({
    lastCheck: Date.now(),
    warningThreshold: 0.8, // 80% usage
    criticalThreshold: 0.9 // 90% usage
  });
  const [pendingBatch, setPendingBatch] = useState<RequestBatch>({
    timestamp: Date.now(),
    requests: []
  });
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastRequestTime = useRef<number>(Date.now());
  const [networkCache, setNetworkCache] = useState<NetworkCache>({
    version: CACHE_VERSION,
    data: {}
  });
  const wsManager = useRef<WebSocketManager>(WebSocketManager.getInstance());
  const workerCallbacks = useRef(new Map<string, (data: any) => void>());

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

  // Add data cleanup effect
  useEffect(() => {
    const cleanup = () => {
      if (!metrics) return;

      const now = Date.now();
      const timeRange = getTimeRangeInMs();
      const maxAge = timeRange.endTime - timeRange.startTime;

      // Clean up historical data
      if (metrics.historical) {
        const cleanedHistorical = {
          cpuUsage: cleanupOldData(metrics.historical.cpuUsage, maxAge),
          memoryUsage: cleanupOldData(metrics.historical.memoryUsage, maxAge),
          diskUsage: cleanupOldData(metrics.historical.diskUsage, maxAge),
          networkTraffic: cleanupOldData(metrics.historical.networkTraffic, maxAge)
        };

        // Down sample if too many points
        if (cleanedHistorical.cpuUsage.length > MAX_CACHE_SIZE) {
          cleanedHistorical.cpuUsage = downSampleData(cleanedHistorical.cpuUsage, MAX_CACHE_SIZE);
          cleanedHistorical.memoryUsage = downSampleData(cleanedHistorical.memoryUsage, MAX_CACHE_SIZE);
          cleanedHistorical.diskUsage = downSampleData(cleanedHistorical.diskUsage, MAX_CACHE_SIZE);
          cleanedHistorical.networkTraffic = downSampleData(cleanedHistorical.networkTraffic, MAX_CACHE_SIZE);
        }

        setMetrics(prev => prev ? {
          ...prev,
          historical: cleanedHistorical
        } : null);
      }

      setDataCleanupTime(now);
    };

    const cleanupInterval = setInterval(cleanup, CLEANUP_INTERVAL);
    return () => clearInterval(cleanupInterval);
  }, [metrics, getTimeRangeInMs]);

  // Add resource monitoring effect
  useEffect(() => {
    const monitorResources = () => {
      if (typeof performance === 'undefined' || !performance.memory) return;

      const memory = performance.memory;
      const usage: ResourceUsage = {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: memory.jsHeapSizeLimit - memory.totalJSHeapSize,
        arrayBuffers: 0 // Will be calculated if available
      };

      const usageRatio = usage.heapUsed / usage.heapTotal;
      
      if (usageRatio >= resourceManager.criticalThreshold) {
        console.warn('Critical memory usage detected, cleaning up...');
        cleanupResources(true);
      } else if (usageRatio >= resourceManager.warningThreshold) {
        console.warn('High memory usage detected, cleaning up...');
        cleanupResources(false);
      }

      setResourceUsage(usage);
    };

    const interval = setInterval(monitorResources, MEMORY_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [resourceManager]);

  // Add resource cleanup function
  const cleanupResources = useCallback((aggressive: boolean) => {
    // Clear old historical data
    if (metrics?.historical) {
      const maxPoints = aggressive ? MAX_HISTORICAL_POINTS / 2 : MAX_HISTORICAL_POINTS;
      const cleanedHistorical = {
        cpuUsage: downSampleData(metrics.historical.cpuUsage, maxPoints),
        memoryUsage: downSampleData(metrics.historical.memoryUsage, maxPoints),
        diskUsage: downSampleData(metrics.historical.diskUsage, maxPoints),
        networkTraffic: downSampleData(metrics.historical.networkTraffic, maxPoints)
      };

      setMetrics(prev => prev ? {
        ...prev,
        historical: cleanedHistorical
      } : null);
    }

    // Clear error logs if too many
    if (errorData.length > MAX_ERROR_LOGS) {
      setErrorData(prev => prev.slice(-MAX_ERROR_LOGS));
    }

    // Clear old cache entries
    const now = Date.now();
    if (now - metricsCache.timestamp > 30 * 60 * 1000) { // 30 minutes
      setMetricsCache({ data: null, timestamp: 0, timeRange: { startTime: 0, endTime: 0 } });
    }
    if (now - aggregatedCache.timestamp > 15 * 60 * 1000) { // 15 minutes
      setAggregatedCache({ 
        data: { updateTimes: [], latency: [], memoryUsage: [] }, 
        timestamp: 0, 
        interval: 0 
      });
    }

    // Clear unused chart data
    if (drillDownData && now - drillDownData.startTime > 24 * 60 * 60 * 1000) { // 24 hours
      setDrillDownData(null);
    }

    // Force garbage collection if available
    if (typeof window.gc === 'function') {
      try {
        window.gc();
      } catch (e) {
        console.warn('Failed to force garbage collection:', e);
      }
    }
  }, [metrics, errorData, metricsCache, aggregatedCache, drillDownData]);

  // Update component cleanup
  useEffect(() => {
    return () => {
      // Clear all data on unmount
      setMetrics(null);
      setMetricsCache({ data: null, timestamp: 0, timeRange: { startTime: 0, endTime: 0 } });
      setAggregatedCache({ data: { updateTimes: [], latency: [], memoryUsage: [] }, timestamp: 0, interval: 0 });
      setHistoricalData([]);
      setErrorData([]);
      setDrillDownData(null);
      setResourceUsage(null);
      setNetworkCache({ version: CACHE_VERSION, data: {} });
      
      // Clear all intervals and timeouts
      const intervals = [
        CLEANUP_INTERVAL,
        MEMORY_CHECK_INTERVAL,
        updateConfig.minInterval,
        CACHE_TTL,
        ...metricConfig.map(m => m.refreshInterval)
      ];
      intervals.forEach(clearInterval);
      
      // Clear all subscriptions and connections
      if (gameMetricsMonitor) {
        gameMetricsMonitor.unsubscribeAll();
      }
      wsManager.current.disconnect();
      
      // Terminate worker
      metricsWorker.terminate();
    };
  }, [metricConfig, updateConfig.minInterval]);

  // Add request batching
  const batchRequest = useCallback(<T,>(type: string, params: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      setPendingBatch(prev => ({
        timestamp: Date.now(),
        requests: [...prev.requests, { type, params, resolve, reject }]
      }));

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      batchTimeoutRef.current = setTimeout(async () => {
        const currentBatch = pendingBatch;
        if (currentBatch.requests.length === 0) return;

        // Reset batch
        setPendingBatch({ timestamp: Date.now(), requests: [] });

        try {
          // Group requests by type
          const groupedRequests = currentBatch.requests.reduce((acc, req) => {
            if (!acc[req.type]) acc[req.type] = [];
            acc[req.type].push(req);
            return acc;
          }, {} as Record<string, typeof currentBatch.requests>);

          // Process each group
          for (const [type, requests] of Object.entries(groupedRequests)) {
            // Split into chunks if needed
            const chunks = [];
            for (let i = 0; i < requests.length; i += MAX_BATCH_SIZE) {
              chunks.push(requests.slice(i, i + MAX_BATCH_SIZE));
            }

            // Process chunks
            for (const chunk of chunks) {
              const params = chunk.map(r => r.params);
              try {
                const results = await processBatchRequest(type, params);
                chunk.forEach((req, index) => req.resolve(results[index]));
              } catch (error) {
                chunk.forEach(req => req.reject(error));
              }
            }
          }
        } catch (error) {
          currentBatch.requests.forEach(req => req.reject(error));
        }
      }, REQUEST_BATCH_DELAY);
    });
  }, [pendingBatch]);

  // Add batch request processor
  const processBatchRequest = async (type: string, params: any[]): Promise<any[]> => {
    switch (type) {
      case 'metrics':
        return await gameMetricsMonitor.batchGetMetrics(params);
      case 'alerts':
        return await gameMetricsMonitor.batchGetAlerts(params);
      case 'errors':
        return await gameMetricsMonitor.batchGetErrors(params);
      default:
        throw new Error(`Unknown batch request type: ${type}`);
    }
  };

  // Add request debouncing
  const debouncedFetchMetrics = useCallback(
    debounce(async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      
      // Add dynamic delay based on response times
      const minDelay = updateConfig.minInterval;
      if (timeSinceLastRequest < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
      }

      try {
        await fetchMetrics();
        lastRequestTime.current = Date.now();
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    }, REQUEST_BATCH_DELAY),
    [fetchMetrics, updateConfig.minInterval]
  );

  // Update metrics fetching to use batching and debouncing
  useEffect(() => {
    debouncedFetchMetrics();
    const interval = setInterval(debouncedFetchMetrics, updateConfig.minInterval);
    return () => {
      clearInterval(interval);
      debouncedFetchMetrics.cancel();
    };
  }, [debouncedFetchMetrics, updateConfig.minInterval]);

  // Add cleanup for batch timeout
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  // Update fetchMetrics to use enhanced worker and compression
  const fetchMetrics = useCallback(async () => {
    try {
      const timeRange = getTimeRangeInMs();
      const now = Date.now();
      
      // Check memory usage before fetching
      if (resourceUsage && (resourceUsage.heapUsed / resourceUsage.heapTotal) > resourceManager.warningThreshold) {
        cleanupResources(false);
      }
      
      // Check if cache is valid
      const isCacheValid = 
        metricsCache.data &&
        now - metricsCache.timestamp < 60000 &&
        metricsCache.timeRange.startTime === timeRange.startTime &&
        metricsCache.timeRange.endTime === timeRange.endTime;

      if (isCacheValid) {
        setMetrics(metricsCache.data);
        return;
      }

      // Request historical data through WebSocket
      wsManager.current.send('getHistoricalMetrics', {
        timeRange,
        metrics: metricConfig.filter(m => m.enabled).map(m => m.id)
      });

      // Use batched request for initial data
      const snapshot = await batchRequest<MetricsSnapshot>('metrics', {
        timeRange,
        metrics: metricConfig.filter(m => m.enabled).map(m => m.id)
      });

      // Process data in worker with compression
      const processedData = await new Promise<MetricsSnapshot>((resolve) => {
        const id = Date.now().toString();
        workerCallbacks.current.set(id, (response) => {
          resolve(response.compressed ? decompressData(response.data) : response.data);
        });
        metricsWorker.postMessage({
          id,
          type: 'processMetrics',
          data: {
            snapshot,
            maxPoints: MAX_HISTORICAL_POINTS
          }
        });
      });

      setMetrics(processedData);
      setMetricsCache({
        data: processedData,
        timestamp: now,
        timeRange
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setMetricsCache({ data: null, timestamp: 0, timeRange: { startTime: 0, endTime: 0 } });
    }
  }, [
    metricsCache,
    getTimeRangeInMs,
    resourceUsage,
    resourceManager.warningThreshold,
    cleanupResources,
    batchRequest,
    metricConfig
  ]);

  // Add debounce utility
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T & { cancel: () => void } {
    let timeout: NodeJS.Timeout | null = null;
    
    const debounced = (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        func(...args);
      }, wait);
    };

    debounced.cancel = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    return debounced as T & { cancel: () => void };
  }

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

  const calculateTrendAnalysis = useCallback((data: MetricData[]): Promise<TrendAnalysis> => {
    return new Promise((resolve) => {
      const id = Date.now().toString();
      workerCallbacks.current.set(id, resolve);
      metricsWorker.postMessage({
        id,
        type: 'calculateTrend',
        data: {
          points: data,
          chunkSize: WORKER_CHUNK_SIZE
        }
      });
    });
  }, []);

  const handleMetricClick = async (metricId: string, dataPoint: MetricData) => {
    if (!metrics) return;

    const timeRange = getTimeRangeInMs();
    // Calculate weekly trend from historical data
    const historicalData = metrics.historical.cpuUsage.filter(
      (m) => m.timestamp >= timeRange.startTime && m.timestamp <= timeRange.endTime
    );

    const trendAnalysis = await calculateTrendAnalysis(historicalData.map(m => ({
      timestamp: m.timestamp,
      value: m.value,
      label: m.label
    })));

    setDrillDownData({
      metricId,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      data: historicalData.map(m => ({
        timestamp: m.timestamp,
        value: m.value,
        label: m.label
      })),
      statistics: calculateStatistics(historicalData.map(m => ({
        timestamp: m.timestamp,
        value: m.value,
        label: m.label
      }))),
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
    const errorUnsubscribe = gameMetricsMonitor.subscribeToErrors((error: MonitoringErrorEvent) => {
      const { startTime, endTime } = getTimeRangeInMs();
      if (error.timestamp >= startTime && error.timestamp <= endTime) {
        setErrorCount((prev) => prev + 1);
        // Track the error in our error tracking system
        errorTracker.trackError(
          new Error(error.message || 'Unknown error'),
          {
            componentStack: error.stack || ''
          }
        );
      }
    });

    // Get initial counts
    const fetchInitialCounts = async () => {
      const { startTime, endTime } = getTimeRangeInMs();
      const snapshot = await gameMetricsMonitor.getMetricsSnapshot();
      setAlertCount(
        snapshot.alerts?.filter(
          (a) => !a.acknowledged && a.timestamp >= startTime && a.timestamp <= endTime
        ).length || 0
      );
      setErrorCount(
        snapshot.errorData?.filter(
          (e) => e.timestamp >= startTime && e.timestamp <= endTime
        ).length || 0
      );
    };
    fetchInitialCounts();

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
    const applyRetentionPolicy = async () => {
      if (retentionConfig.autoCleanup) {
        const now = Date.now();
        const snapshot = await gameMetricsMonitor.getMetricsSnapshot();
        const metrics = snapshot.current;

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
      }
    };
    applyRetentionPolicy();
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
    const checkThresholds = async () => {
      const metrics = await gameMetricsMonitor.getMetricsSnapshot();
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
          gameMetricsMonitor.addAlert(
            breach.level === 'critical' ? 'error' : 'warning',
            `${metricConfig.find((m) => m.id === breach.metric)?.name} threshold breach: ${breach.value}`
          );
        }
      });
    };

    checkThresholds();
  }, [thresholds, gameMetricsMonitor]);

  const handleAlertAcknowledge = (alert: Alert) => {
    gameMetricsMonitor.acknowledgeAlert(alert.id, alert.details?.acknowledgeNote);
    setAlertCount((prev) => Math.max(0, prev - 1));
  };

  const handleErrorClick = (error: MonitoringErrorEvent) => {
    setSelectedError(error);
    // Track the error in our error tracking system with additional context
    errorTracker.trackError(
      new Error(error.message || 'Unknown error'),
      {
        componentStack: error.stack || '',
      }
    );
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    // Reset count when viewing the tab
    if (newValue === 0) setAlertCount(0);
    if (newValue === 2) setErrorCount(0);
  };

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    const { startTime, endTime } = getTimeRangeInMs();
    const snapshot = await gameMetricsMonitor.getMetricsSnapshot();

    const exportData: ExportData = {
      metrics: {
        cpuUsage: snapshot.historical.cpuUsage,
        memoryUsage: snapshot.historical.memoryUsage,
        diskUsage: snapshot.historical.diskUsage,
        networkTraffic: snapshot.historical.networkTraffic
      },
      correlations: correlationData ? [correlationData] : [],
      thresholds,
      alerts: snapshot.alerts,
      errors: snapshot.errorData,
      timestamp: Date.now()
    };

    switch (format) {
      case 'csv':
        switch (selectedTab) {
          case 0: // Alerts
            exportToCSV(
              snapshot.alerts.filter(a => a.timestamp >= startTime && a.timestamp <= endTime),
              'alerts'
            );
            break;
          case 1: // Metrics
            exportToCSV(
              Object.entries(exportData.metrics).map(([key, data]) => ({
                metric: key,
                data: data.filter(d => d.timestamp >= startTime && d.timestamp <= endTime)
              })),
              'metrics'
            );
            break;
          case 2: // Errors
            exportToCSV(
              snapshot.errorData.filter(e => e.timestamp >= startTime && e.timestamp <= endTime),
              'errors'
            );
            break;
        }
        break;

      case 'json':
        exportToJSON(exportData, `monitoring_data_${new Date().toISOString()}`);
        break;

      case 'pdf':
        await exportToPDF(exportData, `monitoring_report_${new Date().toISOString()}`);
        break;
    }
  };

  const createSnapshot = async () => {
    const { startTime, endTime } = getTimeRangeInMs();
    const metrics = await gameMetricsMonitor.getMetricsSnapshot();

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

  // Update the handleDragEnd function
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = metricConfig.findIndex((item) => item.id === active.id);
      const newIndex = metricConfig.findIndex((item) => item.id === over.id);
      
      const newConfig = arrayMove(metricConfig, oldIndex, newIndex).map(
        (item, index) => ({ ...item, order: index })
      );
      
      setMetricConfig(newConfig);
    }
  };

  // Add virtualized metric list component
  const VirtualizedMetricList = ({ items, renderItem }: { 
    items: MetricConfig[], 
    renderItem: (item: MetricConfig) => React.ReactNode 
  }) => {
    return (
      <Virtuoso
        style={{ height: '60vh' }}
        totalCount={items.length}
        itemContent={index => renderItem(items[index])}
        overscan={5}
      />
    );
  };

  // Update renderMetricConfigDialog
  const renderMetricConfigDialog = () => (
    <Dialog 
      open={showMetricConfig} 
      onClose={() => setShowMetricConfig(false)} 
      maxWidth="md" 
      fullWidth
      TransitionProps={{
        timeout: 300,
      }}
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555',
            },
          },
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6">Metric Configuration</Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ flex: 1 }}>
            Drag metrics to reorder them
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Changes are saved automatically">
              <IconButton size="small" color="primary">
                <InfoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View configuration help">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => setShowConfigHelp(true)}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {/* Search and Filter Section */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={8}>
              <TextField
                fullWidth
                size="small"
                label="Search metrics"
                value={metricSearchQuery}
                onChange={(e) => setMetricSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: metricSearchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setMetricSearchQuery('')}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by status</InputLabel>
                <Select
                  value={metricTypeFilter}
                  onChange={(e) => setMetricTypeFilter(e.target.value as typeof metricTypeFilter)}
                  label="Filter by status"
                >
                  <MenuItem value="all">All metrics</MenuItem>
                  <MenuItem value="enabled">Enabled only</MenuItem>
                  <MenuItem value="disabled">Disabled only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => setMetricConfig(prev => 
                prev.map(m => ({ ...m, enabled: true }))
              )}
            >
              Enable All
            </Button>
            <Button
              size="small"
              startIcon={<VisibilityOffIcon />}
              onClick={() => setMetricConfig(prev => 
                prev.map(m => ({ ...m, enabled: false }))
              )}
            >
              Disable All
            </Button>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => setMetricConfig(prev => 
                prev.map(m => ({ ...m, refreshInterval: DEFAULT_UPDATE_CONFIG.minInterval }))
              )}
            >
              Reset Intervals
            </Button>
          </Stack>
        </Box>

        {/* Replace List with VirtualizedMetricList */}
        <DndContext
          sensors={useSensors(
            useSensor(PointerSensor, {
              activationConstraint: {
                distance: 5,
                delay: 100,
              },
            }),
            useSensor(KeyboardSensor, {
              coordinateGetter: sortableKeyboardCoordinates,
            })
          )}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={() => {
            if (window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }}
        >
          <SortableContext
            items={filteredMetrics.map(config => config.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredMetrics.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No metrics found matching your search criteria
                </Typography>
              </Box>
            ) : (
              <VirtualizedMetricList
                items={filteredMetrics}
                renderItem={(config) => (
                  <SortableItem key={config.id} id={config.id}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item>
                        <Tooltip title="Drag to reorder">
                          <ListItemIcon 
                            sx={{ 
                              cursor: 'grab',
                              color: 'primary.main',
                              '&:hover': {
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <DragIcon />
                          </ListItemIcon>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={3}>
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle1">{config.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {config.id}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.enabled}
                              onChange={(e) =>
                                setMetricConfig(
                                  metricConfig.map((item) =>
                                    item.id === config.id
                                      ? { ...item, enabled: e.target.checked }
                                      : item
                                  )
                                )
                              }
                              color="primary"
                            />
                          }
                          label={
                            <Typography 
                              variant="body2" 
                              color={config.enabled ? 'primary' : 'text.secondary'}
                            >
                              {config.enabled ? 'Enabled' : 'Disabled'}
                            </Typography>
                          }
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Chart Type</InputLabel>
                          <Select
                            value={config.chartType}
                            onChange={(e) =>
                              setMetricConfig(
                                metricConfig.map((item) =>
                                  item.id === config.id
                                    ? { ...item, chartType: e.target.value as 'line' | 'bar' | 'pie' }
                                    : item
                                )
                              )
                            }
                          >
                            <MenuItem value="line">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <TrendLineIcon fontSize="small" color="primary" />
                                <span>Line</span>
                              </Stack>
                            </MenuItem>
                            <MenuItem value="bar">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <BarChartIcon fontSize="small" color="primary" />
                                <span>Bar</span>
                              </Stack>
                            </MenuItem>
                            <MenuItem value="pie">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <PieChartIcon fontSize="small" color="primary" />
                                <span>Pie</span>
                              </Stack>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          type="number"
                          label="Refresh Interval"
                          value={config.refreshInterval}
                          onChange={(e) =>
                            setMetricConfig(
                              metricConfig.map((item) =>
                                item.id === config.id
                                  ? { ...item, refreshInterval: parseInt(e.target.value) }
                                  : item
                              )
                            )
                          }
                          size="small"
                          fullWidth
                          InputProps={{
                            endAdornment: <InputAdornment position="end">ms</InputAdornment>,
                            inputProps: {
                              min: 1000,
                              max: 60000,
                              step: 1000,
                            }
                          }}
                          helperText={`${config.refreshInterval / 1000}s`}
                        />
                      </Grid>
                    </Grid>
                  </SortableItem>
                )}
              />
            )}
          </SortableContext>
        </DndContext>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Button 
            onClick={() => setMetricConfig(DEFAULT_METRIC_CONFIG)}
            color="inherit"
            startIcon={<RestoreIcon />}
          >
            Reset to Default
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button 
            onClick={() => setShowMetricConfig(false)}
            variant="contained"
          >
            Close
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );

  const renderConfigHelpDialog = () => (
    <Dialog 
      open={showConfigHelp} 
      onClose={() => setShowConfigHelp(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <HelpIcon color="primary" />
          <Typography variant="h6">Configuration Help</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={4} sx={{ mt: 2 }}>
          {CONFIG_HELP_SECTIONS.map((section, index) => (
            <Box key={index}>
              <Typography variant="h6" color="primary" gutterBottom>
                {section.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {section.description}
              </Typography>
              <List>
                {section.tips.map((tip, tipIndex) => (
                  <ListItem key={tipIndex}>
                    <ListItemIcon>
                      <InfoIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={tip} />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowConfigHelp(false)} variant="contained">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Add filtered metrics computation
  const filteredMetrics = useMemo(() => {
    return metricConfig
      .filter(config => {
        const matchesSearch = 
          config.name.toLowerCase().includes(metricSearchQuery.toLowerCase()) ||
          config.id.toLowerCase().includes(metricSearchQuery.toLowerCase());
        
        const matchesFilter = 
          metricTypeFilter === 'all' ||
          (metricTypeFilter === 'enabled' && config.enabled) ||
          (metricTypeFilter === 'disabled' && !config.enabled);
        
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => a.order - b.order);
  }, [metricConfig, metricSearchQuery, metricTypeFilter]);

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = `ws://${window.location.host}/api/metrics`;
    wsManager.current.connect(wsUrl);

    // Subscribe to real-time updates
    const unsubscribeMetrics = wsManager.current.subscribe('metrics', (data) => {
      setMetrics(prev => ({
        ...prev,
        ...data
      }));
    });

    const unsubscribeAlerts = wsManager.current.subscribe('alerts', (data) => {
      handleAlertUpdate(data);
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
      wsManager.current.disconnect();
    };
  }, []);

  // Add worker message handler
  useEffect(() => {
    const handleWorkerMessage = (event: MessageEvent) => {
      const { id, data } = event.data;
      const callback = workerCallbacks.current.get(id);
      if (callback) {
        callback(data);
        workerCallbacks.current.delete(id);
      }
    };

    metricsWorker.addEventListener('message', handleWorkerMessage);
    return () => {
      metricsWorker.removeEventListener('message', handleWorkerMessage);
    };
  }, []);

  // Update trend analysis to use worker
  const calculateTrendAnalysis = useCallback((data: MetricData[]): Promise<TrendAnalysis> => {
    return new Promise((resolve) => {
      const id = Date.now().toString();
      workerCallbacks.current.set(id, resolve);
      metricsWorker.postMessage({
        id,
        type: 'calculateTrend',
        data: {
          points: data,
          chunkSize: WORKER_CHUNK_SIZE
        }
      });
    });
  }, []);

  // Update fetchMetrics to use WebSocket for real-time data
  const fetchMetrics = useCallback(async () => {
    try {
      const timeRange = getTimeRangeInMs();
      const now = Date.now();
      
      // Check memory usage before fetching
      if (resourceUsage && (resourceUsage.heapUsed / resourceUsage.heapTotal) > resourceManager.warningThreshold) {
        cleanupResources(false);
      }

      // Check if cache is valid
      const isCacheValid = 
        metricsCache.data &&
        now - metricsCache.timestamp < 60000 &&
        metricsCache.timeRange.startTime === timeRange.startTime &&
        metricsCache.timeRange.endTime === timeRange.endTime;

      if (isCacheValid) {
        setMetrics(metricsCache.data);
        return;
      }

      // Request historical data through WebSocket
      wsManager.current.send('getHistoricalMetrics', {
        timeRange,
        metrics: metricConfig.filter(m => m.enabled).map(m => m.id)
      });

      // Use batched request for initial data
      const snapshot = await batchRequest<MetricsSnapshot>('metrics', {
        timeRange,
        metrics: metricConfig.filter(m => m.enabled).map(m => m.id)
      });

      // Process data in worker
      const processedData = await new Promise<MetricsSnapshot>((resolve) => {
        const id = Date.now().toString();
        workerCallbacks.current.set(id, resolve);
        metricsWorker.postMessage({
          id,
          type: 'processMetrics',
          data: {
            snapshot,
            maxPoints: MAX_HISTORICAL_POINTS
          }
        });
      });

      setMetrics(processedData);
      setMetricsCache({
        data: processedData,
        timestamp: now,
        timeRange
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setMetricsCache({ data: null, timestamp: 0, timeRange: { startTime: 0, endTime: 0 } });
    }
  }, [
    metricsCache,
    getTimeRangeInMs,
    resourceUsage,
    resourceManager.warningThreshold,
    cleanupResources,
    batchRequest,
    metricConfig
  ]);

  // Add dynamic import for heavy components
  const loadAnalyticsComponents = useCallback(async () => {
    const [
      { default: AnalyticsChart },
      { default: CorrelationMatrix },
      { default: AnomalyDetector }
    ] = await Promise.all([
      import('./analytics/AnalyticsChart'),
      import('./analytics/CorrelationMatrix'),
      import('./analytics/AnomalyDetector')
    ]);

    return {
      AnalyticsChart,
      CorrelationMatrix,
      AnomalyDetector
    };
  }, []);

  return (
    <ErrorBoundary>
      <Box sx={{ width: '100%', height: '100%' }} id="monitoring-dashboard">
        <Suspense fallback={<CircularProgress />}>
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

            {/* Updated renderMetricsChart */}
            {renderMetricsChart()}
          </Stack>
        </Suspense>
        <Suspense fallback={null}>
          {showMetricConfig && renderMetricConfigDialog()}
          {showConfigHelp && <ConfigHelpDialog onClose={() => setShowConfigHelp(false)} />}
        </Suspense>
      </Box>
    </ErrorBoundary>
  );
};
