# Testing Strategy

## Purpose

This project uses a comprehensive testing approach with multiple testing layers to ensure code quality and reliability:

- **Unit Tests**: Fast, isolated tests using Vitest for individual components and functions
- **Integration Tests**: Tests for service interactions and API endpoints
- **End-to-End Tests**: Cypress-based tests to validate critical user flows and UI interactions
- **Performance Tests**: Load testing and performance validation

## Setup

### Prerequisites

1. **Install Dependencies**: Run `npm install` to install all testing libraries
2. **Environment Variables**: Ensure your `.env` file includes:
   - `PERCY_TOKEN` (for visual regression testing)
   - Database connection strings for integration tests
   - API keys for external service testing

### One-Time Setup

```bash
# Install dependencies
npm install

# Verify testing tools are available
npm run test:unit
npm run test:int
npm run cypress:open
```

## How to Run Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Watch mode for development
npm run test:watch

# Run specific test file
npm run test -- path/to/test.spec.ts
```

### Integration Tests

```bash
# Run all integration tests
npm run test:int

# Run with coverage
npm run test:int:coverage
```

### End-to-End Tests (Cypress)

```bash
# Interactive mode (recommended for development)
npm run cypress:open

# Headless mode (CI/CD)
npm run test:e2e

# Run specific E2E test file
npm run cypress:run --spec "cypress/e2e/auth.cy.ts"

# Run with Percy visual testing
npm run test:e2e
```

### Complete Test Suite

```bash
# Run all tests with coverage
npm run test:ci

# Run all tests without coverage
npm run test:all
```

## Key Test Suites

### Unit Tests

- **Component Tests**: React component rendering and behavior
- **Service Tests**: Business logic and API service functions
- **Utility Tests**: Helper functions and data transformations
- **Hook Tests**: Custom React hooks functionality

### Integration Tests

- **API Endpoint Tests**: Backend service integration
- **Database Tests**: Data persistence and queries
- **External Service Tests**: Third-party API integrations

### E2E Test Files

| Test File                  | Feature Coverage  | Description                               |
| -------------------------- | ----------------- | ----------------------------------------- |
| `auth.cy.ts`               | Authentication    | Login, logout, registration flows         |
| `clan_management.cy.ts`    | Clan System       | Clan creation, management, discovery      |
| `admin_access.cy.ts`       | Admin Panel       | Role-based access control, admin features |
| `territory-gameplay.cy.ts` | Territory System  | Territory claiming, defense, gameplay     |
| `multiplayer.cy.ts`        | Multiplayer Games | Real-time game interactions               |
| `performance.cy.ts`        | Performance       | Load times, responsiveness metrics        |
| `visual.cy.ts`             | Visual Regression | UI consistency and visual changes         |

## Test Configuration

### Cypress Configuration

- **Base URL**: `http://localhost:3000`
- **Viewport**: 1280x720
- **Timeouts**: 10 seconds for commands and requests
- **Screenshots**: Enabled on test failure
- **Video Recording**: Disabled for faster execution

### Vitest Configuration

- **Unit Tests**: `vitest.unit.config.ts`
- **Integration Tests**: `vitest.integration.config.ts`
- **Coverage Threshold**: 80% minimum
- **Test Environment**: jsdom for React components

## Custom Commands

### Cypress Commands

```typescript
// User authentication
cy.login(email, password);

// Game creation
cy.createGame(player1, player2);

// Fixture loading
cy.loadFixtures();
```

### Test Utilities

```typescript
// Mock API responses
import { mockApiResponse } from '@/test-utils/mocks';

// Test data factories
import { createTestUser, createTestClan } from '@/test-utils/factories';
```

## Continuous Integration

### GitHub Actions

- Runs on every pull request
- Executes unit, integration, and E2E tests
- Generates coverage reports
- Performs visual regression testing with Percy

### Pre-commit Hooks

- Runs unit tests before commit
- Checks code formatting and linting
- Validates TypeScript types

## Debugging Tests

### Cypress Debugging

```bash
# Open Cypress in debug mode
npm run cypress:open

# Run specific test with debugging
npx cypress run --spec "cypress/e2e/auth.cy.ts" --headed
```

### Vitest Debugging

```bash
# Run tests with Node.js inspector
npm run test:debug

# Run specific test file
npm run test -- path/to/test.spec.ts --reporter=verbose
```

## Performance Testing

### Load Testing

```bash
# Run performance benchmarks
npm run benchmark

# Execute load tests
npm run test:performance
```

### Monitoring

- Performance metrics collection
- Memory usage tracking
- Response time analysis

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Data Cleanup**: Clean up test data after each test
3. **Meaningful Assertions**: Test behavior, not implementation details
4. **Fast Execution**: Keep tests fast for quick feedback during development
5. **Clear Test Names**: Use descriptive test names that explain the scenario

## Troubleshooting

### Common Issues

**Cypress Tests Failing**

- Ensure development server is running on port 3000
- Check for console errors in browser dev tools
- Verify test data fixtures are available

**Unit Tests Failing**

- Check for missing dependencies
- Verify test environment setup
- Check for TypeScript compilation errors

**Integration Tests Failing**

- Ensure database is accessible
- Check API service configuration
- Verify external service connectivity

### Getting Help

- Check test output for detailed error messages
- Review Cypress documentation for E2E testing
- Consult Vitest documentation for unit testing
- Check project issues for known problems
