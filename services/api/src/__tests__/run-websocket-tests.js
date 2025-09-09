#!/usr/bin/env node

/**
 * WebSocket Integration Test Runner
 *
 * This script runs all WebSocket integration tests for DojoPool.
 * It ensures proper test environment setup and cleanup.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting DojoPool WebSocket Integration Tests...\n');

// Set test environment
process.env.NODE_ENV = 'test';

// Test files to run
const testFiles = [
  'websocket-general.integration.spec.ts',
  'chat-websocket.integration.spec.ts',
  'activity-events-websocket.integration.spec.ts',
];

// Jest configuration for WebSocket tests
const jestConfig = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/websocket-test-helper.ts'],
  testMatch: testFiles.map((file) => `**/src/__tests__/${file}`),
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage/websocket-integration',
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
};

// Run tests
const jest = spawn(
  'npx',
  [
    'jest',
    '--config',
    JSON.stringify(jestConfig),
    '--testPathPattern',
    testFiles.join('|'),
  ],
  {
    cwd: path.join(__dirname, '..', '..'),
    stdio: 'inherit',
    shell: true,
  }
);

jest.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All WebSocket integration tests passed!');
  } else {
    console.log(
      `\n❌ WebSocket integration tests failed with exit code ${code}`
    );
  }
  process.exit(code);
});

jest.on('error', (error) => {
  console.error('Failed to start WebSocket tests:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping WebSocket tests...');
  jest.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping WebSocket tests...');
  jest.kill('SIGTERM');
});
