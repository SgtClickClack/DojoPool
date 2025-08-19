class DebugPanel {
  constructor() {
    this.panel = this.createPanel();
    this.metrics = {
      networkQuality: 'unknown',
      bandwidthUsage: 0,
      loadedImages: 0,
      totalBandwidth: 0,
      averageLoadTime: 0,
      webpSupport: false,
      failedLoads: 0,
    };
    this.initializePanel();
  }

  createPanel() {
    const panel = document.createElement('div');
    panel.className = 'debug-panel';
    panel.innerHTML = `
            <div class="debug-header">
                <h3>Performance Monitor</h3>
                <button class="debug-toggle">_</button>
            </div>
            <div class="debug-content">
                <div class="metric-group">
                    <h4>Network</h4>
                    <div class="metric" data-metric="networkQuality">
                        <label>Quality:</label>
                        <span>Unknown</span>
                    </div>
                    <div class="metric" data-metric="bandwidthUsage">
                        <label>Bandwidth Usage:</label>
                        <span>0 KB/s</span>
                    </div>
                </div>
                <div class="metric-group">
                    <h4>Images</h4>
                    <div class="metric" data-metric="loadedImages">
                        <label>Loaded:</label>
                        <span>0</span>
                    </div>
                    <div class="metric" data-metric="totalBandwidth">
                        <label>Total Size:</label>
                        <span>0 KB</span>
                    </div>
                    <div class="metric" data-metric="averageLoadTime">
                        <label>Avg Load Time:</label>
                        <span>0ms</span>
                    </div>
                    <div class="metric" data-metric="failedLoads">
                        <label>Failed Loads:</label>
                        <span>0</span>
                    </div>
                </div>
                <div class="metric-group">
                    <h4>Features</h4>
                    <div class="metric" data-metric="webpSupport">
                        <label>WebP Support:</label>
                        <span>Checking...</span>
                    </div>
                </div>
                <div class="optimization-log">
                    <h4>Optimization Log</h4>
                    <div class="log-entries"></div>
                </div>
            </div>
        `;
    document.body.appendChild(panel);
    return panel;
  }

  initializePanel() {
    // Toggle panel visibility
    const toggle = this.panel.querySelector('.debug-toggle');
    const content = this.panel.querySelector('.debug-content');
    toggle.addEventListener('click', () => {
      content.classList.toggle('collapsed');
      toggle.textContent = content.classList.contains('collapsed') ? '+' : '_';
    });

    // Initialize event listeners
    this.initializeEventListeners();

    // Check WebP support
    this.checkWebPSupport();
  }

  initializeEventListeners() {
    // Listen for bandwidth optimization events
    window.addEventListener('bandwidthOptimization', (event) => {
      const { recommendations, stats } = event.detail;
      this.updateMetrics({
        bandwidthUsage: this.formatBandwidth(stats.bandwidth),
        totalBandwidth: this.formatSize(stats.totalUsage),
        averageLoadTime: `${Math.round(stats.averageLoadTime)}ms`,
      });
      this.logOptimization(recommendations);
    });

    // Listen for image load events
    window.addEventListener('imageLoadComplete', (event) => {
      const { success, size, loadTime } = event.detail;
      this.metrics.loadedImages += success ? 1 : 0;
      this.metrics.failedLoads += success ? 0 : 1;
      this.updateMetrics(this.metrics);
    });

    // Listen for network quality changes
    window.addEventListener('networkQualityChange', (event) => {
      this.updateMetrics({
        networkQuality: event.detail.quality,
      });
    });
  }

  async checkWebPSupport() {
    const webpData =
      'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    try {
      const blob = await fetch(webpData).then((r) => r.blob());
      const supported = await createImageBitmap(blob).then(
        () => true,
        () => false
      );
      this.updateMetrics({
        webpSupport: supported ? 'Supported' : 'Not Supported',
      });
    } catch (e) {
      this.updateMetrics({ webpSupport: 'Not Supported' });
    }
  }

  updateMetrics(newMetrics) {
    Object.assign(this.metrics, newMetrics);
    Object.entries(newMetrics).forEach(([key, value]) => {
      const metric = this.panel.querySelector(`[data-metric="${key}"] span`);
      if (metric) {
        metric.textContent = value;
      }
    });
  }

  logOptimization(recommendations) {
    const logEntries = this.panel.querySelector('.log-entries');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            <ul>
                ${recommendations.map((rec) => `<li>${rec}</li>`).join('')}
            </ul>
        `;
    logEntries.insertBefore(entry, logEntries.firstChild);

    // Keep only last 10 entries
    while (logEntries.children.length > 10) {
      logEntries.removeChild(logEntries.lastChild);
    }
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  formatBandwidth(bytesPerSecond) {
    return `${this.formatSize(bytesPerSecond)}/s`;
  }
}

// Initialize and export instance
const debugPanel = new DebugPanel();
export default debugPanel;
