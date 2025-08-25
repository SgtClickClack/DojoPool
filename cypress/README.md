# Cypress E2E Testing for DojoPool

This directory contains comprehensive end-to-end tests for the DojoPool platform using Cypress.

## Test Coverage

### Clan Management Tests (`clan_management.cy.ts`)
- **Complete Clan Creation Journey**: Tests the entire flow from login to clan creation to discovery
- **Form Validation**: Tests required fields, tag length validation, and form submission
- **Clan Discovery**: Verifies newly created clans appear in the discovery page
- **Search and Filtering**: Tests clan search functionality and filtering options
- **Error Handling**: Tests API errors and network timeouts gracefully

### Admin Panel Access Tests (`admin_access.cy.ts`)
- **Non-Admin User Access**: Verifies regular users are redirected away from admin pages
- **Admin User Access**: Tests admin dashboard functionality and content display
- **Role-Based Access Control**: Tests dynamic role changes and invalid role handling
- **Admin Dashboard Features**: Tests stats cards, user management table, and navigation
- **Security**: Ensures proper access control and redirection mechanisms

## Prerequisites

1. **Install Dependencies**: Run `npm install` to install Cypress and testing libraries
2. **Start Development Server**: Ensure the DojoPool frontend is running on `http://localhost:3000`
3. **Backend Services**: Ensure the backend API services are running and accessible

## Running Tests

### Interactive Mode (Recommended for Development)
```bash
npm run cypress:open
```
This opens the Cypress Test Runner in a browser window where you can:
- See all test files
- Run individual tests
- Watch tests execute in real-time
- Debug test failures

### Headless Mode (CI/CD)
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx cypress run --spec "cypress/e2e/clan_management.cy.ts"

# Run with video recording
npx cypress run --record
```

### Individual Test Files
```bash
# Run clan management tests only
npx cypress run --spec "cypress/e2e/clan_management.cy.ts"

# Run admin access tests only
npx cypress run --spec "cypress/e2e/admin_access.cy.ts"
```

## Test Data

Test fixtures are located in `cypress/fixtures/`:
- `test-data.json`: Comprehensive test data including users, clans, and admin data
- `users.json`: User authentication test data
- `games.json`: Game-related test data
- `venues.json`: Venue-related test data

## Custom Commands

The following custom Cypress commands are available:

### `cy.login(email, password)`
Logs in a user with the specified credentials:
```typescript
cy.login('test@example.com', 'password123');
```

### `cy.createGame(player1, player2)`
Creates a new game between two players:
```typescript
cy.createGame('Player1', 'Player2');
```

### `cy.loadFixtures()`
Loads test data fixtures:
```typescript
cy.loadFixtures().then((data) => {
  // Use fixture data
});
```

## Configuration

Cypress configuration is in `cypress.config.ts`:
- **Base URL**: `http://localhost:3000`
- **Viewport**: 1280x720
- **Timeouts**: 10 seconds for commands and requests
- **Video Recording**: Disabled for faster execution
- **Screenshots**: Enabled on test failure

## Test Structure

### Before Each Test
- Mock authentication endpoints
- Mock API responses
- Set up test data

### Test Organization
- **Describe Blocks**: Group related test scenarios
- **Individual Tests**: Test specific functionality
- **Assertions**: Verify expected behavior and outcomes

### Mocking Strategy
- **API Interception**: Mock backend responses for consistent testing
- **Authentication**: Simulate different user roles and permissions
- **Error Scenarios**: Test error handling and edge cases

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Use API interception to avoid external dependencies
3. **Assertions**: Verify both positive and negative scenarios
4. **Error Handling**: Test graceful degradation and error states
5. **Accessibility**: Use semantic selectors and test user interactions

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure port 3000 is available for the frontend
2. **API Endpoints**: Verify backend services are running and accessible
3. **Test Data**: Check that fixture files contain valid JSON
4. **Viewport Issues**: Tests are configured for 1280x720 resolution

### Debug Mode
Run tests with debug information:
```bash
DEBUG=cypress:* npm run cypress:run
```

### Visual Debugging
Use Cypress's built-in debugging tools:
- Pause execution with `cy.pause()`
- Step through commands
- Inspect DOM elements
- View network requests

## Contributing

When adding new tests:
1. Follow the existing test structure and naming conventions
2. Add appropriate mocks for external dependencies
3. Include both positive and negative test cases
4. Update this README with new test coverage information
5. Ensure tests pass in both interactive and headless modes

## CI/CD Integration

The E2E tests are designed to run in CI/CD pipelines:
- Use `npm run test:e2e` for headless execution
- Tests will fail fast on critical errors
- Screenshots are captured on failures for debugging
- Tests can be run in parallel for faster execution
