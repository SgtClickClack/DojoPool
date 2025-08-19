export interface AdvancedAnalysisSession {
  id: string;
  focusArea: string;
  performance: number;
  date: string;
  duration: number;
  mentalGameScore: number;
  tacticalScore: number;
  physicalScore: number;
  notes?: string;
  recommendations?: string[];
  exercises: string[];
}
