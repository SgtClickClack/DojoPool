export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    trainingReminders: boolean;
  };
  privacy: {
    profileVisible: boolean;
    statsVisible: boolean;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}
