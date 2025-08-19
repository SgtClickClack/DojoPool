export interface User {
  id: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
  privacySettings: {
    profileVisibility: 'public' | 'friends' | 'private';
    activityVisibility: 'public' | 'friends' | 'private';
    allowFriendRequests: boolean;
    allowMessages: boolean;
  };
  notificationSettings: {
    gameInvites: boolean;
    friendRequests: boolean;
    achievements: boolean;
    tournamentUpdates: boolean;
    marketingEmails: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
