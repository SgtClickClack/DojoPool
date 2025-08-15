import { PerformanceMonitor } from "../../config/performance";

// Scalability test thresholds
export const scalabilityThresholds = {
  // Concurrent users
  concurrentUsers: {
    min: 1000, // Minimum concurrent users
    target: 5000, // Target concurrent users
    max: 10000, // Maximum concurrent users to test
  },

  // Response times under load
  responseTimes: {
    api: {
      p50: 200, // 50th percentile (ms)
      p90: 500, // 90th percentile (ms)
      p95: 800, // 95th percentile (ms)
      p99: 1500, // 99th percentile (ms)
    },
    websocket: {
      messageLatency: 100, // Maximum WebSocket message latency (ms)
      connectionTime: 300, // Maximum WebSocket connection time (ms)
    },
    gameEvents: {
      shotAnalysis: 200, // Maximum shot analysis time (ms)
      stateUpdate: 50, // Maximum state update time (ms)
    },
  },

  // Resource utilization under load
  resourceUtilization: {
    cpu: {
      average: 0.7, // 70% average CPU usage
      peak: 0.9, // 90% peak CPU usage
    },
    memory: {
      average: 0.7, // 70% average memory usage
      peak: 0.9, // 90% peak memory usage
    },
    network: {
      bandwidth: 0.8, // 80% network bandwidth utilization
      connections: 10000, // Maximum concurrent connections
    },
    database: {
      connections: 1000, // Maximum database connections
      queryTime: 100, // Maximum query execution time (ms)
    },
  },

  // Error rates under load
  errorRates: {
    http: 0.01, // 1% HTTP error rate
    websocket: 0.005, // 0.5% WebSocket error rate
    database: 0.001, // 0.1% database error rate
  },
};

// Test scenarios
export const scalabilityScenarios = {
  // Load test scenarios
  loadTest: {
    rampUp: [
      { duration: "5m", target: 1000 }, // Ramp up to 1000 users over 5 minutes
      { duration: "10m", target: 1000 }, // Stay at 1000 users for 10 minutes
      { duration: "5m", target: 2000 }, // Ramp up to 2000 users over 5 minutes
      { duration: "10m", target: 2000 }, // Stay at 2000 users for 10 minutes
      { duration: "5m", target: 5000 }, // Ramp up to 5000 users over 5 minutes
      { duration: "10m", target: 5000 }, // Stay at 5000 users for 10 minutes
      { duration: "5m", target: 0 }, // Ramp down to 0 users over 5 minutes
    ],
    thresholds: {
      http_req_duration: ["p(95)<800"],
      ws_connection_time: ["p(95)<300"],
      game_event_duration: ["p(95)<200"],
    },
  },

  // Stress test scenarios
  stressTest: {
    rampUp: [
      { duration: "5m", target: 5000 }, // Ramp up to 5000 users over 5 minutes
      { duration: "10m", target: 5000 }, // Stay at 5000 users for 10 minutes
      { duration: "5m", target: 7500 }, // Ramp up to 7500 users over 5 minutes
      { duration: "10m", target: 7500 }, // Stay at 7500 users for 10 minutes
      { duration: "5m", target: 10000 }, // Ramp up to 10000 users over 5 minutes
      { duration: "10m", target: 10000 }, // Stay at 10000 users for 10 minutes
      { duration: "5m", target: 0 }, // Ramp down to 0 users over 5 minutes
    ],
    thresholds: {
      http_req_duration: ["p(99)<1500"],
      ws_connection_time: ["p(99)<500"],
      game_event_duration: ["p(99)<400"],
    },
  },

  // Spike test scenarios
  spikeTest: {
    rampUp: [
      { duration: "1m", target: 1000 }, // Quick ramp up to 1000 users
      { duration: "2m", target: 1000 }, // Hold at 1000 users
      { duration: "1m", target: 10000 }, // Sudden spike to 10000 users
      { duration: "2m", target: 10000 }, // Hold at 10000 users
      { duration: "1m", target: 1000 }, // Quick drop to 1000 users
      { duration: "2m", target: 1000 }, // Hold at 1000 users
      { duration: "1m", target: 0 }, // Ramp down to 0
    ],
    thresholds: {
      http_req_duration: ["p(99)<2000"],
      ws_connection_time: ["p(99)<1000"],
      game_event_duration: ["p(99)<800"],
    },
  },

  // Endurance test scenarios
  enduranceTest: {
    rampUp: [
      { duration: "10m", target: 2000 }, // Ramp up to 2000 users over 10 minutes
      { duration: "4h", target: 2000 }, // Stay at 2000 users for 4 hours
      { duration: "10m", target: 0 }, // Ramp down to 0 users over 10 minutes
    ],
    thresholds: {
      http_req_duration: ["p(95)<800", "p(99)<1500"],
      ws_connection_time: ["p(95)<300", "p(99)<500"],
      game_event_duration: ["p(95)<200", "p(99)<400"],
    },
  },
};

// Resource monitoring configuration
export const resourceMonitoring = {
  // Metrics collection intervals
  intervals: {
    system: 10000, // System metrics every 10 seconds
    application: 5000, // Application metrics every 5 seconds
    database: 30000, // Database metrics every 30 seconds
  },

  // Metric aggregation windows
  aggregation: {
    shortTerm: 60000, // 1 minute window
    mediumTerm: 300000, // 5 minute window
    longTerm: 3600000, // 1 hour window
  },

  // Alert thresholds
  alerts: {
    cpu: {
      warning: 0.7, // 70% utilization
      critical: 0.9, // 90% utilization
    },
    memory: {
      warning: 0.7, // 70% utilization
      critical: 0.9, // 90% utilization
    },
    disk: {
      warning: 0.8, // 80% utilization
      critical: 0.95, // 95% utilization
    },
    network: {
      warning: 0.7, // 70% utilization
      critical: 0.9, // 90% utilization
    },
  },
};

// Test data generation configuration
export const testDataConfig = {
  // User simulation
  users: {
    count: 10000, // Number of test users
    concurrentSessions: 5000, // Maximum concurrent sessions
    actionsPerSecond: 100, // Actions per second per user
  },

  // Game simulation
  games: {
    count: 1000, // Number of concurrent games
    eventsPerSecond: 50, // Game events per second
    playersPerGame: 2, // Players per game
  },

  // Tournament simulation
  tournaments: {
    count: 100, // Number of concurrent tournaments
    playersPerTournament: 32, // Players per tournament
    matchesPerHour: 100, // Matches per hour
  },
};

// Export performance monitor instance
export const monitor = PerformanceMonitor.getInstance();
