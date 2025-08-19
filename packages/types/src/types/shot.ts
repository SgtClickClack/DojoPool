export interface ShotData {
  timestamp: number;
  ballPositions: {
    cueBall: { x: number; y: number };
    targetBall: { x: number; y: number };
  };
  shotType: string;
  power: number;
  spin: {
    top: number;
    side: number;
  };
  success: boolean;
  accuracy: number;
  // Additional properties for compatibility
  cueBall?: { x: number; y: number };
  targetBall?: { x: number; y: number };
  english?: { top: number; side: number };
}

export interface ShotAnalysis {
  id: string;
  shotData: ShotData;
  analysis: {
    strength: number;
    technique: string;
    recommendations: string[];
  };
  timestamp: string;
}

export interface ShotMetrics {
  totalShots: number;
  successfulShots: number;
  accuracy: number;
  averagePower: number;
  commonShotTypes: string[];
}
