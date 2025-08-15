const fs = require('fs');
const path = require('path');

// Create necessary directories
const dirs = [
  '.github/workflows',
  'cypress/reports/performance',
  'cypress/results/performance',
  'scripts'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create GitHub Actions workflow
const workflowYaml = `name: Performance Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # Run daily at midnight

jobs:
  performance:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Cypress
      run: npx cypress install

    - name: Run performance tests
      run: |
        npx cypress run --spec "cypress/e2e/performance/**/*.cy.ts" --browser chrome --headless
      env:
        CYPRESS_PERFORMANCE_MODE: true
        CYPRESS_RECORD_KEY: \${{ secrets.CYPRESS_RECORD_KEY }}

    - name: Generate performance report
      run: node scripts/generate-performance-report.js

    - name: Upload performance results
      uses: actions/upload-artifact@v2
      with:
        name: performance-report
        path: cypress/reports/performance

    - name: Check performance thresholds
      run: |
        node scripts/check-performance-thresholds.js
      env:
        FAIL_ON_THRESHOLD_BREACH: true

    - name: Comment PR with performance results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v4
      with:
        script: |
          const fs = require('fs');
          const report = JSON.parse(fs.readFileSync('cypress/reports/performance/report.json', 'utf8'));
          
          const summary = \`## Performance Test Results
          
          - Total Tests: \${report.summary.totalTests}
          - Passed: \${report.summary.passedTests}
          - Failed: \${report.summary.failedTests}
          - Average Score: \${report.summary.averageScore.toFixed(2)}%
          
          \${report.summary.failedTests > 0 ? '### Failed Metrics\\n\\n' + report.metrics
            .filter(m => !m.passed)
            .map(m => \`- \${m.name}: \${m.value}\${m.unit} (Threshold: \${m.threshold}\${m.unit})\`)
            .join('\\n') : ''}
          \`;
          
          github.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: summary
          });`;

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
  'report:performance': 'node scripts/generate-performance-report.js'
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('Updated package.json');

console.log('\nPerformance testing infrastructure setup complete! 🎉'); 