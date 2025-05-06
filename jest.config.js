/** @type {import('ts-jest').JestConfigWithTsJest} */
const path = require('path');

// Base config shared between projects (remove coverage settings from here)
const baseConfig = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    // Asset/alias mocks (needed by both environments)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__tests__/mocks/fileMock.js',
    '^canvas$': '<rootDir>/src/__tests__/mocks/emptyMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Coverage config moved into projects
};

module.exports = {
  projects: [
    // --- Node Project (API/MSW Tests) ---
    {
      ...baseConfig,
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/**/*.node.test.ts?(x)', 
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper: {
          ...baseConfig.moduleNameMapper, 
          '^test-utils$': '<rootDir>/src/tests/unit/utils/test-utils.tsx',
          '^msw$': '<rootDir>/node_modules/msw/lib/node/index.js',
          '^@mswjs/interceptors$': '<rootDir>/node_modules/@mswjs/interceptors/lib/node/index.js',
          '^msw/node$': require.resolve('msw/node'),
          '^@prisma/client$': '<rootDir>/node_modules/@prisma/client/default.js',
          // Map ws to its likely CJS entry point
          '^ws$': '<rootDir>/node_modules/ws/index.js', 
      },
      // Keep default transformIgnorePatterns 
      transformIgnorePatterns: [
        '/node_modules/',
      ],
      // Coverage for Node tests
      collectCoverage: true,
      coverageProvider: 'v8',
      coverageDirectory: '<rootDir>/coverage/node', // Separate coverage dir
      coverageReporters: ['json', 'lcov', 'text'],
      collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        // Add relevant exclusions if needed
        '!src/**/*.dom.test.{ts,tsx}', // Exclude potential future DOM tests
        '!src/**/*.test.{ts,tsx}', // Exclude general tests if needed
      ],
    },
    // --- JSDOM Project (UI/Component Tests) ---
    {
      ...baseConfig,
      displayName: 'jsdom',
      testEnvironment: 'jsdom', 
      testMatch: [
        '<rootDir>/src/**/*.test.ts?(x)',
      ],
      // Define ignores directly for this project
      testPathIgnorePatterns: [
         '/node_modules/', 
         '/dist/',
         '/cypress/',
         // Exclude node tests using relative path pattern
         'src/.*\\.node\\.test\\.tsx?',
         // Exclude file causing import.meta issue due to special chars - Ensure this is applied!
         'src/dojopool/frontend/config/\\[FB\\]firebase\\.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.dom.ts'],
      // Ensure Firebase and Prisma are transformed
      transformIgnorePatterns: [
        '/node_modules/(?!(firebase|@firebase|@prisma|@chakra-ui/react|@chakra-ui/icons)/).+\\.(js|jsx|mjs|cjs|ts|tsx)$',
      ],
      moduleNameMapper: {
          ...baseConfig.moduleNameMapper, 
          '^test-utils$': '<rootDir>/src/tests/unit/utils/test-utils.tsx',
          '^@prisma/client$': '<rootDir>/node_modules/@prisma/client/default.js',
      },
      // Coverage for JSDOM tests
      collectCoverage: true,
      coverageProvider: 'v8',
      coverageDirectory: '<rootDir>/coverage/jsdom', // Separate coverage dir
      coverageReporters: ['json', 'lcov', 'text'],
      collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.node.test.{ts,tsx}', 
      ],
    },
  ],
}; 