/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      // useESM: true // Often causes issues with commonjs setup files, removing for now
    }]
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Updated file extension
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}; 