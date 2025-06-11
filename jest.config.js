/** @type {import('ts-jest').JestConfigWithTsJest} */
const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  moduleNameMapper: {
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^test-utils$': '<rootDir>/src/__tests__/test-utils',
    '^@test-utils/(.*)$': '<rootDir>/src/__tests__/$1',
    
    // Asset mocks
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__tests__/__mocks__/fileMock.js',
    
    // Module mocks
    '^canvas$': '<rootDir>/src/__tests__/__mocks__/emptyMock.js',
    '^konva$': '<rootDir>/src/__tests__/__mocks__/konvaMock.js',
    '^firebase/app$': '<rootDir>/src/__tests__/__mocks__/firebase/app.js',
    '^firebase/auth$': '<rootDir>/src/__tests__/__mocks__/firebase/auth.js',
    '^firebase/firestore$': '<rootDir>/src/__tests__/__mocks__/firebase/firestore.js',
    '^firebase/storage$': '<rootDir>/src/__tests__/__mocks__/firebase/storage.js',
    '^firebase/analytics$': '<rootDir>/src/__tests__/__mocks__/firebase/analytics.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true,
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)',
    '**/?(*.)+(spec|test).(ts|tsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/cypress/',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(firebase|@firebase)/)',
  ],
};