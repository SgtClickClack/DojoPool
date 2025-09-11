import { type SkillCategory } from '@dojopool/prisma';

export class SkillProfileDto {
  id!: string;
  skillId!: string;
  skillName!: string;
  skillDescription?: string;
  category!: SkillCategory;
  iconUrl?: string;
  currentLevel!: number;
  currentPoints!: number;
  totalPoints!: number;
  proficiencyScore!: number;
  maxLevel!: number;
  pointsToNextLevel!: number;
  unlockedAt?: Date;
  lastUpdated!: Date;
}

export class SkillProgressDto {
  skillId!: string;
  skillName!: string;
  category!: SkillCategory;
  currentLevel!: number;
  currentPoints!: number;
  proficiencyScore!: number;
  recentPoints!: number;
  lastActivity!: Date;
}

export class PlayerSkillProfileDto {
  playerId!: string;
  username!: string;
  totalSkills!: number;
  averageLevel!: number;
  totalPoints!: number;
  topSkills!: SkillProgressDto[];
  recentActivity!: SkillPointLogDto[];
  skillCategories!: SkillCategoryProgressDto[];
}

export class SkillCategoryProgressDto {
  category!: SkillCategory;
  totalSkills!: number;
  averageLevel!: number;
  totalPoints!: number;
  highestSkill?: SkillProgressDto;
}

export class SkillPointLogDto {
  id!: string;
  skillId!: string;
  skillName!: string;
  points!: number;
  reason!: string;
  matchId?: string;
  createdAt!: Date;
  metadata?: any;
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

export class SkillPointAwardDto {
  skillId!: string;
  points!: number;
  reason!: string;
  metadata?: any;
}

export class SkillPointCalculationDto {
  basePoints!: number;
  multiplier!: number;
  bonusPoints!: number;
  finalPoints!: number;
  calculationReason!: string;
}
