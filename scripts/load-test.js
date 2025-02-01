import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
export const gameStartupTime = new Trend('game_startup_time');
export const gameplayLatency = new Trend('gameplay_latency');
export const matchmakingTime = new Trend('matchmaking_time');

// Base URL configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:80';

// Test configuration with reduced load for initial testing
export const options = {
  stages: [
    { duration: '1m', target: 5 },    // Start with 5 users
    { duration: '2m', target: 5 },    // Stay at 5 users
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '2m', target: 10 },   // Stay at 10 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],  // 95% of requests should be below 2s
    'http_req_failed': ['rate<0.1'],      // Error rate should be below 10%
    'game_startup_time': ['avg<5000'],     // Average game startup time should be below 5s
    'gameplay_latency': ['avg<100'],       // Average gameplay latency should be below 100ms
    'matchmaking_time': ['avg<30000'],     // Average matchmaking time should be below 30s
  },
  noConnectionReuse: false,
  userAgent: 'DojoPool Load Test/1.0',
};

// Test setup - runs once per VU
export function setup() {
  console.log(`Starting test setup... Using API URL: ${BASE_URL}`);
  
  // Register a test user
  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    username: 'loadtester',
    email: 'loadtest@dojopool.com',
    password: 'loadtest123'
  }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '30s',
  });

  console.log(`Register response status: ${registerRes.status}`);
  console.log(`Register response body: ${registerRes.body}`);

  // Login to get auth token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'loadtest@dojopool.com',
    password: 'loadtest123'
  }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '30s',
  });

  console.log(`Login response status: ${loginRes.status}`);
  console.log(`Login response body: ${loginRes.body}`);

  check(loginRes, {
    'login successful': (r) => r.status === 200 || r.status === 302,
  });

  // Get session cookie
  const cookies = loginRes.cookies;
  const sessionCookie = cookies['session'];

  return { cookies: { session: sessionCookie } };
}

// Main test function
export default function(data) {
  const headers = {
    'Cookie': `session=${data.cookies.session}`,
    'Content-Type': 'application/json',
  };

  // Start game session
  console.log('Starting game session...');
  const startTime = new Date();
  const gameSessionRes = http.post(`${BASE_URL}/game`, JSON.stringify({
    opponent_id: 2,
    game_type: '8ball'
  }), {
    headers: headers,
    timeout: '30s',
  });
  const startupDuration = new Date() - startTime;
  gameStartupTime.add(startupDuration);
  console.log(`Game startup time: ${startupDuration}ms`);

  console.log(`Game session response status: ${gameSessionRes.status}`);
  console.log(`Game session response body: ${gameSessionRes.body}`);

  check(gameSessionRes, {
    'game session created': (r) => r.status === 201,
  });

  if (gameSessionRes.status === 201) {
    const gameId = gameSessionRes.json('id');

    // Simulate gameplay actions
    console.log('Simulating gameplay actions...');
    for (let i = 0; i < 5; i++) {
      const actionStartTime = new Date();
      const actionRes = http.put(`${BASE_URL}/game/${gameId}`, JSON.stringify({
        status: 'in_progress',
        score: `${i}-${5-i}`
      }), {
        headers: headers,
        timeout: '30s',
      });
      const actionDuration = new Date() - actionStartTime;
      gameplayLatency.add(actionDuration);
      console.log(`Action ${i + 1} latency: ${actionDuration}ms`);

      console.log(`Action ${i + 1} response status: ${actionRes.status}`);
      console.log(`Action ${i + 1} response body: ${actionRes.body}`);

      check(actionRes, {
        'game action successful': (r) => r.status === 200,
      });

      sleep(Math.random() * 2 + 1); // Random delay between actions (1-3 seconds)
    }

    // End game session
    console.log('Ending game session...');
    const endRes = http.put(`${BASE_URL}/game/${gameId}`, JSON.stringify({
      status: 'completed',
      winner_id: 1, // Using 1 since we don't have access to current_user.id
      score: '5-3'
    }), {
      headers: headers,
      timeout: '30s',
    });

    console.log(`End session response status: ${endRes.status}`);
    console.log(`End session response body: ${endRes.body}`);

    check(endRes, {
      'game session ended': (r) => r.status === 200,
    });
  }

  sleep(1); // Brief pause between iterations
} 