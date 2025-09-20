const fs = require('fs');

// Create necessary directories
const dirs = [
  '.github/workflows',
  'cypress/reports/performance',
  'cypress/results/performance',
  'scripts',
];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create GitHub Actions workflow
const workflowYaml = `name: Performance Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 0 * * *'  # Run daily at midnight

jobs:
  performance:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Cypress
      run: npx cypress install

    - name: Create reports directory
      run: mkdir -p cypress/reports/performance

    - name: Run performance tests
      run: |
        npx cypress run --spec "cypress/e2e/performance/**/*.cy.ts" --browser chrome --headless
      env:
        CYPRESS_PERFORMANCE_MODE: true
        CYPRESS_RECORD_KEY: \${{ secrets.CYPRESS_RECORD_KEY }}

    - name: Generate performance report
      run: node scripts/generate-performance-report.js
      continue-on-error: true

    - name: Upload performance results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: performance-report
        path: cypress/reports/performance
        retention-days: 30

    - name: Check performance thresholds
      run: |
        node scripts/check-performance-thresholds.js
      env:
        FAIL_ON_THRESHOLD_BREACH: true
      continue-on-error: true

    - name: Comment PR with performance results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const path = require('path');

          // Check if report file exists
          const reportPath = path.join(process.cwd(), 'cypress/reports/performance/report.json');
          if (!fs.existsSync(reportPath)) {
            console.log('Performance report not found, skipping comment');
            return;
          }

          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

          const summary = \`## Performance Test Results

          | Metric | Value | Budget | Status |
          |--------|--------|--------|--------|
          \`;

          // Add table rows for each metric
          let tableRows = '';
          if (report.metrics && Array.isArray(report.metrics)) {
            report.metrics.forEach(metric => {
              const status = metric.passed ? '✅' : '❌';
              tableRows += \`| \${metric.name} | \${metric.value}\${metric.unit} | \${metric.threshold}\${metric.unit} | \${status} |\\n\`;
            });
          }

          const finalSummary = summary + tableRows;

          // Only comment if we have a valid PR context
          if (context.issue && context.issue.number) {
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: finalSummary
            });
          } else {
            console.log('No PR context available, skipping comment');
          }`;

fs.writeFileSync('.github/workflows/performance.yml', workflowYaml);
console.log('Created GitHub Actions workflow');

// Create README
const readmeContent = `# Performance Testing Infrastructure

This directory contains the performance testing infrastructure for DojoPool.

## Directory Structure

- \`.github/workflows/performance.yml\`: GitHub Actions workflow for performance testing
- \`cypress/reports/performance\`: Performance test reports
- \`cypress/results/performance\`: Raw performance test results
- \`scripts\`: Performance testing scripts

## Running Performance Tests

To run performance tests locally:

\`\`\`bash
npm run test:performance
\`\`\`

## Performance Thresholds

Performance thresholds are defined in \`cypress/config/performance-thresholds.ts\`.

## Reports

Performance reports are generated in HTML and JSON formats in \`cypress/reports/performance\`.

## CI/CD Integration

Performance tests are run:
- On every push to main
- On every pull request
- Daily at midnight

Failed performance thresholds will block PR merges.
`;

fs.writeFileSync('PERFORMANCE_TESTING.md', readmeContent);
console.log('Created README');

// Add npm scripts
const packageJson = require('../package.json');
packageJson.scripts = {
  ...packageJson.scripts,
  'test:performance': 'cypress run --spec "cypress/e2e/performance/**/*.cy.ts"',
  'report:performance': 'node scripts/generate-performance-report.js',
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('Updated package.json');

console.log('\nPerformance testing infrastructure setup complete! 🎉');
