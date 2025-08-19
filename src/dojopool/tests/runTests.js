const jest = require('jest');
const path = require('path');

const runTests = async () => {
  try {
    const configPath = path.join(__dirname, 'jest.config.js');

    // Run tests with coverage
    const result = await jest.runCLI(
      {
        config: configPath,
        coverage: true,
        ci: true,
        maxWorkers: 2,
        silent: false,
        verbose: true,
      },
      [process.cwd()]
    );

    // Check if all tests passed
    if (result.results.success) {
      console.log('\n✅ All tests passed successfully!');

      // Log coverage summary
      const coverage = result.results.coverageMap;
      if (coverage) {
        console.log('\nCoverage Summary:');
        console.log('------------------');
        console.log(
          `Statements: ${coverage.getCoverageSummary().statements.pct}%`
        );
        console.log(`Branches: ${coverage.getCoverageSummary().branches.pct}%`);
        console.log(
          `Functions: ${coverage.getCoverageSummary().functions.pct}%`
        );
        console.log(`Lines: ${coverage.getCoverageSummary().lines.pct}%`);
      }
    } else {
      console.error('\n❌ Some tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error running tests:', error);
    process.exit(1);
  }
};

// Run the tests
runTests();
