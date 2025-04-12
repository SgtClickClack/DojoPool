import { EventEmitter } from 'events';
import { ShotData } from './ShotAnalysisService';
import { ShotPerformanceAnalyzer, ShotAnalysis } from './ShotPerformanceAnalyzer';

export interface FeedbackMessage {
  type: 'technique' | 'power' | 'accuracy' | 'spin' | 'success';
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: number;
}

export class ShotFeedbackService extends EventEmitter {
  private analyzer: ShotPerformanceAnalyzer;
  private feedbackHistory: FeedbackMessage[] = [];
  private readonly HISTORY_LIMIT = 100;

  constructor() {
    super();
    this.analyzer = new ShotPerformanceAnalyzer();
  }

  /**
   * Process a new shot and generate feedback
   */
  public processShot(shot: ShotData): void {
    // Add shot to analyzer for pattern analysis
    this.analyzer.addShot(shot);

    // Generate immediate feedback
    const analysis = this.analyzer.analyzeSingleShot(shot);
    this.generateFeedback(shot, analysis);
  }

  /**
   * Generate feedback messages based on shot analysis
   */
  private generateFeedback(shot: ShotData, analysis: ShotAnalysis): void {
    // Technique feedback
    this.addFeedback({
      type: 'technique',
      message: `Technique: ${analysis.technique}`,
      severity: 'info',
      timestamp: shot.timestamp
    });

    // Power feedback
    if (shot.power > 0.8 && shot.accuracy < 0.7) {
      this.addFeedback({
        type: 'power',
        message: 'Power too high for current accuracy level',
        severity: 'warning',
        timestamp: shot.timestamp
      });
    }

    // Accuracy feedback
    if (shot.accuracy < 0.6) {
      this.addFeedback({
        type: 'accuracy',
        message: 'Focus on fundamental stance and alignment',
        severity: 'warning',
        timestamp: shot.timestamp
      });
    }

    // Spin feedback
    if (Math.abs(shot.spin.side) > 0.7) {
      this.addFeedback({
        type: 'spin',
        message: 'High side spin may reduce consistency',
        severity: 'warning',
        timestamp: shot.timestamp
      });
    }

    // Success feedback
    this.addFeedback({
      type: 'success',
      message: shot.success ? 'Great shot!' : 'Try again with these adjustments',
      severity: shot.success ? 'info' : 'warning',
      timestamp: shot.timestamp
    });

    // Emit feedback event
    this.emit('feedbackGenerated', this.feedbackHistory[this.feedbackHistory.length - 1]);
  }

  /**
   * Add feedback to history and emit event
   */
  private addFeedback(feedback: FeedbackMessage): void {
    this.feedbackHistory.unshift(feedback);
    if (this.feedbackHistory.length > this.HISTORY_LIMIT) {
      this.feedbackHistory.pop();
    }
  }

  /**
   * Get recent feedback history
   */
  public getRecentFeedback(limit: number = 10): FeedbackMessage[] {
    return this.feedbackHistory.slice(0, limit);
  }

  /**
   * Get feedback by type
   */
  public getFeedbackByType(type: FeedbackMessage['type']): FeedbackMessage[] {
    return this.feedbackHistory.filter(feedback => feedback.type === type);
  }

  /**
   * Clear feedback history
   */
  public clearFeedbackHistory(): void {
    this.feedbackHistory = [];
    this.emit('feedbackCleared');
  }
} 