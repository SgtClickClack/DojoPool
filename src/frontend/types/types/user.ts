// Temporarily disabled - stub types for user
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  skillLevel: number;
  achievements: Achievement[];
}

export interface UserPreferences {
  email: boolean;
  push: boolean;
  trainingReminders: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  name: string;
  description: string;
  unlockedAt?: string;
}
