export interface UserProfile {
    id: string;
    username: string;
    email: string;
    preferredStyle?: string;
    skillLevel: number;
    joinedAt: Date;
    lastActive: Date;
    achievements: Achievement[];
    preferences: UserPreferences;
    stats: UserStats;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    earnedAt: Date;
    category: string;
    level: number;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    notifications: NotificationPreferences;
    language: string;
    timezone: string;
    trainingReminders: boolean;
    showProgressMetrics: boolean;
}

export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    trainingReminders: boolean;
    achievements: boolean;
    leaderboardUpdates: boolean;
    newChallenges: boolean;
}

export interface UserStats {
    totalTrainingTime: number;
    sessionsCompleted: number;
    techniquesLearned: number;
    currentStreak: number;
    longestStreak: number;
    rank: number;
    points: number;
    level: number;
}
