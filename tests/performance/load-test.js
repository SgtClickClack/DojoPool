import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 }, // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function () {
  // Test venue listing
  const venuesResponse = http.get(`${BASE_URL}/venues`);
  check(venuesResponse, {
    'venues status is 200': (r) => r.status === 200,
    'venues response time OK': (r) => r.timings.duration < 500,
  });

  // Test tournament listing
  const tournamentsResponse = http.get(`${BASE_URL}/tournaments`);
  check(tournamentsResponse, {
    'tournaments status is 200': (r) => r.status === 200,
    'tournaments response time OK': (r) => r.timings.duration < 500,
  });

  // Test player profile
  const playerResponse = http.get(`${BASE_URL}/players/1`);
  check(playerResponse, {
    'player status is 200': (r) => r.status === 200,
    'player response time OK': (r) => r.timings.duration < 500,
  });

  // Test game state
  const gameResponse = http.get(`${BASE_URL}/games/active`);
  check(gameResponse, {
    'game status is 200': (r) => r.status === 200,
    'game response time OK': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
