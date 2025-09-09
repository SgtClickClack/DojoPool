// Standardized cache TTL values (in seconds)
export const CACHE_TTL = {
  // Short-lived cache (1-5 minutes) - for frequently changing data
  SHORT: 300, // 5 minutes
  MEDIUM_SHORT: 600, // 10 minutes

  // Medium-lived cache (5-30 minutes) - for moderately changing data
  MEDIUM: 1800, // 30 minutes
  MEDIUM_LONG: 3600, // 1 hour

  // Long-lived cache (1-24 hours) - for stable data
  LONG: 7200, // 2 hours
  LONG_EXTENDED: 14400, // 4 hours
  VERY_LONG: 86400, // 24 hours

  // Special cases
  USER_SESSION: 3600, // 1 hour for user sessions
  MARKETPLACE_ITEM: 600, // 10 minutes for marketplace items
  TOURNAMENT_BRACKET: 300, // 5 minutes for tournament brackets
  LEADERBOARD: 1800, // 30 minutes for leaderboards
  SOCIAL_FEED: 180, // 3 minutes for social feeds (more frequent updates)
  TERRITORY_STATUS: 300, // 5 minutes for territory status
  VENUE_INFO: 3600, // 1 hour for venue information
  ANALYTICS_DATA: 1800, // 30 minutes for analytics data
  NOTIFICATION_SETTINGS: 7200, // 2 hours for notification settings
} as const;

// Standardized cache key prefixes
export const CACHE_PREFIXES = {
  // User-related
  USER: 'user:',
  USER_PROFILE: 'user:profile:',
  USER_SESSION: 'user:session:',
  USER_PREFERENCES: 'user:prefs:',

  // Authentication
  AUTH: 'auth:',
  AUTH_TOKEN: 'auth:token:',
  AUTH_BLOCKLIST: 'auth:blocklist:',
  AUTH_RATE_LIMIT: 'ratelimit:',

  // Social features
  FEED: 'feed:',
  FRIENDS: 'friends:',
  SOCIAL_ACTIVITY: 'social:activity:',

  // Gaming features
  MATCH: 'match:',
  TOURNAMENT: 'tournament:',
  TOURNAMENT_BRACKET: 'tournament:bracket:',
  TOURNAMENT_STATS: 'tournament:stats:',
  LEADERBOARD: 'leaderboard:',

  // Territory and venue management
  TERRITORY: 'territory:',
  TERRITORY_STATUS: 'territory:status:',
  VENUE: 'venue:',
  VENUE_TABLES: 'venue:tables:',

  // Marketplace and economy
  MARKETPLACE: 'marketplace:',
  MARKETPLACE_ITEM: 'marketplace:item:',
  MARKETPLACE_CATEGORY: 'marketplace:category:',
  WALLET: 'wallet:',
  ECONOMY: 'economy:',

  // Notifications
  NOTIFICATION: 'notification:',
  NOTIFICATION_SETTINGS: 'notification:settings:',

  // Analytics and insights
  ANALYTICS: 'analytics:',
  INSIGHTS: 'insights:',

  // Geolocation and world features
  GEOLOCATION: 'geolocation:',
  WORLD_MAP: 'worldmap:',
  WORLD_PRESENCE: 'world:presence:',

  // Content management
  CONTENT: 'content:',
  CMS: 'cms:',

  // Chat and messaging
  CHAT: 'chat:',
  MESSAGE: 'message:',

  // AI and ML features
  AI: 'ai:',
  ML_MODEL: 'ml:model:',
} as const;

// Cache invalidation patterns for related data
export const CACHE_INVALIDATION_PATTERNS = {
  // When user data changes, invalidate related caches
  USER_UPDATE: [
    CACHE_PREFIXES.USER,
    CACHE_PREFIXES.USER_PROFILE,
    CACHE_PREFIXES.USER_PREFERENCES,
    CACHE_PREFIXES.FRIENDS,
    CACHE_PREFIXES.FEED,
  ],

  // When territory changes, invalidate related caches
  TERRITORY_UPDATE: [
    CACHE_PREFIXES.TERRITORY,
    CACHE_PREFIXES.TERRITORY_STATUS,
    CACHE_PREFIXES.VENUE,
    CACHE_PREFIXES.WORLD_MAP,
    CACHE_PREFIXES.LEADERBOARD,
  ],

  // When social activity occurs, invalidate feed caches
  SOCIAL_ACTIVITY: [
    CACHE_PREFIXES.FEED,
    CACHE_PREFIXES.SOCIAL_ACTIVITY,
    CACHE_PREFIXES.USER_PROFILE,
  ],

  // When tournament data changes, invalidate related caches
  TOURNAMENT_UPDATE: [
    CACHE_PREFIXES.TOURNAMENT,
    CACHE_PREFIXES.TOURNAMENT_BRACKET,
    CACHE_PREFIXES.TOURNAMENT_STATS,
    CACHE_PREFIXES.LEADERBOARD,
  ],

  // When marketplace data changes, invalidate related caches
  MARKETPLACE_UPDATE: [
    CACHE_PREFIXES.MARKETPLACE,
    CACHE_PREFIXES.WALLET,
    CACHE_PREFIXES.ECONOMY,
  ],
} as const;

// Cache configuration presets for common use cases
export const CACHE_PRESETS = {
  // User data - medium-long lived
  USER_DATA: {
    ttl: CACHE_TTL.MEDIUM_LONG,
    keyPrefix: CACHE_PREFIXES.USER,
  },

  // Session data - short lived
  SESSION_DATA: {
    ttl: CACHE_TTL.USER_SESSION,
    keyPrefix: CACHE_PREFIXES.USER_SESSION,
  },

  // Marketplace items - short lived due to price changes
  MARKETPLACE_ITEMS: {
    ttl: CACHE_TTL.MARKETPLACE_ITEM,
    keyPrefix: CACHE_PREFIXES.MARKETPLACE_ITEM,
  },

  // Tournament brackets - very short lived due to real-time updates
  TOURNAMENT_BRACKETS: {
    ttl: CACHE_TTL.TOURNAMENT_BRACKET,
    keyPrefix: CACHE_PREFIXES.TOURNAMENT_BRACKET,
  },

  // Social feeds - short lived for fresh content
  SOCIAL_FEEDS: {
    ttl: CACHE_TTL.SOCIAL_FEED,
    keyPrefix: CACHE_PREFIXES.FEED,
  },

  // Territory status - medium lived
  TERRITORY_DATA: {
    ttl: CACHE_TTL.TERRITORY_STATUS,
    keyPrefix: CACHE_PREFIXES.TERRITORY_STATUS,
  },

  // Venue information - long lived
  VENUE_DATA: {
    ttl: CACHE_TTL.VENUE_INFO,
    keyPrefix: CACHE_PREFIXES.VENUE,
  },

  // Leaderboards - medium lived
  LEADERBOARD_DATA: {
    ttl: CACHE_TTL.LEADERBOARD,
    keyPrefix: CACHE_PREFIXES.LEADERBOARD,
  },

  // Analytics data - medium lived
  ANALYTICS_DATA: {
    ttl: CACHE_TTL.ANALYTICS_DATA,
    keyPrefix: CACHE_PREFIXES.ANALYTICS,
  },

  // Notification settings - long lived
  NOTIFICATION_SETTINGS: {
    ttl: CACHE_TTL.NOTIFICATION_SETTINGS,
    keyPrefix: CACHE_PREFIXES.NOTIFICATION_SETTINGS,
  },
} as const;
