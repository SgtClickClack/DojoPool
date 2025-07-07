import performanceMetrics from "./performanceMetrics.js";
import { safeSetInnerHTML, createSafeTemplate } from '../utils/securityUtils.js';

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
    const sections = ["load-times", "bandwidth", "memory"];
    sections.forEach((section) => {
      const div = document.createElement("div");
      div.className = `metrics-section ${section}-section`;
      
      const sectionTemplate = `
                <h3>${section.replace("-", " ").toUpperCase()}</h3>
                <div class="chart-container">
                    <canvas id="${section}-chart"></canvas>
                </div>
                <div class="metrics-stats" id="${section}-stats"></div>
            `;
      
      const safeSectionHTML = createSafeTemplate(sectionTemplate, {
        section: section.replace("-", " ").toUpperCase()
      });
      
      safeSetInnerHTML(div, safeSectionHTML);
      this.container.appendChild(div);
    });

    // Add alert section
    const alertSection = document.createElement("div");
    alertSection.className = "metrics-alerts";
    safeSetInnerHTML(alertSection, '<h3>ALERTS</h3><div class="alerts-list"></div>');
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
    const ctx = document.getElementById(canvasId).getContext("2d");
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
    const stats = performanceMetrics.getLoadTimeStats();
    const chart = this.charts.get("load-times");
    const timestamp = new Date().toLocaleTimeString();

    this.updateChartData(chart, timestamp, stats.average);
    this.updateStats("load-times-stats", {
      Average: `${stats.average.toFixed(2)} ms`,
      Min: `${stats.min.toFixed(2)} ms`,
      Max: `${stats.max.toFixed(2)} ms`,
      Count: stats.count,
    });
  }

  updateBandwidthChart() {
    const stats = performanceMetrics.getBandwidthStats();
    const chart = this.charts.get("bandwidth");
    const timestamp = new Date().toLocaleTimeString();

    this.updateChartData(chart, timestamp, stats.current);
    this.updateStats("bandwidth-stats", {
      Current: `${stats.current.toFixed(2)} Mbps`,
      Average: `${stats.average.toFixed(2)} Mbps`,
    });
  }

  updateMemoryChart() {
    const stats = performanceMetrics.getMemoryStats();
    const chart = this.charts.get("memory");
    const timestamp = new Date().toLocaleTimeString();
    const usageMB = stats.current / (1024 * 1024);

    this.updateChartData(chart, timestamp, usageMB);
    this.updateStats("memory-stats", {
      Usage: `${usageMB.toFixed(2)} MB`,
      Limit: `${(stats.limit / (1024 * 1024)).toFixed(2)} MB`,
    });
  }

  updateChartData(chart, label, value) {
    const maxDataPoints = 30;

    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);

    if (chart.data.labels.length > maxDataPoints) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    chart.update("none");
  }

  updateStats(elementId, stats) {
    const container = document.getElementById(elementId);
    
    // Use safe template creation for stats
    const statsHTML = Object.entries(stats)
      .map(
        ([key, value]) => {
          const statTemplate = `<div class="stat-item"><span>${key}:</span> ${value}</div>`;
          return createSafeTemplate(statTemplate, { key, value });
        }
      )
      .join("");
    
    safeSetInnerHTML(container, statsHTML);
  }

  checkAlerts() {
    const alerts = [];
    const stats = {
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
    const memoryUsagePercent =
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
    const container = document.querySelector(".alerts-list");
    
    if (alerts.length > 0) {
      const alertsHTML = alerts
        .map(
          (alert) => {
            const alertTemplate = `
                <div class="alert alert-${alert.type}">
                    ${alert.message}
                </div>
            `;
            return createSafeTemplate(alertTemplate, {
              type: alert.type,
              message: alert.message
            });
          }
        )
        .join("");
      
      safeSetInnerHTML(container, alertsHTML);
    } else {
      safeSetInnerHTML(container, '<div class="no-alerts">No active alerts</div>');
    }
  }
}

// Initialize and export instance
const metricsDashboard = new MetricsDashboard();
export default metricsDashboard;
