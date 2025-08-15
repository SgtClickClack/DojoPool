import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { NetworkMetrics } from './NetworkMetricsCollector';

interface MetricsHistory {
  timestamp: number;
  latencyAvg: number;
  latencyP95: number;
  messagesPerSecond: number;
  bytesPerSecond: number;
  activeConnections: number;
}

interface NetworkMetricsDashboardProps {
  nodeId: string;
  onAlert: (alert: { severity: 'warning' | 'error'; message: string }) => void;
}

const HISTORY_WINDOW = 300; // 5 minutes of history
const WARNING_LATENCY = 100; // 100ms
const ERROR_LATENCY = 500; // 500ms
const MIN_CONNECTIONS = 2;

export const NetworkMetricsDashboard: React.FC<NetworkMetricsDashboardProps> = ({
  nodeId,
  onAlert,
}) => {
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<NetworkMetrics | null>(null);

  useEffect(() => {
          const ws = new WebSocket(`/metrics/${nodeId}`);

    ws.onmessage = (event) => {
      const metrics: NetworkMetrics = JSON.parse(event.data);
      setCurrentMetrics(metrics);

      // Update metrics history
      setMetricsHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            timestamp: Date.now(),
            latencyAvg: metrics.latency.avg,
            latencyP95: metrics.latency.p95,
            messagesPerSecond: metrics.throughput.messagesPerSecond,
            bytesPerSecond: metrics.throughput.bytesPerSecond,
            activeConnections: metrics.connections.active,
          },
        ].slice(-HISTORY_WINDOW);

        // Check for alerts
        if (metrics.latency.avg > ERROR_LATENCY) {
          onAlert({
            severity: 'error',
            message: `High latency detected: ${metrics.latency.avg.toFixed(2)}ms`,
          });
        } else if (metrics.latency.avg > WARNING_LATENCY) {
          onAlert({
            severity: 'warning',
            message: `Elevated latency: ${metrics.latency.avg.toFixed(2)}ms`,
          });
        }

        if (metrics.connections.active < MIN_CONNECTIONS) {
          onAlert({
            severity: 'warning',
            message: `Low connection count: ${metrics.connections.active}`,
          });
        }

        return newHistory;
      });
    };

    return () => {
      ws.close();
    };
  }, [nodeId, onAlert]);

  if (!currentMetrics) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="network-metrics-dashboard">
      <h2>Network Metrics - Node {nodeId}</h2>
      
      <div className="metrics-summary">
        <div className="metric-card">
          <h3>Latency</h3>
          <div>Avg: {currentMetrics.latency.avg.toFixed(2)}ms</div>
          <div>P95: {currentMetrics.latency.p95.toFixed(2)}ms</div>
          <div>P99: {currentMetrics.latency.p99.toFixed(2)}ms</div>
        </div>

        <div className="metric-card">
          <h3>Throughput</h3>
          <div>Messages/s: {currentMetrics.throughput.messagesPerSecond.toFixed(2)}</div>
          <div>Bytes/s: {(currentMetrics.throughput.bytesPerSecond / 1024).toFixed(2)} KB/s</div>
        </div>

        <div className="metric-card">
          <h3>Connections</h3>
          <div>Active: {currentMetrics.connections.active}</div>
          <div>Total: {currentMetrics.connections.total}</div>
          <div>Failed: {currentMetrics.connections.failed}</div>
        </div>

        <div className="metric-card">
          <h3>Messages</h3>
          <div>Sent: {currentMetrics.messageStats.sent}</div>
          <div>Received: {currentMetrics.messageStats.received}</div>
          <div>Failed: {currentMetrics.messageStats.failed}</div>
        </div>

        <div className="metric-card">
          <h3>Consensus</h3>
          <div>Term: {currentMetrics.consensusHealth.termNumber}</div>
          <div>Leader Changes: {currentMetrics.consensusHealth.leaderChanges}</div>
          <div>Last Heartbeat: {new Date(currentMetrics.consensusHealth.lastLeaderHeartbeat).toLocaleTimeString()}</div>
        </div>
      </div>

      <div className="metrics-charts">
        <div className="chart">
          <h3>Latency Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(ts) => new Date(Number(ts)).toLocaleTimeString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="latencyAvg"
                name="Avg Latency"
                stroke="#8884d8"
              />
              <Line
                type="monotone"
                dataKey="latencyP95"
                name="P95 Latency"
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart">
          <h3>Throughput Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(ts) => new Date(Number(ts)).toLocaleTimeString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="messagesPerSecond"
                name="Messages/s"
                stroke="#8884d8"
              />
              <Line
                type="monotone"
                dataKey="bytesPerSecond"
                name="Bytes/s"
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style jsx>{`
        .network-metrics-dashboard {
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .metrics-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .metric-card h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .metrics-charts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 20px;
        }

        .chart {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .chart h3 {
          margin: 0 0 20px 0;
          color: #333;
        }
      `}</style>
    </div>
  );
}; 