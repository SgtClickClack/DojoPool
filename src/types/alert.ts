export enum AlertType {
  ERROR = "error",
  WARNING = "warning",
  SUCCESS = "success",
  INFO = "info",
}

export enum AlertStatus {
  OPEN = "open",
  ACKNOWLEDGED = "acknowledged",
  DISMISSED = "dismissed",
}

export interface Alert {
  id: string;
  type: AlertType;
  status: AlertStatus;
  message: string;
  timestamp: string;
  isFlagged: boolean;
  metadata?: Record<string, any>;
}

export interface AlertUpdate {
  id: string;
  status?: AlertStatus;
  metadata?: Record<string, any>;
  resolvedBy?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}
