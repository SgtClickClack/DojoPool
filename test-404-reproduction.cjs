#!/usr/bin/env node

/**
 * Test script to reproduce 404 errors in DojoPool application
 * This script will test various endpoints and pages that might be causing 404 errors
 */

const http = require('http');
const https = require('https');

// Test configuration
const TEST_CONFIG = {
  frontend: {
    host: 'localhost',
    port: 3000,
    protocol: 'http:',
  },
  backend: {
    host: 'localhost',
    port: 8080,
    protocol: 'http:',
  },
  flask: {
    host: 'localhost',
    port: 5000,
    protocol: 'http:',
  },
};

// Pages that were deleted and might cause 404s
const DELETED_PAGES = [
  '/advanced-analytics',
  '/game-analysis',
  '/game-strategy',
];

// API endpoints to test
const API_ENDPOINTS = [
  '/api/advanced-analytics/dashboard',
  '/api/game-analysis/performance',
  '/api/game-strategy/recommendations',
  '/api/health',
  '/api/game-status',
];

// Static assets that might be missing
const STATIC_ASSETS = ['/favicon.ico', '/test.html', '/assets/images/logo.png'];

/**
 * Make HTTP request and return promise
 */
function makeRequest(options) {
  return new Promise((resolve) => {
    const client = options.protocol === 'https' ? https : http;

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: `${options.protocol}://${options.hostname}:${options.port}${options.path}`,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 'ERROR',
        error: error.message,
        url: `${options.protocol}://${options.hostname}:${options.port}${options.path}`,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        statusCode: 'TIMEOUT',
        error: 'Request timeout',
        url: `${options.protocol}://${options.hostname}:${options.port}${options.path}`,
      });
    });

    req.end();
  });
}

/**
 * Test a specific endpoint
 */
async function testEndpoint(server, path) {
  const options = {
    hostname: server.host,
    port: server.port,
    path: path,
    method: 'GET',
    protocol: server.protocol,
  };

  const result = await makeRequest(options);

  const status =
    result.statusCode === 404
      ? '❌ 404'
      : result.statusCode === 200
        ? '✅ 200'
        : result.statusCode === 'ERROR'
          ? '🔥 ERROR'
          : result.statusCode === 'TIMEOUT'
            ? '⏰ TIMEOUT'
            : `⚠️  ${result.statusCode}`;

  console.log(`${status} ${result.url}`);

  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }

  return result;
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🔍 DojoPool 404 Error Reproduction Test');
  console.log('=====================================\n');

  const results = {
    frontend404s: [],
    backend404s: [],
    errors: [],
  };

  // Test frontend pages
  console.log('📄 Testing Frontend Pages:');
  for (const page of DELETED_PAGES) {
    const result = await testEndpoint(TEST_CONFIG.frontend, page);
    if (result.statusCode === 404) {
      results.frontend404s.push(result.url);
    } else if (
      result.statusCode === 'ERROR' ||
      result.statusCode === 'TIMEOUT'
    ) {
      results.errors.push(result.url);
    }
  }

  // Test static assets
  console.log('\n🖼️  Testing Static Assets:');
  for (const asset of STATIC_ASSETS) {
    const result = await testEndpoint(TEST_CONFIG.frontend, asset);
    if (result.statusCode === 404) {
      results.frontend404s.push(result.url);
    } else if (
      result.statusCode === 'ERROR' ||
      result.statusCode === 'TIMEOUT'
    ) {
      results.errors.push(result.url);
    }
  }

  // Test backend API endpoints
  console.log('\n🔌 Testing Backend API Endpoints:');
  for (const endpoint of API_ENDPOINTS) {
    const result = await testEndpoint(TEST_CONFIG.backend, endpoint);
    if (result.statusCode === 404) {
      results.backend404s.push(result.url);
    } else if (
      result.statusCode === 'ERROR' ||
      result.statusCode === 'TIMEOUT'
    ) {
      results.errors.push(result.url);
    }
  }

  // Test Flask endpoints
  console.log('\n🐍 Testing Flask Endpoints:');
  const flaskEndpoints = ['/api/health', '/api/status'];
  for (const endpoint of flaskEndpoints) {
    const result = await testEndpoint(TEST_CONFIG.flask, endpoint);
    if (result.statusCode === 404) {
      results.backend404s.push(result.url);
    } else if (
      result.statusCode === 'ERROR' ||
      result.statusCode === 'TIMEOUT'
    ) {
      results.errors.push(result.url);
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Frontend 404s: ${results.frontend404s.length}`);
  console.log(`Backend 404s: ${results.backend404s.length}`);
  console.log(`Connection Errors: ${results.errors.length}`);

  if (results.frontend404s.length > 0) {
    console.log('\n❌ Frontend 404 Errors:');
    results.frontend404s.forEach((url) => console.log(`   ${url}`));
  }

  if (results.backend404s.length > 0) {
    console.log('\n❌ Backend 404 Errors:');
    results.backend404s.forEach((url) => console.log(`   ${url}`));
  }

  if (results.errors.length > 0) {
    console.log('\n🔥 Connection Errors:');
    results.errors.forEach((url) => console.log(`   ${url}`));
  }

  const total404s = results.frontend404s.length + results.backend404s.length;
  if (total404s > 0) {
    console.log(
      `\n🚨 Found ${total404s} repetitive 404 errors that need to be fixed!`
    );
    process.exit(1);
  } else {
    console.log('\n✅ No 404 errors found!');
    process.exit(0);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
