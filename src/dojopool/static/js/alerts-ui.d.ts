interface Alert {
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

declare class AlertsUI {
    constructor();
    showAlert(alert: Alert): void;
    updateAlert(alertKey: string, alert: Alert): void;
    removeAlert(alertKey: string): void;
    clearAlerts(): void;
}

declare const alertsUI: AlertsUI;
export default alertsUI; 