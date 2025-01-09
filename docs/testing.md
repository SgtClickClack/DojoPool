# Testing Guide

## Test Directory Structure

The project maintains three separate test directories for different purposes:

### Backend Tests (`/tests/`)
- `unit/` - Unit tests for individual components
- `integration/` - Integration tests for API endpoints
- `performance/` - Performance and load testing
- `api/` - API-specific tests
- `helpers/` - Test helper functions and utilities
- `conftest.py` - pytest configuration and fixtures
- `factories.py` - Test data factories

### Frontend Tests (`/src/tests/`)
- `components/` - React component tests
- `services/` - Frontend service tests
- `hooks/` - Custom hook tests
- `e2e/` - End-to-end tests
- `__mocks__/` - Mock implementations
- `setupTests.ts` - Jest setup configuration
- `runTests.js` - Test runner configuration

### Static Test Assets (`/test/`)
- `static/` - Static assets for testing
- `ssl/` - SSL certificates for testing

## Running Tests

### Backend Tests
```bash
# Run all backend tests
pytest

# Run specific test category
pytest tests/unit/
pytest tests/integration/
pytest tests/performance/

# Run with coverage
pytest --cov=src tests/
```

### Frontend Tests
```bash
# Run all frontend tests
npm test

# Run specific test file
npm test src/tests/components/MyComponent.test.tsx

# Run with coverage
npm test -- --coverage
```

## Test Guidelines

1. **Backend Tests**
   - Use pytest fixtures for test setup
   - Follow AAA pattern (Arrange, Act, Assert)
   - Mock external dependencies
   - Use factories for test data

2. **Frontend Tests**
   - Use React Testing Library
   - Test user interactions
   - Mock API calls
   - Test component rendering

3. **Performance Tests**
   - Define performance benchmarks
   - Test under various loads
   - Monitor resource usage
   - Document performance metrics

4. **Integration Tests**
   - Test API endpoints
   - Verify database interactions
   - Test authentication flows
   - Check error handling

## Writing Tests

### Backend Example
```python
def test_user_creation(client, db):
    """Test user creation endpoint."""
    response = client.post('/api/users', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 201
    assert 'id' in response.json
```

### Frontend Example
```typescript
import { render, screen } from '@testing-library/react';
import UserProfile from './UserProfile';

test('renders user profile', () => {
    render(<UserProfile username="testuser" />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
});
```

## Continuous Integration

1. Tests run automatically on:
   - Pull request creation
   - Push to main branch
   - Nightly builds

2. Coverage requirements:
   - Backend: 80% minimum
   - Frontend: 70% minimum
   - Critical paths: 100%

## Test Data Management

1. Use factories for test data generation
2. Maintain separate test database
3. Clean up test data after each test
4. Use realistic test data scenarios

## Debugging Tests

1. Use pytest's -v and -s flags for verbose output
2. Use debugger breakpoints
3. Check test logs in CI/CD pipeline
4. Use test coverage reports

## Best Practices

1. Keep tests independent
2. Use descriptive test names
3. Test edge cases
4. Maintain test documentation
5. Regular test maintenance 