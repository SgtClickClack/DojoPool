# DojoPool Performance Testing Suite

A comprehensive performance testing suite for the DojoPool platform, designed to ensure optimal performance, scalability, and reliability under various load conditions.

## 🚀 Features

- **Load Testing**: Simulate realistic user traffic patterns
- **Stress Testing**: Test system limits and failure points
- **Spike Testing**: Handle sudden traffic bursts
- **API Benchmarking**: Detailed performance metrics
- **Real-time Monitoring**: Continuous performance tracking
- **WebSocket Testing**: Real-time feature performance
- **Comprehensive Reporting**: Multiple report formats

## 📁 Project Structure

```
performance-tests/
├── load-tests/           # Load testing configurations
│   ├── dashboard-load.yml    # Dashboard-specific load tests
│   └── websocket-load.yml    # WebSocket load testing
├── stress-tests/         # Stress testing configurations
│   ├── api-stress.yml        # API stress testing
│   └── spike-test.yml        # Traffic spike testing
├── benchmark/           # Benchmarking utilities
│   └── api-benchmark.js      # API performance benchmarking
├── utils/               # Utility scripts
│   ├── performance-monitor.js # Real-time monitoring
│   ├── websocket-processor.js # WebSocket test processor
│   └── generate-report.js     # Report generation
├── reports/             # Generated reports (auto-created)
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## 🛠️ Installation

1. **Navigate to the performance tests directory:**

   ```bash
   cd performance-tests
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Ensure DojoPool is running:**
   ```bash
   # Make sure your DojoPool application is running on localhost:3000
   # For WebSocket tests, ensure the WebSocket server is on localhost:3001
   ```

## 🧪 Running Tests

### Load Testing

```bash
# Run dashboard load test
npm run test:load

# Run WebSocket load test
npm run test:websocket
```

### Stress Testing

```bash
# Run API stress test
npm run test:stress

# Run spike test
npm run test:spike

# Run all tests
npm run test:all
```

### Benchmarking

```bash
# Run API benchmarking
npm run benchmark:api

# Run database benchmarking
npm run benchmark:db
```

### Monitoring

```bash
# Start performance monitoring (5 minutes)
npm run monitor:performance

# Custom monitoring duration (10 minutes, 2 second intervals)
node utils/performance-monitor.js --duration 600000 --interval 2000
```

### Reporting

```bash
# Generate comprehensive report
npm run report:generate

# Generate specific report type
node utils/generate-report.js load
node utils/generate-report.js stress
node utils/generate-report.js benchmark
node utils/generate-report.js monitor
```

## 📊 Test Configurations

### Load Test Phases

- **Warm-up**: Gradual increase to normal load
- **Load Testing**: Sustained realistic traffic
- **Peak Load**: Maximum expected traffic
- **Cool-down**: Gradual decrease to baseline

### Stress Test Scenarios

- **User Authentication**: Login/logout stress
- **Tournament Operations**: Registration and management
- **Match Creation**: Real-time match setup
- **Inventory Operations**: Item management
- **Analytics Tracking**: Event tracking
- **Notification System**: Real-time notifications
- **File Upload**: Media upload handling

### WebSocket Test Scenarios

- **Tournament Updates**: Live tournament feeds
- **Match Updates**: Real-time match data
- **Chat System**: Live messaging
- **Spectator Mode**: Match spectating

## 📈 Metrics Collected

### Performance Metrics

- **Response Time**: Average, min, max, percentiles (P50, P95, P99)
- **Throughput**: Requests per second
- **Success Rate**: Percentage of successful requests
- **Error Rate**: Types and frequency of errors
- **Status Codes**: Distribution of HTTP status codes

### System Metrics

- **CPU Usage**: Core and overall utilization
- **Memory Usage**: RAM and heap allocation
- **Network I/O**: Bandwidth consumption
- **Disk I/O**: Storage performance
- **Database Connections**: Connection pool usage

### WebSocket Metrics

