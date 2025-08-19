import { useAuth } from '../hooks/useAuth';

interface TrackEventOptions {
  value?: number;
  metadata?: Record<string, any>;
}

class ExperimentTracker {
  private static instance: ExperimentTracker;
  private assignments: Map<string, string> = new Map();
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): ExperimentTracker {
    if (!ExperimentTracker.instance) {
      ExperimentTracker.instance = new ExperimentTracker();
    }
    return ExperimentTracker.instance;
  }

  public setToken(token: string) {
    this.token = token;
  }

  public async getAssignment(experimentId: string): Promise<string> {
    // Check cache first
    const cachedVariant = this.assignments.get(experimentId);
    if (cachedVariant) {
      return cachedVariant;
    }

    try {
      if (!this.token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(
        `/api/experiments/${experimentId}/assignment`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get experiment assignment');
      }

      const data = await response.json();
      this.assignments.set(experimentId, data.variant);
      return data.variant;
    } catch (error) {
      console.error('Error getting experiment assignment:', error);
      return 'control'; // Fallback to control group
    }
  }

  public async trackEvent(
    experimentId: string,
    eventType: string,
    options: TrackEventOptions = {}
  ): Promise<void> {
    try {
      if (!this.token) {
        throw new Error('No authentication token available');
      }

      const variant = await this.getAssignment(experimentId);

      const response = await fetch(`/api/experiments/${experimentId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          variant,
          event_type: eventType,
          value: options.value ?? 1,
          metadata: options.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track event');
      }
    } catch (error) {
      console.error('Error tracking experiment event:', error);
    }
  }
}

// React hook for using the experiment tracker
export function useExperiment(experimentId: string) {
  const { getToken } = useAuth();
  const tracker = ExperimentTracker.getInstance();

  const trackEvent = async (eventType: string, options?: TrackEventOptions) => {
    const token = await getToken();
    tracker.setToken(token);
    await tracker.trackEvent(experimentId, eventType, options);
  };

  const getVariant = async (): Promise<string> => {
    const token = await getToken();
    tracker.setToken(token);
    return tracker.getAssignment(experimentId);
  };

  return {
    trackEvent,
    getVariant,
  };
}

export default ExperimentTracker.getInstance();
