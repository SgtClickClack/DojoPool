//
Training;
Types;

export interface TrainingSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: TrainingStatus;
  type: TrainingType;
  difficulty: number;
  techniques: Technique[];
  progress: TrainingProgress;
  feedback: TrainingFeedback[];
  metrics: TrainingMetrics;
}

export type TrainingStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export type TrainingType = 'solo' | 'guided' | 'challenge' | 'assessment';

export interface Technique {
  id: string;
  name: string;
  description: string;
  style: string;
  difficulty: number;
  prerequisites: string[];
  videoUrl?: string;
  imageUrl?: string;
  instructions: string[];
  safetyNotes: string[];
}

export interface TrainingProgress {
  completedTechniques: string[];
  currentTechnique?: string;
  timeSpent: number;
  accuracy: number;
  consistency: number;
  notes: string[];
}

export interface TrainingFeedback {
  id: string;
  timestamp: Date;
  techniqueId: string;
  rating: number;
  comments: string;
  improvements: string[];
  strengths: string[];
}

export interface TrainingMetrics {
  caloriesBurned: number;
  peakHeartRate?: number;
  averageHeartRate?: number;
  intensity: number;
  duration: number;
  restPeriods: number;
  techniqueRepetitions: Record<string, number>;
}
