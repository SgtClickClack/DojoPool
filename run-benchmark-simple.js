// Register ts-node
require('ts-node').register({
    project: 'tsconfig.json',
    transpileOnly: true
});

// Run the benchmark
require('./src/tests/benchmarks/NetworkTransport.bench.ts'); 