#!/usr/bin/env node

/**
 * Test script to isolate problematic imports in backend index.ts
 * This will help identify which specific import is causing the server crash
 */

process.on('uncaughtException', (err, origin) => {
  console.error('----- UNCAUGHT EXCEPTION -----');
  console.error('Caught exception:', err);
  console.error('Exception origin:', origin);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('----- UNHANDLED REJECTION -----');
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

console.log('🔍 Testing backend imports one by one...\n');

async function testImport(modulePath, description) {
  try {
    console.log(`Testing: ${description}`);
    await import(modulePath);
    console.log(`✅ SUCCESS: ${description}\n`);
    return true;
  } catch (error) {
    console.error(`❌ FAILED: ${description}`);
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}\n`);
    return false;
  }
}

async function runTests() {
  const tests = [
    ['express', 'Express framework'],
    ['path', 'Node.js path module'],
    ['./src/config/monitoring.ts', 'Monitoring configuration'],
    ['express-rate-limit', 'Rate limiting middleware'],
    ['express-validator', 'Express validator'],
    ['helmet', 'Helmet security middleware'],
    ['dotenv', 'Environment variables'],
    ['http', 'Node.js HTTP module'],
    ['socket.io', 'Socket.IO'],
    ['cors', 'CORS middleware'],
    ['http-proxy-middleware', 'HTTP proxy middleware'],
    ['./src/backend/routes/social.ts', 'Social routes'],
    ['./src/backend/routes/territory.ts', 'Territory routes'],
    ['./src/backend/routes/userNfts.ts', 'User NFTs routes'],
    ['./src/backend/routes/challenge.ts', 'Challenge routes'],
    ['./src/backend/routes/tournament.ts', 'Tournament routes'],
    [
      './src/services/venue/VenueLeaderboardService.ts',
      'Venue Leaderboard Service',
    ],
    [
      './src/services/analytics/AdvancedAnalyticsService.ts',
      'Advanced Analytics Service',
    ],
    ['./src/backend/routes/game-analysis.ts', 'Game Analysis routes'],
    ['./src/backend/routes/game-strategy.ts', 'Game Strategy routes'],
    ['./src/backend/routes/game-status.ts', 'Game Status routes'],
  ];

  let failedCount = 0;
  let firstFailure = null;

  for (const [modulePath, description] of tests) {
    const success = await testImport(modulePath, description);
    if (!success) {
      failedCount++;
      if (!firstFailure) {
        firstFailure = { modulePath, description };
      }
    }
  }

  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed: ${tests.length - failedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (firstFailure) {
    console.log(`\n🚨 First failure: ${firstFailure.description}`);
    console.log(`Module: ${firstFailure.modulePath}`);
    console.log('\nThis is likely the root cause of the server crash.');
  } else {
    console.log(
      '\n✅ All imports successful! The issue might be in the execution logic.'
    );
  }
}

runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
