import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_duration{type:static}': ['p(95)<100'], // Static assets should be faster
    'http_req_duration{type:api}': ['p(95)<300'],    // API calls threshold
    errors: ['rate<0.1'],            // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Main test function
export default function () {
  // Test homepage load
  const homeRes = http.get(BASE_URL, {
    tags: { type: 'static' },
  });
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads quickly': (r) => r.timings.duration < 500,
  });
  errorRate.add(homeRes.status !== 200);

  sleep(1);

  // Test social feed API
  const feedRes = http.get(`${BASE_URL}/api/social/feed`, {
    tags: { type: 'api' },
    headers: { 'Content-Type': 'application/json' },
  });
  check(feedRes, {
    'feed status is 200': (r) => r.status === 200,
    'feed has data': (r) => r.json().length > 0,
  });
  errorRate.add(feedRes.status !== 200);

  sleep(1);

  // Test game state API
  const gameRes = http.get(`${BASE_URL}/api/games/active`, {
    tags: { type: 'api' },
    headers: { 'Content-Type': 'application/json' },
  });
  check(gameRes, {
    'game status is 200': (r) => r.status === 200,
  });
  errorRate.add(gameRes.status !== 200);

  sleep(1);

  // Test user profile API
  const profileRes = http.get(`${BASE_URL}/api/users/profile`, {
    tags: { type: 'api' },
    headers: { 'Content-Type': 'application/json' },
  });
  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
    'profile has data': (r) => r.json().username !== undefined,
  });
  errorRate.add(profileRes.status !== 200);

  sleep(1);

  // Test tournament API
  const tournamentRes = http.get(`${BASE_URL}/api/tournaments/active`, {
    tags: { type: 'api' },
    headers: { 'Content-Type': 'application/json' },
  });
  check(tournamentRes, {
    'tournament status is 200': (r) => r.status === 200,
    'tournament has data': (r) => r.json().length >= 0,
  });
  errorRate.add(tournamentRes.status !== 200);

  sleep(2);
} 