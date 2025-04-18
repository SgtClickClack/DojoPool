// Tournament test configurations
export const tournamentTestConfig = {
  format: "double_elimination",
  name: "Test Tournament",
  minPlayers: 4,
  maxPlayers: 16,
  startDate: new Date("2024-02-07T00:00:00.000Z"),
  rules: {
    matchFormat: "race_to_5",
    scoring: "standard",
    tiebreakers: ["head_to_head", "game_differential"],
  },
};

// Performance test configurations
export const loadTestConfig = {
  concurrentUsers: 1000,
  rampUpPeriod: 60, // seconds
  duration: 300, // seconds
  targetRPS: 100,
};

export const stressTestConfig = {
  concurrentUsers: 5000,
  rampUpPeriod: 120,
  duration: 600,
  targetRPS: 500,
};

export const spikeTestConfig = {
  baseConcurrentUsers: 100,
  spikeConcurrentUsers: 1000,
  spikeDuration: 30,
  totalDuration: 300,
};

export const enduranceTestConfig = {
  concurrentUsers: 500,
  duration: 86400, // 24 hours
  targetRPS: 50,
};

// Game analysis test configurations
export const gameAnalysisTestConfig = {
  numConcurrentGames: 100,
  analysisRequestsPerSecond: 50,
  duration: 600, // 10 minutes
};
