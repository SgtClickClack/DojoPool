class AlertSystem {
    constructor() {
        this.alerts = [];
        this.history = [];
        this.maxHistory = 100;
        this.thresholds = this.getDefaultThresholds();
        this.notificationPermission = false;
        this.init();
    }

    init() {
        this.loadThresholds();
        this.requestNotificationPermission();
        this.bindEvents();
    }

    getDefaultThresholds() {
        return {
            loadTime: {
                warning: 1000,  // 1 second
                error: 3000,    // 3 seconds
                enabled: true
            },
            bandwidth: {
                warning: 2,     // 2 Mbps
                error: 1,       // 1 Mbps
                enabled: true
            },
            memory: {
                warning: 70,    // 70% usage
                error: 85,      // 85% usage
                enabled: true
            }
        };
    }

    loadThresholds() {
        const saved = localStorage.getItem('alertThresholds');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.thresholds = { ...this.getDefaultThresholds(), ...parsed };
            } catch (e) {
                console.error('Failed to load alert thresholds:', e);
                this.thresholds = this.getDefaultThresholds();
            }
        }
    }

    saveThresholds() {
        localStorage.setItem('alertThresholds', JSON.stringify(this.thresholds));
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission === 'granted';
        }
    }

    bindEvents() {
        window.addEventListener('metricsUpdate', (event) => {
            const { type, data } = event.detail;
            this.checkMetric(type, data);
        });
    }

    checkMetric(type, data) {
        const timestamp = Date.now();
        let alerts = [];

        switch (type) {
            case 'loadTime':
                if (this.thresholds.loadTime.enabled) {
                    const duration = data.duration;
                    if (duration > this.thresholds.loadTime.error) {
                        alerts.push(this.createAlert('error', 'Load Time',
                            `Critical: Load time ${duration.toFixed(0)}ms exceeds ${this.thresholds.loadTime.error}ms`));
                    } else if (duration > this.thresholds.loadTime.warning) {
                        alerts.push(this.createAlert('warning', 'Load Time',
                            `Warning: Load time ${duration.toFixed(0)}ms exceeds ${this.thresholds.loadTime.warning}ms`));
                    }
                }
                break;

            case 'bandwidth':
                if (this.thresholds.bandwidth.enabled) {
                    const speed = data.current;
                    if (speed < this.thresholds.bandwidth.error) {
                        alerts.push(this.createAlert('error', 'Bandwidth',
                            `Critical: Bandwidth ${speed.toFixed(1)}Mbps below ${this.thresholds.bandwidth.error}Mbps`));
                    } else if (speed < this.thresholds.bandwidth.warning) {
                        alerts.push(this.createAlert('warning', 'Bandwidth',
                            `Warning: Bandwidth ${speed.toFixed(1)}Mbps below ${this.thresholds.bandwidth.warning}Mbps`));
                    }
                }
                break;

            case 'memory':
                if (this.thresholds.memory.enabled) {
                    const usagePercent = (data.usage / data.limit) * 100;
                    if (usagePercent > this.thresholds.memory.error) {
                        alerts.push(this.createAlert('error', 'Memory',
                            `Critical: Memory usage ${usagePercent.toFixed(1)}% exceeds ${this.thresholds.memory.error}%`));
                    } else if (usagePercent > this.thresholds.memory.warning) {
                        alerts.push(this.createAlert('warning', 'Memory',
                            `Warning: Memory usage ${usagePercent.toFixed(1)}% exceeds ${this.thresholds.memory.warning}%`));
                    }
                }
                break;
        }

        alerts.forEach(alert => {
            this.addAlert(alert);
            this.notify(alert);
        });
    }

    createAlert(severity, category, message) {
        return {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            severity,
            category,
            message,
            timestamp: Date.now(),
            acknowledged: false
        };
    }

    addAlert(alert) {
        this.alerts.push(alert);
        this.history.push(alert);

        // Trim history if needed
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        this.dispatchAlertEvent('alertAdded', alert);
    }

    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            this.alerts = this.alerts.filter(a => a.id !== alertId);
            this.dispatchAlertEvent('alertAcknowledged', alert);
        }
    }

    notify(alert) {
        if (this.notificationPermission) {
            const notification = new Notification(`${alert.category} Alert`, {
                body: alert.message,
                icon: '/static/images/alert-icon.png',
                tag: alert.id,
                requireInteraction: alert.severity === 'error'
            });

            notification.onclick = () => {
                window.focus();
                this.acknowledgeAlert(alert.id);
                notification.close();
            };
        }
    }

    dispatchAlertEvent(type, alert) {
        window.dispatchEvent(new CustomEvent('alertUpdate', {
            detail: {
                type,
                alert,
                activeAlerts: this.getActiveAlerts(),
                alertHistory: this.getAlertHistory()
            }
        }));
    }

    getActiveAlerts() {
        return [...this.alerts];
    }

    getAlertHistory() {
        return [...this.history];
    }

    updateThreshold(category, level, value) {
        if (this.thresholds[category]) {
            this.thresholds[category][level] = value;
            this.saveThresholds();
            this.dispatchAlertEvent('thresholdUpdated', { category, level, value });
        }
    }

    setThresholdEnabled(category, enabled) {
        if (this.thresholds[category]) {
            this.thresholds[category].enabled = enabled;
            this.saveThresholds();
            this.dispatchAlertEvent('thresholdEnabled', { category, enabled });
        }
    }

    clearHistory() {
        this.history = [];
        this.dispatchAlertEvent('historyCleared', null);
    }

    resetThresholds() {
        this.thresholds = this.getDefaultThresholds();
        this.saveThresholds();
        this.dispatchAlertEvent('thresholdsReset', this.thresholds);
    }
}

// Initialize and export instance
const alertSystem = new AlertSystem();
export default alertSystem; 