#!/usr/bin/env node

/**
 * Dojo Pool Test Runner
 * A flexible test runner for Cypress E2E tests
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test suite configurations
const testSuites = {
  auth: {
    description: 'Authentication System Tests',
    path: 'cypress/e2e/auth/authentication.cy.ts',
    critical: true,
  },
  tournament: {
    description: 'Tournament System Tests',
    path: 'cypress/e2e/tournament/**/*.cy.ts',
    critical: true,
  },
  tournamentManagement: {
    description: 'Tournament Management E2E Tests',
    path: 'cypress/e2e/tournament/tournament_management.cy.ts',
    critical: true,
  },
  tournamentSimple: {
    description: 'Simplified Tournament Management Tests',
    path: 'cypress/e2e/tournament/tournament_management_simple.cy.ts',
    critical: false,
  },
  social: {
    description: 'Social Features Tests',
    path: 'cypress/e2e/social/**/*.cy.ts',
    critical: false,
  },
  achievements: {
    description: 'Achievement System Tests',
    path: 'cypress/e2e/achievements/**/*.cy.ts',
    critical: false,
  },
  performance: {
    description: 'Performance Tests',
    path: 'cypress/e2e/performance/**/*.cy.ts',
    critical: false,
  },
  all: {
    description: 'All Test Suites',
    path: 'cypress/e2e/**/*.cy.ts',
    critical: true,
  },
};

// Display available test suites
function showHelp() {
  console.log('\n🏆 Dojo Pool Test Runner');
  console.log('========================\n');
  console.log('Available test suites:');

  Object.entries(testSuites).forEach(([key, suite]) => {
    const critical = suite.critical ? '🔴' : '🟡';
    console.log(`  ${critical} ${key}: ${suite.description}`);
  });

  console.log('\nUsage:');
  console.log('  node scripts/test-runner.js <suite-name> [options]');
  console.log('\nOptions:');
  console.log('  --headless    Run tests in headless mode');
  console.log('  --browser     Specify browser (chrome, firefox, edge)');
  console.log('  --env         Set environment (dev, staging, prod)');
  console.log('\nExamples:');
  console.log('  node scripts/test-runner.js auth');
  console.log('  node scripts/test-runner.js all --headless');
  console.log('  node scripts/test-runner.js tournament --browser chrome');
}

// Run tests
function runTests(suiteName, options = {}) {
  const suite = testSuites[suiteName];

  if (!suite) {
    console.error(`❌ Unknown test suite: ${suiteName}`);
    showHelp();
    process.exit(1);
  }

  console.log(`\n🧪 Running ${suite.description}...`);
  console.log(`📁 Path: ${suite.path}`);

  // Build Cypress command
  let command = 'npx cypress run';

  if (options.headless) {
    command += ' --headless';
  }

  if (options.browser) {
    command += ` --browser ${options.browser}`;
  }

  if (options.env) {
    command += ` --env environment=${options.env}`;
  }

  command += ` --spec "${suite.path}"`;

  console.log(`🚀 Command: ${command}\n`);

  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ ${suite.description} completed successfully!`);
  } catch (error) {
    console.error(`\n❌ ${suite.description} failed!`);
    process.exit(1);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const suiteName = args[0];
  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--headless') {
      options.headless = true;
    } else if (arg === '--browser' && args[i + 1]) {
      options.browser = args[i + 1];
      i++;
    } else if (arg === '--env' && args[i + 1]) {
      options.env = args[i + 1];
      i++;
    }
  }

  runTests(suiteName, options);
}

// Check if running in CI environment
if (process.env.CI) {
  console.log('🚀 Running in CI environment');
  runTests('all', { headless: true });
} else {
  parseArgs();
}
