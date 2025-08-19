# Cypress E2E Testing for Dojo Pool

This directory contains end-to-end tests for the Dojo Pool application using Cypress.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Dojo Pool frontend running on `http://localhost:3000`
- Dojo Pool backend running on `http://localhost:3001`

### Running Tests

#### Interactive Mode (Recommended for Development)

```bash
npm run cypress:open
```

#### Headless Mode (CI/CD)

```bash
npm run test:e2e
```

#### Specific Test Suite

```bash
npx cypress run --spec "cypress/e2e/auth/authentication.cy.ts"
```

## 📁 Test Structure

```
cypress/
├── e2e/                    # Test specifications
│   ├── auth/              # Authentication tests
│   ├── tournament/         # Tournament system tests
│   ├── social/            # Social features tests
│   ├── achievements/      # Achievement system tests
│   ├── api/               # API integration tests
│   ├── performance/       # Performance tests
│   ├── load/              # Load testing
│   ├── visual/            # Visual regression tests
│   └── critical-path/     # Critical user journey tests
├── fixtures/               # Test data files
├── support/                # Custom commands and utilities
│   ├── commands.ts        # Custom Cypress commands
│   ├── e2e.ts            # Global configuration
│   └── test-helpers.ts    # Helper functions
└── config/                 # Configuration files
```

## 🧪 Test Categories

### 1. Authentication System

- User registration flow
- User login flow
- Session management
- Password reset
- Form validation

### 2. Core Gameplay

- Tournament creation and management
- Match tracking and scoring
- Player progression
- Territory control

### 3. Social Features

- Friend system
- Clan management
- Chat functionality
- Achievement sharing

### 4. Performance & Load

- Page load times
- API response times
- Concurrent user handling
- Database performance

## 🛠️ Custom Commands

### Authentication

```typescript
cy.login(email, password); // Login with credentials
cy.register(email, password); // Register new user
cy.logout(); // Logout current user
cy.isAuthenticated(); // Check if user is authenticated
```

### Utilities

```typescript
cy.generateUniqueEmail(); // Generate unique test email
cy.waitForPageLoad(); // Wait for page to fully load
```

## 📊 Test Data Management

### Test Isolation

- Each test runs in isolation
- Cookies and localStorage are cleared before each test
- Unique test data is generated for each run

### Database Cleanup

- Tests create real users in the development database
- Consider implementing test data cleanup strategies:
  - Database reset before test runs
  - Test user cleanup API endpoints
  - Test environment isolation

## 🔧 Configuration

### Environment Variables

```bash
# Cypress configuration
CYPRESS_BASE_URL=http://localhost:3000
CYPRESS_API_URL=http://localhost:3001
```

### Test Configuration

- Base URL: `http://localhost:3000`
- Viewport: 1280x720
- Timeouts: 10 seconds
- Screenshots: Enabled on failure
- Videos: Disabled for performance

## 🚨 Troubleshooting

### Common Issues

1. **Tests failing due to timing**

   - Increase `defaultCommandTimeout` in `cypress.config.ts`
   - Add explicit `cy.wait()` for async operations

2. **Element not found**

   - Check if the element has the expected `name` attribute
   - Verify the page has fully loaded
   - Check for dynamic content loading

3. **Authentication issues**
   - Ensure backend is running
   - Check database connectivity
   - Verify API endpoints are accessible

### Debug Mode

```bash
# Run with debug logging
DEBUG=cypress:* npm run test:e2e
```

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  run: |
    npm run build
    npm run test:e2e
  env:
    CI: true
```

### Pre-commit Hooks

```bash
# Run E2E tests before commit
npm run test:e2e
```

## 🎯 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Realistic Data**: Use realistic test data that mimics production
3. **Accessibility**: Test keyboard navigation and screen readers
4. **Performance**: Monitor test execution times
5. **Maintenance**: Keep selectors robust and maintainable

## 🔍 Test Coverage Goals

- **Critical Paths**: 100% coverage
- **Authentication**: 100% coverage
- **Core Features**: 90%+ coverage
- **Edge Cases**: 80%+ coverage

## 📚 Additional Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library for Cypress](https://testing-library.com/docs/cypress-testing-library/intro/)
