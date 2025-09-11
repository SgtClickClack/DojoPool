import { SkillCategory } from '@prisma/client';

export class SkillPointCalculationDto {
  playerId!: string;
  matchId!: string;
  skillPoints!: SkillPointAwardDto[];
  totalPointsAwarded!: number;
  calculationTimestamp!: Date;
}

export class SkillPointAwardDto {
  skillId!: string;
  skillName!: string;
  category!: SkillCategory;
  points!: number;
  reason!: string;
  confidence!: number; // 0-100, how confident the AI analysis is
  metadata!: {
    matchContext: string;
    playerPerformance: string;
    analysisSource: string;
  };
}

export class MatchAnalysisContextDto {
  matchId!: string;
  playerId!: string;
  isWinner!: boolean;
  score!: number;
  opponentScore!: number;
  venueName?: string;
  matchDuration?: number;
  keyMoments!: string[];
  strategicInsights!: string[];
  playerPerformance!: string;
  overallAssessment!: string;
  recommendations!: string[];
}
