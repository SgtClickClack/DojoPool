import wsService from './websocket';
import { TrainingSession, TrainingProgress, TrainingMetrics } from '../../types/training';

export interface TrainingUpdate {
  sessionId: string;
  type: 'progress' | 'metrics' | 'feedback' | 'status';
  data: any;
  timestamp: string;
}

export interface LiveTrainingSession extends TrainingSession {
  participants: string[];
  instructorId?: string;
  isLive: boolean;
}

class RealTimeTrainingService {
  private sessionSubscriptions: Map<string, () => void> = new Map();

  public joinSession(sessionId: string, userId: string): void {
    wsService.send('training:join', { sessionId, userId });
  }

  public leaveSession(sessionId: string, userId: string): void {
    wsService.send('training:leave', { sessionId, userId });
    this.unsubscribeFromSession(sessionId);
  }

  public subscribeToSession(sessionId: string, onUpdate: (update: TrainingUpdate) => void): void {
    // Unsubscribe from previous session if exists
    this.unsubscribeFromSession(sessionId);

    const unsubscribe = wsService.subscribe('training:update', (message) => {
      if (message.payload.sessionId === sessionId) {
        onUpdate(message.payload as TrainingUpdate);
      }
    });

    this.sessionSubscriptions.set(sessionId, unsubscribe);
  }

  public unsubscribeFromSession(sessionId: string): void {
    const unsubscribe = this.sessionSubscriptions.get(sessionId);
    if (unsubscribe) {
      unsubscribe();
      this.sessionSubscriptions.delete(sessionId);
    }
  }

  public updateProgress(sessionId: string, progress: Partial<TrainingProgress>): void {
    wsService.send('training:progress', {
      sessionId,
      progress,
      timestamp: new Date().toISOString(),
    });
  }

  public updateMetrics(sessionId: string, metrics: Partial<TrainingMetrics>): void {
    wsService.send('training:metrics', {
      sessionId,
      metrics,
      timestamp: new Date().toISOString(),
    });
  }

  public sendFeedback(
    sessionId: string,
    feedback: {
      techniqueId: string;
      rating: number;
      comments?: string;
    }
  ): void {
    wsService.send('training:feedback', {
      sessionId,
      feedback,
      timestamp: new Date().toISOString(),
    });
  }

  public requestInstructorHelp(
    sessionId: string,
    details: {
      techniqueId: string;
      difficulty: string;
      question?: string;
    }
  ): void {
    wsService.send('training:help-request', {
      sessionId,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  public startLiveSession(
    sessionId: string,
    config: {
      maxParticipants?: number;
      isPrivate?: boolean;
      requiresInstructor?: boolean;
    }
  ): void {
    wsService.send('training:start-live', {
      sessionId,
      config,
      timestamp: new Date().toISOString(),
    });
  }

  public endLiveSession(sessionId: string): void {
    wsService.send('training:end-live', {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  public subscribeToLiveSessions(onUpdate: (sessions: LiveTrainingSession[]) => void): () => void {
    return wsService.subscribe('training:live-sessions', (message) => {
      onUpdate(message.payload as LiveTrainingSession[]);
    });
  }

  public sendMessage(
    sessionId: string,
    message: {
      text: string;
      type?: 'chat' | 'instruction' | 'question';
    }
  ): void {
    wsService.send('training:message', {
      sessionId,
      ...message,
      timestamp: new Date().toISOString(),
    });
  }

  public subscribeToMessages(
    sessionId: string,
    onMessage: (message: { userId: string; text: string; type: string; timestamp: string }) => void
  ): () => void {
    return wsService.subscribe('training:message', (wsMessage) => {
      if (wsMessage.payload.sessionId === sessionId) {
        onMessage(wsMessage.payload);
      }
    });
  }

  public synchronizeTime(sessionId: string): void {
    wsService.send('training:sync-time', {
      sessionId,
      clientTime: new Date().toISOString(),
    });
  }
}

// Create a singleton instance
const realTimeTrainingService = new RealTimeTrainingService();

export default realTimeTrainingService;
