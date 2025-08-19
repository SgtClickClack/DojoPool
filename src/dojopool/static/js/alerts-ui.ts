export interface Alert {
  level: 'critical' | 'warning';
  metric: string;
  value: number;
  threshold: {
    min?: number;
    max?: number;
    message: string;
  };
  message: string;
  timestamp: number;
}

class AlertsUI {
  private container: HTMLDivElement;
  private activeAlerts: Map<string, HTMLDivElement>;

  constructor() {
    this.container = this.createAlertContainer();
    this.activeAlerts = new Map();
    document.body.appendChild(this.container);
  }

  private createAlertContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'performance-alerts';
    container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            width: 300px;
            max-height: 80vh;
            overflow-y: auto;
            font-family: Arial, sans-serif;
        `;
    return container;
  }

  public showAlert(alert: Alert): void {
    const alertKey = `${alert.level}:${alert.metric}`;

    // Don't create duplicate alerts
    if (this.activeAlerts.has(alertKey)) {
      this.updateAlert(alertKey, alert);
      return;
    }

    const alertElement = document.createElement('div');
    alertElement.className = `performance-alert ${alert.level}`;
    alertElement.dataset.alertKey = alertKey;
    alertElement.style.cssText = `
            margin-bottom: 10px;
            padding: 12px;
            border-radius: 4px;
            background-color: ${alert.level === 'critical' ? '#fee2e2' : '#fff3cd'};
            border: 1px solid ${alert.level === 'critical' ? '#fecaca' : '#ffeeba'};
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: opacity 0.3s ease;
        `;

    const title = document.createElement('div');
    title.style.cssText = `
            font-weight: bold;
            margin-bottom: 5px;
            color: ${alert.level === 'critical' ? '#dc2626' : '#856404'};
        `;
    title.textContent = `${alert.level === 'critical' ? '🚨' : '⚠️'} ${alert.message}`;
    alertElement.appendChild(title);

    const details = document.createElement('div');
    details.style.cssText = 'font-size: 0.9em; color: #666;';
    details.textContent = `Current value: ${alert.value.toFixed(2)}`;
    alertElement.appendChild(details);

    const timestamp = document.createElement('div');
    timestamp.style.cssText = 'font-size: 0.8em; color: #888; margin-top: 5px;';
    timestamp.textContent = new Date(alert.timestamp).toLocaleTimeString();
    alertElement.appendChild(timestamp);

    this.container.insertBefore(alertElement, this.container.firstChild);
    this.activeAlerts.set(alertKey, alertElement);

    // Animate in
    alertElement.style.opacity = '0';
    setTimeout(() => (alertElement.style.opacity = '1'), 10);
  }

  public updateAlert(alertKey: string, alert: Alert): void {
    const alertElement = this.activeAlerts.get(alertKey);
    if (!alertElement) return;

    const details = alertElement.querySelector('div:nth-child(2)');
    if (details) {
      details.textContent = `Current value: ${alert.value.toFixed(2)}`;
    }

    const timestamp = alertElement.querySelector('div:nth-child(3)');
    if (timestamp) {
      timestamp.textContent = new Date(alert.timestamp).toLocaleTimeString();
    }
  }

  public removeAlert(alertKey: string): void {
    const alertElement = this.activeAlerts.get(alertKey);
    if (!alertElement) return;

    // Animate out
    alertElement.style.opacity = '0';
    setTimeout(() => {
      if (alertElement.parentNode === this.container) {
        this.container.removeChild(alertElement);
      }
      this.activeAlerts.delete(alertKey);
    }, 300);
  }

  public clearAlerts(): void {
    this.activeAlerts.clear();
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
}

// Create and export singleton instance
const alertsUI = new AlertsUI();
export default alertsUI;
