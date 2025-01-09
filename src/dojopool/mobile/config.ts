export const API_URL = __DEV__ 
  ? 'http://localhost:5000'  // Development
  : 'https://api.dojopool.com'; // Production

export const CONFIG = {
  // API Endpoints
  endpoints: {
    auth: {
      login: '/api/v1/auth/login',
      register: '/api/v1/auth/register',
      refresh: '/api/v1/auth/refresh',
    },
    game: {
      track: {
        start: '/api/v1/games/track/start',
        stop: '/api/v1/games/track/stop',
        update: '/api/v1/games/track/update',
      },
      stats: '/api/v1/games/stats',
    },
    profile: {
      get: '/api/v1/profile',
      update: '/api/v1/profile/update',
      avatar: '/api/v1/profile/avatar',
    },
    social: {
      leaderboard: '/api/v1/social/leaderboard',
      friends: '/api/v1/social/friends',
      achievements: '/api/v1/social/achievements',
    },
  },

  // App Settings
  settings: {
    gameTracking: {
      minFrameRate: 30,
      maxRecordingDuration: 3600, // 1 hour in seconds
      shotDetectionInterval: 500, // milliseconds
    },
    cache: {
      profileTTL: 300, // 5 minutes
      leaderboardTTL: 60, // 1 minute
    },
  },

  // Feature Flags
  features: {
    enableAIAnalysis: true,
    enableSocialFeatures: true,
    enableAchievements: true,
    enableInGameTips: true,
  },
}; 