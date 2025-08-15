export type AchievementType =
  | "game"
  | "tournament"
  | "social"
  | "skill"
  | "special";

export interface Achievement {
  id: number;
  name: string;
  description: string;
  type: AchievementType;
  icon_url?: string;
  points: number;
  requirements?: Record<string, any>;
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  progress: number;
  completed: boolean;
  completed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  achievement: Achievement;
}

export interface AchievementStats {
  total_achievements: number;
  completed_achievements: number;
  completion_percentage: number;
  total_points: number;
}

export interface AchievementLeaderboardEntry {
  user_id: number;
  username: string;
  total_points: number;
  completed_achievements: number;
}

export interface AchievementResponse {
  achievements: UserAchievement[];
  stats: AchievementStats;
}
