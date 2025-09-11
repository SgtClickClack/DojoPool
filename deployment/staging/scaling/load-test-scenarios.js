import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const tournamentCreationRate = new Trend('tournament_creation_duration');
const purchaseRate = new Trend('purchase_duration');
const gameJoinRate = new Trend('game_join_duration');

// Test configuration
export const options = {
  scenarios: {
    // Ramp up test - gradual increase in load
    ramp_up_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
        { duration: '5m', target: 50 }, // Stay at 50 users for 5 minutes
        { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
        { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
        { duration: '2m', target: 200 }, // Ramp up to 200 users over 2 minutes
        { duration: '5m', target: 200 }, // Stay at 200 users for 5 minutes
        { duration: '2m', target: 0 }, // Ramp down to 0 users over 2 minutes
      ],
      tags: { test_type: 'ramp_up' },
    },

    // Stress test - high load for short duration
    stress_test: {
      executor: 'constant-vus',
      vus: 500,
      duration: '3m',
      tags: { test_type: 'stress' },
    },

    // Spike test - sudden traffic spikes
    spike_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 50 }, // Normal load
        { duration: '10s', target: 1000 }, // Spike to 1000 users
        { duration: '1m', target: 1000 }, // Stay at spike
        { duration: '10s', target: 50 }, // Drop back to normal
        { duration: '1m', target: 50 }, // Stay at normal
      ],
      tags: { test_type: 'spike' },
    },

    // Tournament creation stress test
    tournament_stress: {
      executor: 'constant-vus',
      vus: 100,
      duration: '2m',
      tags: { test_type: 'tournament_creation' },
    },

    // Purchase flow stress test
    purchase_stress: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 20 },
        { duration: '2m', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '2m', target: 50 },
      ],
      tags: { test_type: 'purchase_flow' },
    },
  },

  thresholds: {
    // HTTP request duration should be < 500ms for 95% of requests
    http_req_duration: ['p(95)<500'],

    // Error rate should be < 1%
    errors: ['rate<0.01'],

    // 99% of requests should be successful
    http_req_failed: ['rate<0.01'],
  },
};

// Base URL for the staging environment
const BASE_URL = __ENV.BASE_URL || 'https://staging.dojopool.com';

// Authentication tokens pool
let authTokens = [];
let currentTokenIndex = 0;

// Test data
const TEST_USERS = Array.from({ length: 1000 }, (_, i) => ({
  email: `testuser${i}@dojopool.test`,
  password: 'testpassword123',
}));

const TOURNAMENT_DATA = {
  name: 'Load Test Tournament',
  description: 'Tournament created during load testing',
  gameType: '8-ball',
  tournamentType: 'single_elimination',
  bracketType: 'elimination',
  maxParticipants: 64,
  entryFee: 100,
  prizePool: 1000,
  startDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
};

export function setup() {
  // Pre-authenticate test users
  console.log('Setting up test users...');

  for (let i = 0; i < Math.min(TEST_USERS.length, 100); i++) {
    const user = TEST_USERS[i];

    // Register user if not exists
    const registerResponse = http.post(`${BASE_URL}/api/auth/register`, {
      email: user.email,
      password: user.password,
      username: `testuser${i}`,
    });

    // Login to get token
    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
      email: user.email,
      password: user.password,
    });

    if (loginResponse.status === 200) {
      const responseBody = JSON.parse(loginResponse.body);
      if (responseBody.token) {
        authTokens.push(responseBody.token);
      }
    }

    sleep(0.1); // Small delay between registrations
  }

  console.log(`Setup complete. ${authTokens.length} users authenticated.`);
  return { authTokens };
}

function getAuthToken() {
  if (authTokens.length === 0) return null;

  const token = authTokens[currentTokenIndex % authTokens.length];
  currentTokenIndex++;
  return token;
}

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function (data) {
  const headers = getAuthHeaders();

  // Simulate different user behaviors based on VU ID
  const vuId = __VU;
  const scenario = __ENV.K6_SCENARIO;

  switch (scenario) {
    case 'tournament_creation':
      tournamentCreationTest(headers);
      break;

    case 'purchase_flow':
      purchaseFlowTest(headers);
      break;

    default:
      // Default mixed workload
      mixedWorkloadTest(headers, vuId);
      break;
  }
}

