import { PerformanceSnapshot } from "../types";
import { BaseManager } from "./base-manager";
import { BudgetViolation, PerformanceBudget } from "./performance-budget";

export interface VisualizerOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  maxDataPoints?: number;
  refreshRate?: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export class PerformanceVisualizer extends BaseManager<PerformanceVisualizer> {
  private readonly container: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly width: number;
  private readonly height: number;
  private readonly maxDataPoints: number;
  private data: ChartData = { labels: [], datasets: [] };
  private refreshInterval?: number;
  private readonly colors = {
    fps: "#4CAF50",
    frameTime: "#2196F3",
    gpuTime: "#FF9800",
    memory: "#9C27B0",
    worker: "#795548",
    warning: "#FFC107",
    critical: "#F44336",
    background: "#1E1E1E",
    text: "#FFFFFF",
    grid: "#333333",
  };

  protected constructor(options: VisualizerOptions) {
    super();
    this.container = options.container;
    this.width = options.width || 800;
    this.height = options.height || 400;
    this.maxDataPoints = options.maxDataPoints || 100;

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.container.appendChild(this.canvas);

    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;

    if (options.refreshRate) {
      this.startAutoRefresh(options.refreshRate);
    }
  }

  public static override getInstance(
    options: VisualizerOptions,
  ): PerformanceVisualizer {
    return (
      BaseManager.getInstance.call(PerformanceVisualizer) ||
      new PerformanceVisualizer(options)
    );
  }

  public updateData(
    snapshot: PerformanceSnapshot,
    violations: BudgetViolation[],
    budget: PerformanceBudget,
  ): void {
    const timestamp = new Date(snapshot.timestamp).toLocaleTimeString();

    // Update labels
    this.data.labels.push(timestamp);
    if (this.data.labels.length > this.maxDataPoints) {
      this.data.labels.shift();
    }

    // Update or initialize datasets
    this.updateDataset("FPS", snapshot.fps, this.colors.fps);
    this.updateDataset(
      "Frame Time (ms)",
      snapshot.frameTime,
      this.colors.frameTime,
    );
    this.updateDataset("GPU Time (ms)", snapshot.gpuTime, this.colors.gpuTime);
    this.updateDataset(
      "Memory (MB)",
      snapshot.memoryStats.usedJSHeapSize / (1024 * 1024),
      this.colors.memory,
    );
    this.updateDataset(
      "Worker Utilization",
      snapshot.workerUtilization,
      this.colors.worker,
    );

    this.draw(violations, budget);
  }

  private updateDataset(label: string, value: number, color: string): void {
    let dataset = this.data.datasets.find((ds) => ds.label === label);
    if (!dataset) {
      dataset = { label, data: [], color };
      this.data.datasets.push(dataset);
    }

    dataset.data.push(value);
    if (dataset.data.length > this.maxDataPoints) {
      dataset.data.shift();
    }
  }

  private draw(violations: BudgetViolation[], budget: PerformanceBudget): void {
    const ctx = this.ctx;
    const padding = 40;
    const chartWidth = this.width - padding * 2;
    const chartHeight = this.height - padding * 2;

    // Clear canvas
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw grid
    this.drawGrid(padding, chartWidth, chartHeight);

    // Draw datasets
    this.data.datasets.forEach((dataset) => {
      this.drawDataset(dataset, padding, chartWidth, chartHeight);
    });

    // Draw budget thresholds
    this.drawBudgetLines(budget, padding, chartWidth, chartHeight);

    // Draw violations
    this.drawViolations(violations, padding, chartWidth, chartHeight);

    // Draw legend
    this.drawLegend(padding);

    // Draw axes labels
    this.drawAxesLabels(padding, chartWidth, chartHeight);
  }

  private drawGrid(
    padding: number,
    chartWidth: number,
    chartHeight: number,
  ): void {
    const ctx = this.ctx;
    const gridLines = 5;

    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 0.5;

    // Vertical grid lines
    for (let i = 0; i <= gridLines; i++) {
      const x = padding + (chartWidth / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }
  }

  private drawDataset(
    dataset: ChartData["datasets"][0],
    padding: number,
    chartWidth: number,
    chartHeight: number,
  ): void {
    const ctx = this.ctx;
    const points = dataset.data.map((value, index) => ({
      x: padding + (chartWidth * index) / (this.maxDataPoints - 1),
      y:
        padding +
        chartHeight -
        (chartHeight * value) / this.getMaxValue(dataset.label),
    }));

    ctx.strokeStyle = dataset.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }

  private drawBudgetLines(
    budget: PerformanceBudget,
    padding: number,
    chartWidth: number,
    chartHeight: number,
  ): void {
    const ctx = this.ctx;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = this.colors.warning;
    ctx.lineWidth = 1;

    if (budget.maxFrameTime) {
      const y =
        padding +
        chartHeight -
        (chartHeight * budget.maxFrameTime) /
          this.getMaxValue("Frame Time (ms)");
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    if (budget.minFps) {
      const y =
        padding +
        chartHeight -
        (chartHeight * budget.minFps) / this.getMaxValue("FPS");
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  private drawViolations(
    violations: BudgetViolation[],
    padding: number,
    chartWidth: number,
    chartHeight: number,
  ): void {
    const ctx = this.ctx;
    violations.forEach((violation) => {
      const index = this.data.labels.findIndex(
        (label) => new Date(violation.timestamp).toLocaleTimeString() === label,
      );
      if (index === -1) return;

      const x = padding + (chartWidth * index) / (this.maxDataPoints - 1);
      ctx.fillStyle =
        violation.severity === "critical"
          ? this.colors.critical
          : this.colors.warning;
      ctx.beginPath();
      ctx.arc(x, padding + chartHeight / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawLegend(padding: number): void {
    const ctx = this.ctx;
    const legendY = padding / 2;
    let legendX = padding;

    ctx.font = "12px Arial";
    ctx.textBaseline = "middle";

    this.data.datasets.forEach((dataset) => {
      ctx.fillStyle = dataset.color;
      ctx.fillRect(legendX, legendY - 5, 20, 10);

      ctx.fillStyle = this.colors.text;
      ctx.fillText(dataset.label, legendX + 25, legendY);

      legendX += ctx.measureText(dataset.label).width + 50;
    });
  }

  private drawAxesLabels(
    padding: number,
    chartWidth: number,
    chartHeight: number,
  ): void {
    const ctx = this.ctx;
    ctx.fillStyle = this.colors.text;
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    // X-axis labels (time)
    this.data.labels.forEach((label, index) => {
      if (index % Math.ceil(this.data.labels.length / 5) === 0) {
        const x = padding + (chartWidth * index) / (this.maxDataPoints - 1);
        ctx.fillText(label, x, this.height - padding / 2);
      }
    });

    // Y-axis labels (values)
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      const value = Math.round(
        (this.getMaxValue("Frame Time (ms)") * (5 - i)) / 5,
      );
      ctx.fillText(value.toString(), padding - 10, y);
    }
  }

  private getMaxValue(label: string): number {
    const dataset = this.data.datasets.find((ds) => ds.label === label);
    if (!dataset) return 100;

    const max = Math.max(...dataset.data);
    return Math.ceil(max * 1.2); // Add 20% padding
  }

  private startAutoRefresh(refreshRate: number): void {
    this.refreshInterval = window.setInterval(() => {
      this.draw([], {}); // Redraw with current data
    }, refreshRate);
  }

  public override cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.container.removeChild(this.canvas);
    this.data = { labels: [], datasets: [] };
    this.onCleanup();
  }
}
