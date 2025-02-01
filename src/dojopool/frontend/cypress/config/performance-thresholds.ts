export const performanceThresholds = {
  // Core Web Vitals
  webVitals: {
    lcp: 2500,    // Largest Contentful Paint (ms)
    fid: 100,     // First Input Delay (ms)
    cls: 0.1,     // Cumulative Layout Shift
  },

  // Critical Path Performance
  criticalPath: {
    gameInitialization: 3000,  // Game initialization time (ms)
    shotResponse: 100,         // Shot response time (ms)
    stateUpdate: 50,          // State update time (ms)
    turnChange: 200,          // Turn change time (ms)
  },

  // Memory Management
  memory: {
    maxSessionIncrease: 50,   // Maximum memory increase during session (MB)
    maxGameIncrease: 20,      // Maximum memory increase during game (MB)
    maxLeakThreshold: 5,      // Maximum acceptable memory leak (MB)
  },

  // Network Performance
  network: {
    maxTransferSize: 2 * 1024 * 1024,  // Maximum transfer size (2MB)
    maxRequests: 50,                   // Maximum number of requests
    cacheLoadTime: 1000,              // Maximum cache load time (ms)
  },

  // Animation Performance
  animation: {
    minFPS: 30,              // Minimum acceptable FPS
    maxFrameTime: 16,        // Maximum time per frame (ms) for 60fps
    shotAnimationDuration: 500, // Shot animation duration (ms)
  },

  // Resource Usage
  resources: {
    maxCPUUsage: 80,        // Maximum CPU usage (%)
    maxGPUUsage: 70,        // Maximum GPU usage (%)
    maxRAMUsage: 512,       // Maximum RAM usage (MB)
  },

  // API Performance
  api: {
    maxResponseTime: 300,    // Maximum API response time (ms)
    maxErrorRate: 1,         // Maximum error rate (%)
    maxRetryAttempts: 3,     // Maximum retry attempts
  },

  // Real-time Updates
  realtime: {
    maxLatency: 100,        // Maximum WebSocket latency (ms)
    maxReconnectTime: 2000, // Maximum reconnection time (ms)
    maxMessageQueue: 100,   // Maximum queued messages
  },

  // Asset Loading
  assets: {
    maxImageLoadTime: 1000, // Maximum image load time (ms)
    maxAssetSize: 500000,   // Maximum asset size (bytes)
    maxConcurrentLoads: 6,  // Maximum concurrent asset loads
  },

  // Venue Performance
  venue: {
    maxLoadTime: 2000,      // Maximum venue load time (ms)
    maxConcurrentPlayers: 50, // Maximum concurrent players
    maxSpectators: 100,     // Maximum spectators
  }
};
