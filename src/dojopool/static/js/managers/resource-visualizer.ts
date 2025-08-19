import { BaseManager } from './base-manager';
import { type WebGLResourceStats } from './webgl-profiler';

export interface ResourceVisualizerOptions {
  container: HTMLElement;
  size?: number;
  refreshRate?: number;
}

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

export class ResourceVisualizer extends BaseManager<ResourceVisualizer> {
  private readonly container: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly size: number;
  private refreshInterval?: number;
  private data: {
    webgl?: PieChartData[];
    memory?: PieChartData[];
    workers?: PieChartData[];
  } = {};
  private readonly colors = {
    // WebGL resources
    textures: '#FF4081',
    buffers: '#00BCD4',
    shaders: '#FFC107',
    programs: '#4CAF50',
    // Memory segments
    used: '#F44336',
    free: '#4CAF50',
    reserved: '#FFC107',
    // Worker states
    active: '#4CAF50',
    idle: '#9E9E9E',
    queued: '#FFC107',
    error: '#F44336',
    // General
    text: '#FFFFFF',
    background: '#1E1E1E',
  };

  protected constructor(options: ResourceVisualizerOptions) {
    super();
    this.container = options.container;
    this.size = options.size || 200;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size * 3; // Space for 3 pie charts
    this.canvas.height = this.size;
    this.container.appendChild(this.canvas);

    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;

    if (options.refreshRate) {
      this.startAutoRefresh(options.refreshRate);
    }
  }

  public static override getInstance(
    options: ResourceVisualizerOptions
  ): ResourceVisualizer {
    return (
      BaseManager.getInstance.call(ResourceVisualizer) ||
      new ResourceVisualizer(options)
    );
  }

  public updateWebGLResources(stats: WebGLResourceStats): void {
    const total = Object.values(stats).reduce((sum, val) => sum + val, 0);
    this.data.webgl = [
      { label: 'Textures', value: stats.textures, color: this.colors.textures },
      { label: 'Buffers', value: stats.buffers, color: this.colors.buffers },
      { label: 'Shaders', value: stats.shaders, color: this.colors.shaders },
      { label: 'Programs', value: stats.programs, color: this.colors.programs },
    ].filter((item) => item.value > 0);

    this.draw();
  }

  public updateMemoryUsage(used: number, total: number): void {
    const free = total - used;
    const reserved = total * 0.1; // Assume 10% is reserved for system
    this.data.memory = [
      { label: 'Used', value: used, color: this.colors.used },
      { label: 'Free', value: free, color: this.colors.free },
      { label: 'Reserved', value: reserved, color: this.colors.reserved },
    ];

    this.draw();
  }

  public updateWorkerStatus(
    active: number,
    idle: number,
    queued: number,
    errors: number
  ): void {
    this.data.workers = [
      { label: 'Active', value: active, color: this.colors.active },
      { label: 'Idle', value: idle, color: this.colors.idle },
      { label: 'Queued', value: queued, color: this.colors.queued },
      { label: 'Errors', value: errors, color: this.colors.error },
    ].filter((item) => item.value > 0);

    this.draw();
  }

  private draw(): void {
    const ctx = this.ctx;

    // Clear canvas
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw WebGL resources pie chart
    if (this.data.webgl) {
      this.drawPieChart(
        this.data.webgl,
        this.size / 2,
        this.size / 2,
        this.size * 0.4,
        'WebGL Resources'
      );
    }

    // Draw memory usage pie chart
    if (this.data.memory) {
      this.drawPieChart(
        this.data.memory,
        this.size * 1.5,
        this.size / 2,
        this.size * 0.4,
        'Memory Usage'
      );
    }

    // Draw worker status pie chart
    if (this.data.workers) {
      this.drawPieChart(
        this.data.workers,
        this.size * 2.5,
        this.size / 2,
        this.size * 0.4,
        'Worker Status'
      );
    }
  }

  private drawPieChart(
    data: PieChartData[],
    centerX: number,
    centerY: number,
    radius: number,
    title: string
  ): void {
    const ctx = this.ctx;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = -Math.PI / 2;

    // Draw title
    ctx.fillStyle = this.colors.text;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, centerX, centerY - radius - 10);

    // Draw pie segments
    data.forEach((item) => {
      const angle = (item.value / total) * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
      ctx.closePath();

      ctx.fillStyle = item.color;
      ctx.fill();

      // Draw label line and text if segment is large enough
      if (angle > 0.15) {
        const midAngle = startAngle + angle / 2;
        const labelRadius = radius * 1.2;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;

        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(midAngle) * radius,
          centerY + Math.sin(midAngle) * radius
        );
        ctx.lineTo(labelX, labelY);
        ctx.strokeStyle = item.color;
        ctx.stroke();

        ctx.fillStyle = this.colors.text;
        ctx.font = '12px Arial';
        ctx.textAlign =
          midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'right' : 'left';
        ctx.fillText(
          `${item.label} (${Math.round((item.value / total) * 100)}%)`,
          labelX,
          labelY
        );
      }

      startAngle += angle;
    });
  }

  private startAutoRefresh(refreshRate: number): void {
    this.refreshInterval = window.setInterval(() => {
      this.draw();
    }, refreshRate);
  }

  public override cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.container.removeChild(this.canvas);
    this.data = {};
    this.onCleanup();
  }
}
