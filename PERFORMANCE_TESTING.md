# Performance Testing Infrastructure

This directory contains the performance testing infrastructure for DojoPool.

## Directory Structure

- `.github/workflows/performance.yml`: GitHub Actions workflow for performance testing
- `cypress/reports/performance`: Performance test reports
- `cypress/results/performance`: Raw performance test results
- `scripts`: Performance testing scripts

## Running Performance Tests

To run performance tests locally:

```bash
npm run test:performance
```

## Performance Thresholds

Performance thresholds are defined in `cypress/config/performance-thresholds.ts`.

## Reports

Performance reports are generated in HTML and JSON formats in `cypress/reports/performance`.

## CI/CD Integration

Performance tests are run:

- On every push to main
- On every pull request
- Daily at midnight

Failed performance thresholds will block PR merges.
