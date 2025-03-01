#!/usr/bin/env node

/**
 * This script runs the wallet and tournament tests with auto-included Babel presets.
 * It creates a temporary Jest configuration that includes the necessary configuration for testing React and TypeScript.
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Define the test patterns to run
const testPatterns = [
  'useWallet',
  'crossChainTournamentService',
  'TournamentRegistration'
];

// Track failures
let failures = 0;

// Get current date and time for logging
const now = new Date();
const formattedDate = now.toLocaleDateString() + ', ' + now.toLocaleTimeString();

console.log('=== Running DojoPool Wallet & Tournament Tests ===');
console.log(`=== ${formattedDate} ===\n`);

// Create a temporary Babel config
const tempBabelConfigPath = path.join(__dirname, 'temp-babel.config.js');
const tempBabelConfigContent = `
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
};
`;

// Create a temporary Jest configuration file
const tempConfigPath = path.join(__dirname, 'temp-jest.config.js');
const tempConfigContent = `
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\\\.(ts|tsx|js|jsx)$': ['babel-jest', { configFile: './temp-babel.config.js' }]
  },
  moduleNameMapper: {
    '\\\\.(css|less|scss|sass)$': '<rootDir>/src/tests/__mocks__/styleMock.js',
    '\\\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/tests/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setupTests.ts'
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
};
`;

// Create style mock directory and file if they don't exist
const mockDir = path.join(__dirname, 'src/tests/__mocks__');
const styleMockPath = path.join(mockDir, 'styleMock.js');
const fileMockPath = path.join(mockDir, 'fileMock.js');

try {
  // Create mock directory if it doesn't exist
  if (!fs.existsSync(mockDir)) {
    fs.mkdirSync(mockDir, { recursive: true });
  }

  // Create mock files if they don't exist
  if (!fs.existsSync(styleMockPath)) {
    fs.writeFileSync(styleMockPath, 'module.exports = {};');
  }
  
  if (!fs.existsSync(fileMockPath)) {
    fs.writeFileSync(fileMockPath, 'module.exports = "test-file-stub";');
  }

  // Write the temporary files
  fs.writeFileSync(tempBabelConfigPath, tempBabelConfigContent);
  fs.writeFileSync(tempConfigPath, tempConfigContent);
  
  console.log('Created temporary Jest and Babel configurations');

  // Install babel-jest locally if it doesn't exist
  try {
    console.log('Checking if babel-jest is available...');
    require.resolve('babel-jest');
    console.log('babel-jest is available, proceeding with tests');
  } catch (e) {
    console.log('babel-jest not found, attempting to install it temporarily...');
    execSync('npm install --no-save babel-jest @babel/preset-env @babel/preset-react @babel/preset-typescript', {
      stdio: 'inherit'
    });
  }

  // Run each test pattern
  for (const pattern of testPatterns) {
    console.log(`\nRunning tests for: ${pattern}`);
    try {
      execSync(`npx jest "${pattern}" --config=${tempConfigPath} --no-cache`, {
        stdio: 'inherit'
      });
      console.log(`✅ Successfully ran tests for: ${pattern}`);
    } catch (error) {
      console.log(`❌ Failed running tests for: ${pattern}`);
      failures++;
    }
  }

  if (failures > 0) {
    console.log(`\n❌ ${failures} test patterns had failures.`);
  } else {
    console.log('\n✅ All test patterns completed successfully!');
  }
} catch (error) {
  console.error('Error running tests:', error);
  failures++;
} finally {
  // Clean up temporary files
  try {
    if (fs.existsSync(tempConfigPath)) fs.unlinkSync(tempConfigPath);
    if (fs.existsSync(tempBabelConfigPath)) fs.unlinkSync(tempBabelConfigPath);
    console.log('Removed temporary configuration files');
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
}

console.log('\n=== Test run completed ===');
console.log(`=== ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()} ===`);

// Exit with appropriate code
process.exit(failures > 0 ? 1 : 0); 