# Testing Infrastructure

This directory contains our testing infrastructure, including unit tests, integration tests, accessibility tests, and performance tests.

## Directory Structure

```
src/tests/
├── unit/           # Unit tests for individual components and utilities
├── integration/    # Integration tests for component interactions
├── a11y/           # Accessibility tests
├── performance/    # Performance tests
├── setup.ts        # Test setup and global mocks
└── test-utils.tsx  # Common test utilities
```

## Test Types

### Unit Tests

- Located in `src/tests/unit/`
- Test individual components and utilities in isolation
- Focus on props, state, and component behavior
- Example: `Button.test.tsx`

### Integration Tests

- Located in `src/tests/integration/`
- Test component interactions and data flow
- Include API integration and form handling
- Example: `LoginForm.test.tsx`

### Accessibility Tests

- Located in `src/tests/a11y/`
- Test ARIA compliance and screen reader compatibility
- Ensure keyboard navigation and focus management
- Example: `Navigation.test.tsx`

### Performance Tests

- Located in `src/tests/performance/`
- Test render performance and interaction speed
- Monitor memory usage and frame rates
- Example: `DataGrid.test.tsx`

## Test Utilities

### Performance Utilities

Located in `src/utils/performance.ts`:

- `measurePerformance`: Measure function execution time
- `measureFrameRate`: Measure frame rate for animations
- `measureMemoryUsage`: Track memory usage over time
- `measureNetworkPerformance`: Measure API request performance
- `measureRenderPerformance`: Measure component render time

### Test Utilities

Located in `src/tests/test-utils.tsx`:

- `customRender`: Custom render function with providers
- `mockFetch`: Mock fetch responses
- `createMockResponse`: Create mock API responses
- `createMockWebSocket`: Create mock WebSocket instances

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run tests in CI environment
npm run test:ci

# Update snapshots
npm run test:update

# Debug tests
npm run test:debug
```

## Test Coverage

We maintain a minimum of 80% test coverage for:

- Statements
- Branches
- Functions
- Lines

Coverage reports are generated in the `coverage/` directory.

## Performance Budgets

### Component Rendering

- Initial render: < 100ms
- Re-renders: < 50ms
- Frame rate: 60fps (16.67ms per frame)
- Memory increase: < 5MB per operation

### Network Requests

- API calls: < 200ms
- Data fetching: < 100ms
- WebSocket messages: < 50ms

### User Interactions

- Click response: < 50ms
- Form submission: < 100ms
- Navigation: < 100ms
- Scrolling: 60fps

## Best Practices

### Writing Tests

1. Follow the Arrange-Act-Assert pattern
2. Test behavior, not implementation
3. Use meaningful test descriptions
4. Keep tests focused and atomic
5. Mock external dependencies
6. Clean up after tests

### Component Testing

1. Test props and state changes
2. Test user interactions
3. Test error states
4. Test loading states
5. Test accessibility
6. Test performance

### Integration Testing

1. Test component interactions
2. Test data flow
3. Test API integration
4. Test form handling
5. Test error handling
6. Test state management

### Accessibility Testing

1. Test ARIA compliance
2. Test keyboard navigation
3. Test screen reader compatibility
4. Test color contrast
5. Test focus management
6. Test responsive behavior

### Performance Testing

1. Test render performance
2. Test interaction performance
3. Test memory usage
4. Test frame rate
5. Test network performance
6. Test data handling

## Common Patterns

### Testing Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { customRender } from '../test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    customRender(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const handleClick = vi.fn();
    customRender(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing API Integration

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { customRender, mockFetch } from '../test-utils';
import { DataComponent } from '@/components/DataComponent';

describe('DataComponent', () => {
  it('fetches and displays data', async () => {
    const mockData = { id: 1, name: 'Test' };
    global.fetch = mockFetch({ data: mockData });

    customRender(<DataComponent />);
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
```

### Testing Performance

```typescript
import { render } from '@testing-library/react';
import { customRender } from '../test-utils';
import { measurePerformance } from '@/utils/performance';
import { HeavyComponent } from '@/components/HeavyComponent';

describe('HeavyComponent', () => {
  it('renders within performance budget', async () => {
    const metrics = await measurePerformance(() => {
      customRender(<HeavyComponent />);
    });

    expect(metrics.duration).toBeLessThan(100);
  });
});
```

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase timeout in test configuration
   - Check for infinite loops
   - Verify async operations complete

2. **Memory Leaks**
   - Clean up event listeners
   - Unmount components after tests
   - Clear intervals and timeouts

3. **Flaky Tests**
   - Use proper async/await patterns
   - Avoid time-dependent tests
   - Mock external dependencies

4. **Performance Issues**
   - Check for unnecessary re-renders
   - Optimize test setup
   - Use proper cleanup

### Debugging Tests

1. Use `test:debug` script
2. Add `debugger` statements
3. Use `console.log` for debugging
4. Check test coverage reports
5. Review performance metrics

## Contributing

1. Write tests for new features
2. Maintain test coverage
3. Follow testing best practices
4. Update documentation
5. Review test performance
6. Add new test utilities as needed
