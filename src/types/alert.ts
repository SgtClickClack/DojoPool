export type AlertType = 'ERROR' | 'WARNING' | 'SUCCESS' | 'INFO';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'DISMISSED' | 'RESOLVED';

export interface Alert {
  id: string;
  type: AlertType;
  status: AlertStatus;
  message: string;
  timestamp: string;
  impactScore: number;
  source: string;
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