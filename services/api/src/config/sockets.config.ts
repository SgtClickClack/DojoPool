export const SOCKET_NAMESPACES = {
  TOURNAMENTS: '/tournaments',
  WORLD_MAP: '/world-map',
  MATCHES: '/matches',
  ACTIVITY: '/activity',
  CHAT: '/chat',
  NOTIFICATIONS: '/notifications',
} as const;

// Sharding configuration for high-volume namespaces
export const SHARD_CONFIG = {
  WORLD_MAP: {
    type: 'geographic',
    shardKey: 'venueId',
    shardCount: 16, // 16 geographic shards
  },
  MATCHES: {
    type: 'user',
    shardKey: 'userId',
    shardCount: 32, // 32 user-based shards
  },
} as const;
