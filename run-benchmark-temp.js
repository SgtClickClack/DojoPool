const path = require('path');
require('ts-node').register();
const benchmarkPath = path.resolve(__dirname, 'src/tests/benchmarks/NetworkTransport.bench.ts');
console.log('Running benchmark from:', benchmarkPath);
require(benchmarkPath); 