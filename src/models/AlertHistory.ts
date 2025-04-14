import { Schema, model, Document } from 'mongoose';
import { AlertSeverity, AlertStatus } from '../monitoring/types';

/**
 * Interface representing an alert history document in the database.
 */
export interface IAlertHistoryDocument extends Document {
  /** Unique identifier for the alert */
  alertId: string;
  /** Timestamp when the alert was created */
  timestamp: Date;
  /** Severity level of the alert */
  severity: AlertSeverity;
  /** Alert message content */
  message: string;
  /** Source component that generated the alert */
  source: string;
  /** Whether the alert has been acknowledged */
  acknowledged: boolean;
  /** User who acknowledged the alert */
  acknowledgedBy?: string;
  /** Timestamp when the alert was acknowledged */
  acknowledgedAt?: Date;
  /** Whether the alert has been resolved */
  resolved: boolean;
  /** Timestamp when the alert was resolved */
  resolvedAt?: Date;
  /** Additional metadata associated with the alert */
  metadata: Record<string, unknown>;
  /** Whether this is a new document */
  isNew: boolean;
  /** Check if a specific path has been modified */
  isModified(path: string): boolean;
}

const alertHistorySchema = new Schema<IAlertHistoryDocument>({
  alertId: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  severity: { 
    type: String, 
    required: true,
    enum: Object.values(AlertSeverity),
    index: true 
  },
  message: { type: String, required: true },
  source: { type: String, required: true, index: true },
  acknowledged: { type: Boolean, default: false, index: true },
  acknowledgedBy: { type: String },
  acknowledgedAt: { type: Date },
  resolved: { type: Boolean, default: false, index: true },
  resolvedAt: { type: Date },
  metadata: { type: Schema.Types.Mixed }
});

/**
 * Pre-save middleware to automatically set timestamps when alerts are acknowledged or resolved.
 */
alertHistorySchema.pre<IAlertHistoryDocument>('save', function(this: IAlertHistoryDocument, next: () => void): void {
  const now = new Date();
  
  if (this.isNew || this.isModified('acknowledged')) {
    if (this.acknowledged && !this.acknowledgedAt) {
      this.acknowledgedAt = now;
    }
  }
  
  if (this.isNew || this.isModified('resolved')) {
    if (this.resolved && !this.resolvedAt) {
      this.resolvedAt = now;
    }
  }
  
  next();
});

export const AlertHistory = model<IAlertHistoryDocument>('AlertHistory', alertHistorySchema); 