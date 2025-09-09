# WebSocket Integration Tests for DojoPool

This directory contains comprehensive WebSocket integration tests for the DojoPool platform, covering authentication, room operations, broadcasting, and cross-cutting concerns.

## 📋 Test Coverage

### Core Test Suites

#### 1. **Chat WebSocket Integration** (`chat-websocket.integration.spec.ts`)

- **Authentication Flow**: JWT token validation, connection rejection without auth
- **Direct Messaging**: Send/receive DMs, message validation, confirmation
- **Room Operations**: Private room management, message isolation
- **Rate Limiting**: Message frequency controls, burst handling
- **Error Handling**: Malformed payloads, non-existent users, security validation
- **Security**: Spoofing prevention, content sanitization

#### 2. **Activity Events WebSocket Integration** (`activity-events-websocket.integration.spec.ts`)

- **Authentication**: Namespace-specific auth validation
- **Event Broadcasting**: Real-time activity event distribution
- **Namespace Isolation**: Event containment within `/activity` namespace
- **Performance**: High-frequency event handling, broadcast efficiency
- **Resilience**: Connection recovery, error isolation

#### 3. **General WebSocket Integration** (`websocket-general.integration.spec.ts`)

- **Multi-Namespace**: Cross-namespace authentication and isolation
- **Concurrent Operations**: Simultaneous operations across namespaces
- **Rate Limiting**: Namespace-specific rate limit enforcement
- **Resource Management**: Memory usage, connection lifecycle
- **Error Recovery**: Graceful handling of failures and reconnections

## 🛠️ Testing Infrastructure

### WebSocket Test Helper (`websocket-test-helper.ts`)

A comprehensive testing utility providing:

```typescript
interface WebSocketTestSetup {
  app: INestApplication;
  jwtService: JwtService;
  generateToken: (user: TestUser) => string;
  createAuthenticatedSocket: (
    user: TestUser,
    namespace?: string
  ) => Promise<Socket>;
  cleanup: () => Promise<void>;
}
```

**Key Features:**

- JWT token generation for authenticated connections
- Automatic socket cleanup and resource management
- Event waiting utilities with timeouts
- Emit-and-wait patterns for request/response testing
- Connection status monitoring

### Test Users (`testUsers`)

Pre-configured test user fixtures:

- **Alice**: Regular user for general testing
- **Bob**: Regular user for peer-to-peer interactions
- **Admin**: Administrator user for elevated permissions testing

## 🚀 Running Tests

### Individual Test Suites

```bash
# Run all WebSocket tests
npm run test:websocket

# Run specific test suites
npm run test:websocket:chat        # Chat functionality tests
npm run test:websocket:activity    # Activity events tests
npm run test:websocket:general     # Cross-cutting concerns
```

### Manual Test Execution

```bash
# Run with custom Jest configuration
npx jest --testPathPattern="websocket" --verbose --detectOpenHandles

# Run with coverage
npx jest --testPathPattern="websocket" --coverage --coverageDirectory=coverage/websocket
```

### Test Environment Setup

The tests automatically configure:

- **Test Database**: Isolated test environment
- **Redis Mocking**: Disabled for faster test execution
- **JWT Strategy**: Mocked for consistent token generation
- **File Upload Service**: Mocked for upload operations
- **Random Ports**: Avoids port conflicts in parallel testing

## 📊 Test Scenarios Covered

### Authentication & Authorization

- ✅ Valid JWT token acceptance
- ✅ Invalid/missing token rejection
- ✅ Token expiration handling
- ✅ User-specific room assignment
- ✅ Spoofing attack prevention

### Room Management

- ✅ Private room creation and joining
- ✅ Message isolation between rooms
- ✅ Namespace-specific room handling
- ✅ Cross-namespace isolation
- ✅ Room cleanup on disconnection

### Message Broadcasting

- ✅ Real-time message delivery
- ✅ Multi-client simultaneous broadcasting
- ✅ Event sequencing and ordering
- ✅ High-frequency message handling
- ✅ Broadcast performance monitoring

### Rate Limiting & Security

- ✅ Message rate limit enforcement
- ✅ Burst traffic handling
- ✅ Content validation and sanitization
- ✅ Malformed payload rejection
- ✅ Resource exhaustion prevention

### Error Handling & Resilience

- ✅ Connection interruption recovery
- ✅ Server error isolation
- ✅ Malformed data handling
- ✅ Timeout management
- ✅ Graceful degradation

## 🔧 Test Architecture

### Connection Lifecycle

```
1. Test Setup → 2. Authenticated Connection → 3. Operation Testing → 4. Cleanup
```

### Event Flow Testing

```
Emit Event → Wait for Response → Validate Data → Verify Side Effects
```

### Error Scenario Testing

```
Trigger Error → Monitor Response → Validate Recovery → Check Isolation
```

## 📈 Performance Benchmarks

The tests validate:

- **Connection Time**: < 2 seconds for authenticated connections
- **Message Latency**: < 500ms for real-time message delivery
- **Broadcast Efficiency**: < 1 second for multi-client broadcasting
- **Memory Usage**: < 50MB increase during burst testing
- **Recovery Time**: < 3 seconds for reconnection scenarios

## 🐛 Debugging Failed Tests

### Common Issues & Solutions

#### Connection Timeouts

```typescript
// Increase timeout for slow test environments
await helper.waitForEvent(socket, 'event', 10000);
```

#### Memory Issues

```typescript
// Force garbage collection between tests
if (global.gc) {
  global.gc();
}
```

#### Port Conflicts

```typescript
// Tests automatically use random ports to avoid conflicts
const port = helper.getServerPort();
```

#### Race Conditions

```typescript
// Use proper async/await patterns
const response = await helper.emitAndWaitForResponse(
  socket,
  'emit',
  data,
  'response'
);
```

## 📝 Test Maintenance

### Adding New Test Cases

1. **Identify Scenario**: Determine what functionality to test
2. **Create Test User**: Use existing fixtures or add new ones
3. **Set Up Connections**: Use `createAuthenticatedSocket` helper
4. **Execute Operations**: Use emit/wait patterns for interactions
5. **Validate Results**: Check both success and error scenarios
6. **Clean Up**: Ensure all sockets are properly disconnected

### Extending Test Infrastructure

1. **Add Test Helpers**: Extend `WebSocketTestHelper` for new patterns
2. **Create Fixtures**: Add new test users or data fixtures
3. **Update Configuration**: Modify Jest config for new requirements
4. **Add Monitoring**: Include performance and memory monitoring

## 🎯 Best Practices

### Test Organization

- **One Concept Per Test**: Each test should validate a single behavior
- **Descriptive Names**: Use clear, descriptive test names
- **Arrange-Act-Assert**: Follow AAA pattern for test structure
- **Independent Tests**: Tests should not depend on each other

### Resource Management

- **Always Cleanup**: Use `afterAll` and `afterEach` for cleanup
- **Mock External Services**: Isolate tests from external dependencies
- **Monitor Resources**: Track memory and connection usage
- **Timeout Handling**: Set appropriate timeouts for async operations

### Error Handling

- **Expect Errors**: Test both success and failure scenarios
- **Validate Error Types**: Check specific error types and messages
- **Recovery Testing**: Verify system recovery from error states
- **Graceful Degradation**: Test behavior under failure conditions

This comprehensive test suite ensures the reliability and performance of DojoPool's WebSocket infrastructure, covering all critical user flows and edge cases.
