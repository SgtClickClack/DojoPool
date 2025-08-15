// Generated type definitions

class MetricsDashboard {
  // Properties and methods
}

interface instance {
  // Properties
}

interface metricsDashboard {
  // Properties
}

// Type imports
// TODO: Import types from ./performanceMetrics.js

import performanceMetrics from "./performanceMetrics.js";

class MetricsDashboard {
  constructor() {
    this.container = null;
    this.charts = new Map();
    this.updateInterval = 1000; // 1 second refresh
    this.init();
  }

  init() {
    this.createDashboard();
    this.initCharts();
    this.startUpdates();
    this.bindEvents();
  }

  createDashboard() {
    this.container = document.createElement("div");
    this.container.className = "metrics-dashboard";

    // Create sections for different metric types
    const sections: any = ["load-times", "bandwidth", "memory"];
    sections.forEach((section) => {
      const div: any = document.createElement("div");
      div.className = `metrics-section ${section}-section`;
      div.innerHTML = `
                <h3>${section.replace("-", " ").toUpperCase()}</h3>
                <div class="chart-container">
                    <canvas id="${section}-chart"></canvas>
                </div>
                <div class="metrics-stats" id="${section}-stats"></div>
            `;
      this.container.appendChild(div);
    });

    // Add alert section
    const alertSection: any = document.createElement("div");
    alertSection.className = "metrics-alerts";
    alertSection.innerHTML = '<h3>ALERTS</h3><div class="alerts-list"></div>';
    this.container.appendChild(alertSection);

    document.body.appendChild(this.container);
  }

  initCharts() {
    // Load time chart
    this.charts.set(
      "load-times",
      this.createChart("load-times-chart", {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Average Load Time (ms)",
              data: [],
              borderColor: "#00ff9f",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          animation: false,
        },
      }),
    );

    // Bandwidth chart
    this.charts.set(
      "bandwidth",
      this.createChart("bandwidth-chart", {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Bandwidth (Mbps)",
              data: [],
              borderColor: "#00b8ff",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          animation: false,
        },
      }),
    );

    // Memory usage chart
    this.charts.set(
      "memory",
      this.createChart("memory-chart", {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Memory Usage (MB)",
              data: [],
              borderColor: "#ff00e4",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          animation: false,
        },
      }),
    );
  }

  createChart(canvasId, config) {
    const ctx: any = document.getElementById(canvasId).getContext("2d");
    return new Chart(ctx, config);
  }

  startUpdates() {
    setInterval(() => this.updateDashboard(), this.updateInterval);
    this.updateDashboard(); // Initial update
  }

  bindEvents() {
    window.addEventListener("metricsUpdate", (event) => {
      const { type, data } = event.detail;
      this.handleMetricsUpdate(type, data);
    });
  }

  handleMetricsUpdate(type, data) {
    switch (type) {
      case "loadTime":
        this.updateLoadTimeStats(data);
        break;
      case "bandwidth":
        this.updateBandwidthStats(data);
        break;
      case "memory":
        this.updateMemoryStats(data);
        break;
    }
  }

  updateDashboard() {
    this.updateLoadTimeChart();
    this.updateBandwidthChart();
    this.updateMemoryChart();
    this.checkAlerts();
  }

  updateLoadTimeChart() {
    const stats: any = performanceMetrics.getLoadTimeStats();
    const chart: any = this.charts.get("load-times");
    const timestamp: any = new Date().toLocaleTimeString();

    this.updateChartData(chart, timestamp, stats.average);
    this.updateStats("load-times-stats", {
      Average: `${stats.average.toFixed(2)} ms`,
      Min: `${stats.min.toFixed(2)} ms`,
      Max: `${stats.max.toFixed(2)} ms`,
      Count: stats.count,
    });
  }

  updateBandwidthChart() {
    const stats: any = performanceMetrics.getBandwidthStats();
    const chart: any = this.charts.get("bandwidth");
    const timestamp: any = new Date().toLocaleTimeString();

    this.updateChartData(chart, timestamp, stats.current);
    this.updateStats("bandwidth-stats", {
      Current: `${stats.current.toFixed(2)} Mbps`,
      Average: `${stats.average.toFixed(2)} Mbps`,
    });
  }

  updateMemoryChart() {
    const stats: any = performanceMetrics.getMemoryStats();
    const chart: any = this.charts.get("memory");
    const timestamp: any = new Date().toLocaleTimeString();
    const usageMB: any = stats.current / (1024 * 1024);

    this.updateChartData(chart, timestamp, usageMB);
    this.updateStats("memory-stats", {
      Usage: `${usageMB.toFixed(2)} MB`,
      Limit: `${(stats.limit / (1024 * 1024)).toFixed(2)} MB`,
    });
  }

  updateChartData(chart, label, value) {
    const maxDataPoints: any = 30;

    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);

    if (chart.data.labels.length > maxDataPoints) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    chart.update("none");
  }

  updateStats(elementId, stats) {
    const container: any = document.getElementById(elementId);
    container.innerHTML = Object.entries(stats)
      .map(
        ([key, value]) =>
          `<div class="stat-item"><span>${key}:</span> ${value}</div>`,
      )
      .join("");
  }

  checkAlerts() {
    const alerts: any = [];
    const stats: any = {
      loadTime: performanceMetrics.getLoadTimeStats(),
      bandwidth: performanceMetrics.getBandwidthStats(),
      memory: performanceMetrics.getMemoryStats(),
    };

    // Check load time alerts
    if (stats.loadTime.average > 1000) {
      alerts.push({
        type: "warning",
        message: `High average load time: ${stats.loadTime.average.toFixed(2)}ms`,
      });
    }

    // Check bandwidth alerts
    if (stats.bandwidth.current < 1) {
      alerts.push({
        type: "error",
        message: `Low bandwidth detected: ${stats.bandwidth.current.toFixed(2)}Mbps`,
      });
    }

    // Check memory alerts
    const memoryUsagePercent: any =
      (stats.memory.current / stats.memory.limit) * 100;
    if (memoryUsagePercent > 80) {
      alerts.push({
        type: "error",
        message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
      });
    }

    this.updateAlerts(alerts);
  }

  updateAlerts(alerts) {
    const container: any = document.querySelector(".alerts-list");
    container.innerHTML = alerts.length
      ? alerts
          .map(
            (alert) => `
                <div class="alert alert-${alert.type}">
                    ${alert.message}
                </div>
            `,
          )
          .join("")
      : '<div class="no-alerts">No active alerts</div>';
  }
}

// Initialize and export instance
const metricsDashboard: any = new MetricsDashboard();
export default metricsDashboard;
