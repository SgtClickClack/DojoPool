import { performance } from 'perf_hooks';

async function benchmarkNetworkTransport() {
  console.log('Running NetworkTransport benchmark...');

  const iterations = 1000;
  const startTime = performance.now();

  // Simulate network operations
  for (let i = 0; i < iterations; i++) {
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

  return { iterations, duration, averagePerOperation: duration / iterations };
}

benchmarkNetworkTransport()
  .then((results) => {
    console.log('Benchmark results:', results);
  })
  .catch((error) => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
