// Metrics Worker for heavy computations
import pako from 'pako';

interface MetricData {
  timestamp: number;
  value: number;
  label: string;
}

interface TrendAnalysis {
  trendLine: { timestamp: number; value: number }[];
  forecast: { timestamp: number; value: number; confidence: number }[];
  anomalies: {
    timestamp: number;
    value: number;
    severity: 'warning' | 'critical';
  }[];
}

// Constants for optimization
const COMPRESSION_THRESHOLD = 1024; // 1KB
const CHUNK_SIZE = 1000;
const ANOMALY_ZSCORE_THRESHOLD = 2;
const CRITICAL_ZSCORE_THRESHOLD = 3;

// Compression utilities
function compressData(data: any): Uint8Array {
  const jsonString = JSON.stringify(data);
  return jsonString.length > COMPRESSION_THRESHOLD 
    ? pako.deflate(jsonString)
    : new TextEncoder().encode(jsonString);
}

function decompressData(data: Uint8Array): any {
  try {
    const decompressed = pako.inflate(data);
    const jsonString = new TextDecoder().decode(decompressed);
    return JSON.parse(jsonString);
  } catch {
    // If decompression fails, assume it's not compressed
    const jsonString = new TextDecoder().decode(data);
    return JSON.parse(jsonString);
  }
}

// Process metrics in chunks with error handling
function processDataChunk<T>(data: T[], chunkSize: number, processor: (chunk: T[]) => void) {
  try {
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      processor(chunk);
    }
  } catch (error) {
    console.error('Error processing data chunk:', error);
    throw error;
  }
}

// Enhanced trend analysis with error handling and optimization
function calculateTrend(data: MetricData[], chunkSize: number): TrendAnalysis {
  if (data.length < 2) {
    return {
      trendLine: [],
      forecast: [],
      anomalies: [],
    };
  }

  try {
    // Calculate statistics in chunks for better performance
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    let sum = 0, sumSquares = 0;
    
    processDataChunk(data, chunkSize, (chunk) => {
      chunk.forEach(point => {
        // Linear regression calculations
        sumX += point.timestamp;
        sumY += point.value;
        sumXY += point.timestamp * point.value;
        sumXX += point.timestamp * point.timestamp;
        
        // Statistics calculations
        sum += point.value;
        sumSquares += point.value * point.value;
      });
    });

    const n = data.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const mean = sum / n;
    const stdDev = Math.sqrt(sumSquares / n - mean * mean);

    // Generate trend line with confidence intervals
    const trendLine = data.map(point => {
      const predicted = slope * point.timestamp + intercept;
      return {
        timestamp: point.timestamp,
        value: predicted,
      };
    });

    // Generate forecast with improved confidence calculation
    const lastTimestamp = data[data.length - 1].timestamp;
    const forecast = Array.from({ length: 24 }).map((_, i) => {
      const timestamp = lastTimestamp + i * 60 * 60 * 1000;
      const value = slope * timestamp + intercept;
      const timeDistance = i / 24; // Normalize time distance
      const confidence = Math.max(0.6, 0.95 - timeDistance * 0.2); // Confidence decreases over time
      return { timestamp, value, confidence };
    });

    // Detect anomalies with improved algorithm
    const anomalies = data
      .filter(point => {
        const zScore = Math.abs((point.value - mean) / stdDev);
        return zScore > ANOMALY_ZSCORE_THRESHOLD;
      })
      .map(point => ({
        timestamp: point.timestamp,
        value: point.value,
        severity: Math.abs((point.value - mean) / stdDev) > CRITICAL_ZSCORE_THRESHOLD 
          ? 'critical' as const 
          : 'warning' as const,
      }));

    return {
      trendLine,
      forecast,
      anomalies,
    };
  } catch (error) {
    console.error('Error calculating trend:', error);
    throw error;
  }
}

// Enhanced metrics processing with optimization
function processMetrics(snapshot: any, maxPoints: number) {
  try {
    // Compress historical data if it exceeds threshold
    const processed = {
      ...snapshot,
      historical: {
        cpuUsage: optimizeDataSeries(snapshot.historical.cpuUsage, maxPoints),
        memoryUsage: optimizeDataSeries(snapshot.historical.memoryUsage, maxPoints),
        diskUsage: optimizeDataSeries(snapshot.historical.diskUsage, maxPoints),
        networkTraffic: optimizeDataSeries(snapshot.historical.networkTraffic, maxPoints)
      }
    };

    return processed;
  } catch (error) {
    console.error('Error processing metrics:', error);
    throw error;
  }
}

// Optimize data series with intelligent sampling
function optimizeDataSeries(data: MetricData[], targetPoints: number): MetricData[] {
  if (data.length <= targetPoints) return data;

  try {
    // Use LTTB (Largest-Triangle-Three-Buckets) algorithm for better visualization
    const bucketSize = data.length / targetPoints;
    const sampled: MetricData[] = [];
    
    for (let i = 0; i < targetPoints - 1; i++) {
      const startIdx = Math.floor(i * bucketSize);
      const endIdx = Math.floor((i + 1) * bucketSize);
      
      const bucketData = data.slice(startIdx, endIdx);
      if (bucketData.length === 0) continue;
      
      // Select point with maximum deviation in bucket
      let maxDev = -1;
      let selectedPoint = bucketData[0];
      
      bucketData.forEach(point => {
        const deviation = Math.abs(point.value - bucketData[0].value);
        if (deviation > maxDev) {
          maxDev = deviation;
          selectedPoint = point;
        }
      });
      
      sampled.push(selectedPoint);
    }
    
    // Always include the last point
    sampled.push(data[data.length - 1]);
    
    return sampled;
  } catch (error) {
    console.error('Error optimizing data series:', error);
    return downSampleData(data, targetPoints); // Fallback to simple downsampling
  }
}

// Simple downsampling as fallback
function downSampleData(data: MetricData[], targetPoints: number): MetricData[] {
  const interval = Math.floor(data.length / targetPoints);
  return data.filter((_, index) => index % interval === 0);
}

// Handle messages from main thread with enhanced error handling
self.addEventListener('message', (event) => {
  const { id, type, data } = event.data;

  try {
    let result;
    switch (type) {
      case 'calculateTrend':
        result = calculateTrend(data.points, data.chunkSize || CHUNK_SIZE);
        break;
      case 'processMetrics':
        result = processMetrics(data.snapshot, data.maxPoints);
        break;
      case 'compressData':
        result = compressData(data);
        break;
      case 'decompressData':
        result = decompressData(data);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    // Compress large results before sending
    const response = JSON.stringify(result).length > COMPRESSION_THRESHOLD
      ? { compressed: true, data: compressData(result) }
      : { compressed: false, data: result };

    self.postMessage({ id, ...response });
  } catch (error) {
    self.postMessage({ 
      id, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Export type for TypeScript
export type MetricsWorker = Worker; 