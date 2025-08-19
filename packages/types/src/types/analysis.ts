export interface AdvancedAnalysisSession {
  id: string;
  date: string;
  duration: number;
  focusArea: string;
  exercises: string[];
  performance: number;
  notes: string;
  coachRating: number;
  mentalGameScore: number;
  tacticalScore: number;
  physicalScore: number;
}

export interface SkillAssessment {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  progress: number;
  exercises: string[];
  priority: 'high' | 'medium' | 'low';
}
