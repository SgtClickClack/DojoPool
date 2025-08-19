export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  points: number;
  category?: string;
  criteria: string;
  rarity: number;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerAchievement {
  id: string;
  playerId: string;
  achievementId: string;
  achievement: Achievement;
  dateUnlocked: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementStats {
  totalAchievements: number;
  completedAchievements: number;
  completionPercentage: number;
  totalPoints: number;
}

export interface AchievementResponse {
  achievements: PlayerAchievement[];
  stats: AchievementStats;
}
