import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_duration{staticAsset:yes}': ['p(95)<100'], // 95% of static asset requests should be below 100ms
    errors: ['rate<0.1'], // Error rate should be below 10%
  },
};

const BASE_URL = 'http://localhost:80'; // Using localhost with port 80

// Setup function to handle authentication
export function setup() {
  // Register a test user
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      username: 'loadtester',
      email: 'loadtest@dojopool.com',
      password: 'loadtest123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );

  // Login to get auth token
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'loadtest@dojopool.com',
      password: 'loadtest123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );

  check(loginRes, {
    'login successful': (r) => r.status === 200 || r.status === 302,
  });

  // Get session cookie
  const cookies = loginRes.cookies;
  const sessionCookie = cookies['session'];

  return { cookies: { session: sessionCookie } };
}

export default function (data) {
  const headers = {
    Cookie: `session=${data.cookies.session}`,
    'Content-Type': 'application/json',
  };

  // Test homepage load
  const homeResponse = http.get(`${BASE_URL}/`);
  check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
  });

  // Test game creation
  const gameResponse = http.post(
    `${BASE_URL}/game`,
    JSON.stringify({
      opponent_id: 2,
      game_type: '8ball',
    }),
    {
      headers: headers,
    }
  );
  check(gameResponse, {
    'game created': (r) => r.status === 201,
  });

  // Test game listing
  const gamesResponse = http.get(`${BASE_URL}/game`, {
    headers: headers,
  });
  check(gamesResponse, {
    'games list status is 200': (r) => r.status === 200,
  });

  // Test specific game access
  if (gameResponse.status === 201) {
    const gameId = gameResponse.json('id');
    const gameDetailResponse = http.get(`${BASE_URL}/game/${gameId}`, {
      headers: headers,
    });
    check(gameDetailResponse, {
      'game detail status is 200': (r) => r.status === 200,
    });

    // Test game update
    const updateResponse = http.put(
      `${BASE_URL}/game/${gameId}`,
      JSON.stringify({
        status: 'in_progress',
        score: '3-2',
      }),
      {
        headers: headers,
      }
    );
    check(updateResponse, {
      'game update status is 200': (r) => r.status === 200,
    });
  }

  // Add error rate tracking
  errorRate.add(homeResponse.status >= 400);
  errorRate.add(gameResponse.status >= 400);
  errorRate.add(gamesResponse.status >= 400);

  // Sleep between iterations to simulate real user behavior
  sleep(Math.random() * 3 + 2); // Random sleep between 2-5 seconds
}
