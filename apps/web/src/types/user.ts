export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  skillLevel: SkillLevel;
  achievements: Achievement[];
  stats: UserStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  totalPoints: number;
  averagePoints: number;
  bestGame: number;
  longestWinStreak: number;
  currentWinStreak: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: AchievementRarity;
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  MASTER = 'master',
}

// Export individual enum values for use in other files
export const { BEGINNER, INTERMEDIATE, ADVANCED, EXPERT, MASTER } = SkillLevel;

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

// Export individual enum values for use in other files
export const { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY } = AchievementRarity;
