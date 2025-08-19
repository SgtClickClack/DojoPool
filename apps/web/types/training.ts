// Temporarily disabled - stub types for training
export interface TrainingSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  techniques: string[];
  score: number;
}
