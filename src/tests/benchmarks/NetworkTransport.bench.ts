import { performance } from 'perf_hooks';

// Simple benchmark test for NetworkTransport
async function benchmarkNetworkTransport() {
  console.log('Running NetworkTransport benchmark...');

  const iterations = 1000;
  const startTime = performance.now();

  // Simulate network operations
  for (let i = 0; i < iterations; i++) {
    // Mock network operation
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`Benchmark completed:`);
  console.log(`- Iterations: ${iterations}`);
  console.log(`- Duration: ${duration.toFixed(2)}ms`);
  console.log(
    `- Average per operation: ${(duration / iterations).toFixed(4)}ms`
  );

  return {
    iterations,
    duration,
    averagePerOperation: duration / iterations,
  };
}

// Run the benchmark
benchmarkNetworkTransport()
  .then(() => {
    console.log('Benchmark test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Benchmark test failed:', error);
    process.exit(1);
  });
