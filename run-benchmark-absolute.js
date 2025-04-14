const path = require('path');

// Get absolute paths
const rootDir = path.resolve(__dirname);
const tsConfigPath = path.join(rootDir, 'tsconfig.json');
const benchmarkPath = path.join(rootDir, 'src', 'tests', 'benchmarks', 'NetworkTransport.bench.ts');

// Register ts-node with absolute paths
require('ts-node').register({
    project: tsConfigPath,
    transpileOnly: true
});

console.log('Running benchmark from:', benchmarkPath);

// Run the benchmark
require(benchmarkPath); 