function mixedWorkloadTest(headers, vuId) {
  // Simulate typical user behavior patterns
  const behaviorPattern = vuId % 4;

  switch (behaviorPattern) {
    case 0:
      // Casual browsing user
      browseTournaments(headers);
      sleep(Math.random() * 3 + 1);
      break;

    case 1:
      // Tournament participant
      browseTournaments(headers);
      sleep(Math.random() * 2 + 0.5);
      joinTournament(headers);
      sleep(Math.random() * 5 + 2);
      break;

    case 2:
      // Store browser
      browseStore(headers);
      sleep(Math.random() * 4 + 1);
      break;

    case 3:
      // Active gamer
      browseTournaments(headers);
      sleep(Math.random() * 2 + 0.5);
      joinTournament(headers);
      sleep(Math.random() * 3 + 1);
      browseStore(headers);
      sleep(Math.random() * 2 + 1);
      break;
  }
}

function browseTournaments(headers) {
  const response = http.get(`${BASE_URL}/api/tournaments/available?limit=20`, {
    headers,
  });

  const checkResult = check(response, {
    'tournaments list status is 200': (r) => r.status === 200,
    'tournaments response time < 300ms': (r) => r.timings.duration < 300,
    'tournaments has data': (r) => JSON.parse(r.body).length >= 0,
  });

  errorRate.add(!checkResult);
}

function joinTournament(headers) {
  // Get available tournaments first
  const listResponse = http.get(
    `${BASE_URL}/api/tournaments/available?limit=1`,
    {
      headers,
    }
  );

  if (listResponse.status === 200) {
    const tournaments = JSON.parse(listResponse.body);
    if (tournaments.length > 0) {
      const tournamentId = tournaments[0].id;

      const joinResponse = http.post(
        `${BASE_URL}/api/tournaments/register`,
        JSON.stringify({
          tournamentId,
        }),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
        }
      );

      check(joinResponse, {
        'join tournament status is 200 or 409': (r) =>
          r.status === 200 || r.status === 409,
        'join tournament response time < 500ms': (r) =>
          r.timings.duration < 500,
      });
    }
  }
}

function browseStore(headers) {
  const response = http.get(`${BASE_URL}/api/storefront/products?limit=12`, {
    headers,
  });

  const checkResult = check(response, {
    'store products status is 200': (r) => r.status === 200,
    'store response time < 400ms': (r) => r.timings.duration < 400,
    'store has products': (r) => JSON.parse(r.body).length >= 0,
  });

  errorRate.add(!checkResult);
}

function tournamentCreationTest(headers) {
  const startTime = new Date().getTime();

  const response = http.post(
    `${BASE_URL}/api/tournaments/create`,
    JSON.stringify({
      ...TOURNAMENT_DATA,
      name: `${TOURNAMENT_DATA.name} - VU${__VU}`,
    }),
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    }
  );

  const duration = new Date().getTime() - startTime;
  tournamentCreationRate.add(duration);

  const checkResult = check(response, {
    'tournament creation status is 201': (r) => r.status === 201,
    'tournament creation time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!checkResult);
  sleep(Math.random() * 2 + 0.5);
}

function purchaseFlowTest(headers) {
  const startTime = new Date().getTime();

  // Get products first
  const productsResponse = http.get(
    `${BASE_URL}/api/storefront/products?limit=1`,
    {
      headers,
    }
  );

  if (productsResponse.status === 200) {
    const products = JSON.parse(productsResponse.body);
    if (products.length > 0) {
      const product = products[0];

      // Initiate purchase
      const purchaseResponse = http.post(
        `${BASE_URL}/api/payments/initiate`,
        JSON.stringify({
          userId: 'test-user-id', // This would be extracted from JWT in real scenario
          productId: product.id,
          paymentMethod: 'virtual_currency',
        }),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
        }
      );

      const duration = new Date().getTime() - startTime;
      purchaseRate.add(duration);

      const checkResult = check(purchaseResponse, {
        'purchase initiation status is 200': (r) => r.status === 200,
        'purchase initiation time < 800ms': (r) => r.timings.duration < 800,
      });

      errorRate.add(!checkResult);
    }
  }

  sleep(Math.random() * 3 + 1);
}

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total authenticated users: ${data.authTokens.length}`);
}
