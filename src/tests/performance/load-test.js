import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const gameStartTrend = new Trend('game_start_duration');
const shotAnalysisTrend = new Trend('shot_analysis_duration');
const tournamentJoinTrend = new Trend('tournament_join_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
    errors: ['rate<0.05'], // Less than 5% error rate
    game_start_duration: ['p(95)<1000'], // 95% of game starts should be under 1s
    shot_analysis_duration: ['p(95)<300'], // 95% of shot analyses should be under 300ms
    tournament_join_duration: ['p(95)<800'], // 95% of tournament joins should be under 800ms
  },
};

/* eslint-disable no-undef, @typescript-eslint/no-unused-expressions */
// Simulated user behavior
export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${generateTestToken()}`,
  };

  // Group 1: User Authentication
  {
    const loginRes = http.post(
      `${baseUrl}/api/auth/login`,
      JSON.stringify({
        email: `test${__VU}@example.com`,
        password: 'testpassword',
      }),
      { headers }
    );

    check(loginRes, {
      'login successful': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  sleep(1);

  // Group 2: Game Start
  {
    const startTime = new Date();
    const gameRes = http.post(
      `${baseUrl}/api/games/start`,
      JSON.stringify({
        venueId: 'test-venue',
        tableId: 'test-table',
      }),
      { headers }
    );

    check(gameRes, {
      'game start successful': (r) => r.status === 200,
    }) || errorRate.add(1);

    gameStartTrend.add(new Date() - startTime);
  }

  sleep(2);

  // Group 3: Shot Analysis
  {
    const startTime = new Date();
    const analysisRes = http.post(
      `${baseUrl}/api/games/shot-analysis`,
      JSON.stringify({
        gameId: 'test-game',
        shotData: {
          position: { x: 0.5, y: 0.3 },
          angle: 45,
          power: 0.7,
        },
      }),
      { headers }
    );

    check(analysisRes, {
      'shot analysis successful': (r) => r.status === 200,
    }) || errorRate.add(1);

    shotAnalysisTrend.add(new Date() - startTime);
  }

  sleep(1);

  // Group 4: Tournament Operations
  {
    const startTime = new Date();
    const tournamentRes = http.post(
      `${baseUrl}/api/tournaments/join`,
      JSON.stringify({
        tournamentId: 'test-tournament',
      }),
      { headers }
    );

    check(tournamentRes, {
      'tournament join successful': (r) => r.status === 200,
    }) || errorRate.add(1);

    tournamentJoinTrend.add(new Date() - startTime);
  }

  sleep(3);

  // Group 5: Real-time Updates (WebSocket simulation)
  {
    const wsRes = http.get(`${baseUrl}/api/games/status`, { headers });
    check(wsRes, {
      'websocket connection successful': (r) => r.status === 101,
    }) || errorRate.add(1);
  }

  sleep(1);
}

// Helper function to generate test tokens
function generateTestToken() {
  return 'test-token-' + __VU;
}
