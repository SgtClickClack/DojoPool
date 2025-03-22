import { Schema, model, Document, CallbackWithoutResultAndOptionalError } from 'mongoose';

export interface IAlertHistory extends Document {
  type: 'regression' | 'violation' | 'warning';
  metric: string;
  value: number;
  threshold?: number;
  percentChange?: number;
  baselineValue?: number;
  timestamp: Date;
  status: 'open' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  resolvedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  resolution?: string;
  notificationsSent: {
    email: boolean;
    slack: boolean;
    sns: boolean;
  };
  impactScore: number;
  tags: string[];
  relatedAlerts: string[];
  metadata: Record<string, any>;
}

const AlertHistorySchema = new Schema<IAlertHistory>({
  type: {
    type: String,
    required: true,
    enum: ['regression', 'violation', 'warning']
  },
  metric: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: Number,
    required: true
  },
  threshold: Number,
  percentChange: Number,
  baselineValue: Number,
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'acknowledged', 'resolved'],
    default: 'open',
    index: true
  },
  acknowledgedBy: String,
  resolvedBy: String,
  acknowledgedAt: Date,
  resolvedAt: Date,
  resolution: String,
  notificationsSent: {
    email: {
      type: Boolean,
      default: false
    },
    slack: {
      type: Boolean,
      default: false
    },
    sns: {
      type: Boolean,
      default: false
    }
  },
  impactScore: {
    type: Number,
    required: true,
    index: true,
    default: 0
  },
  tags: [{
    type: String,
    index: true
  }],
  relatedAlerts: [{
    type: Schema.Types.ObjectId,
    ref: 'AlertHistory'
  }],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for common queries
AlertHistorySchema.index({ 'type': 1, 'status': 1 });
AlertHistorySchema.index({ 'metric': 1, 'timestamp': -1 });
AlertHistorySchema.index({ 'impactScore': -1, 'timestamp': -1 });

// Calculate impact score before saving
AlertHistorySchema.pre<IAlertHistory>('save', function(this: IAlertHistory, next: CallbackWithoutResultAndOptionalError): void {
  if (this.isNew || this.isModified('value') || this.isModified('threshold')) {
    let score = 0;
    
    // Base score by alert type
    switch (this.type) {
      case 'regression':
        score += 3;
        break;
      case 'violation':
        score += 2;
        break;
      case 'warning':
        score += 1;
        break;
    }

    // Add score based on threshold breach percentage
    if (this.threshold && this.value > this.threshold) {
      const breachPercentage = ((this.value - this.threshold) / this.threshold) * 100;
      score += Math.min(5, breachPercentage / 20); // Cap at 5 points
    }

    // Add score based on regression percentage
    if (this.percentChange) {
      score += Math.min(5, this.percentChange / 20); // Cap at 5 points
    }

    this.impactScore = Math.round(score * 10) / 10; // Round to 1 decimal place
  }
  next();
});

// Virtual for time-to-acknowledge
AlertHistorySchema.virtual('timeToAcknowledge').get(function(this: IAlertHistory): number | null {
  if (this.acknowledgedAt && this.timestamp) {
    return this.acknowledgedAt.getTime() - this.timestamp.getTime();
  }
  return null;
});

// Virtual for time-to-resolve
AlertHistorySchema.virtual('timeToResolve').get(function(this: IAlertHistory): number | null {
  if (this.resolvedAt && this.timestamp) {
    return this.resolvedAt.getTime() - this.timestamp.getTime();
  }
  return null;
});

export const AlertHistory = model<IAlertHistory>('AlertHistory', AlertHistorySchema); 