- **Connection Count**: Active connections
- **Message Rate**: Messages per second
- **Latency**: Message round-trip time
- **Connection Duration**: Session length
- **Error Rate**: WebSocket errors

## 📋 Report Formats

### JSON Reports

Detailed raw data for programmatic analysis:

```json
{
  "metadata": {
    "startTime": "2024-01-15T10:30:00Z",
    "duration": 300000,
    "totalSamples": 60
  },
  "summary": {
    "successRate": 99.2,
    "avgResponseTime": 245.8,
    "p95ResponseTime": 512.3
  },
  "recommendations": [...]
}
```

### HTML Reports

Interactive web reports with charts and graphs for stakeholder review.

### Text Summaries

Human-readable executive summaries for quick assessment.

## 🎯 Performance Thresholds

### Target Metrics

- **Response Time**: < 500ms (P95)
- **Success Rate**: > 99.5%
- **Throughput**: > 1000 req/sec
- **Error Rate**: < 0.5%
- **Availability**: > 99.9%

### Critical Alerts

- Response time > 1000ms (P95)
- Success rate < 95%
- Error rate > 5%
- Memory usage > 85%
- CPU usage > 80%

## 🔧 Configuration

### Environment Variables

```bash
# Target application URL
TARGET_URL=http://localhost:3000

# WebSocket server URL
WS_URL=ws://localhost:3001

# Test duration (milliseconds)
TEST_DURATION=300000

# Connection count
CONNECTIONS=50

# Authentication token (for authenticated tests)
JWT_TOKEN=your-jwt-token
```

### Custom Test Scenarios

Create new test files in the appropriate directories:

**Load Test Example:**

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  scenarios:
    - name: 'Custom Test'
      flow:
        - get:
            url: '/api/custom-endpoint'
```

**Stress Test Example:**

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 120
      arrivalRate: 100
scenarios:
  - name: 'Custom Stress Test'
    flow:
      - post:
          url: '/api/custom-endpoint'
          json:
            data: '{{ $randomString }}'
```

## 🚨 Monitoring & Alerts

### Real-time Monitoring

```bash
# Start monitoring with alerts
node utils/performance-monitor.js --alerts true

# Monitor specific endpoints
node utils/performance-monitor.js --endpoints "/api/dashboard,/api/tournaments"
```

### Automated CI/CD Integration

```yaml
# .github/workflows/performance.yml
name: Performance Tests
on: [push, pull_request]
jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd performance-tests && npm install
      - name: Run performance tests
        run: cd performance-tests && npm run ci:performance
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: performance-tests/reports/
```

## 📚 Best Practices

### Test Design

- **Realistic Scenarios**: Base tests on actual user behavior patterns
- **Progressive Load**: Start with normal load, gradually increase
- **Mixed Workloads**: Combine different types of requests
- **Error Scenarios**: Include invalid requests and error conditions

### Environment Setup

- **Isolated Environment**: Use dedicated test environment
- **Clean State**: Reset database between test runs
- **Resource Monitoring**: Monitor both application and infrastructure
- **Baseline Comparison**: Compare results against established baselines

### Result Analysis

- **Trend Analysis**: Look for performance degradation over time
- **Bottleneck Identification**: Pinpoint slow components
- **Scalability Assessment**: Test horizontal and vertical scaling
- **Regression Detection**: Automated comparison with previous results

## 🤝 Contributing

1. **Add New Tests**: Create test configurations in appropriate directories
2. **Update Documentation**: Keep README and inline comments current
3. **Performance Standards**: Ensure new tests meet established thresholds
4. **Report Improvements**: Enhance reporting and visualization features

## 📞 Support

For questions or issues:

- Check existing GitHub issues
- Review test logs and reports
- Consult performance baseline documentation
- Contact the DevOps/SRE team

---

**Remember**: Performance testing is an ongoing process. Regular testing ensures your application remains fast, reliable, and scalable as it grows! 🚀
