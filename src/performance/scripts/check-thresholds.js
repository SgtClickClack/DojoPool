const fs = require('fs');

// Load metrics
const metrics = JSON.parse(fs.readFileSync('performance-metrics.json', 'utf8'));

// Define thresholds
const thresholds = {
  response: {
    average: 200, // ms
    p95: 500, // ms
  },
  memory: {
    average: 256, // MB
    maximum: 512, // MB
  },
  cpu: {
    average: 50, // %
    maximum: 80, // %
  },
};

// Check thresholds
const violations = [];

// Response time checks
if (metrics.avgResponseTime > thresholds.response.average) {
  violations.push({
    metric: 'Average Response Time',
    value: metrics.avgResponseTime.toFixed(2),
    threshold: thresholds.response.average,
    unit: 'ms',
  });
}

if (metrics.p95ResponseTime > thresholds.response.p95) {
  violations.push({
    metric: '95th Percentile Response Time',
    value: metrics.p95ResponseTime.toFixed(2),
    threshold: thresholds.response.p95,
    unit: 'ms',
  });
}

// Memory usage checks
if (metrics.avgMemoryUsage > thresholds.memory.average) {
  violations.push({
    metric: 'Average Memory Usage',
    value: metrics.avgMemoryUsage.toFixed(2),
    threshold: thresholds.memory.average,
    unit: 'MB',
  });
}

if (metrics.maxMemoryUsage > thresholds.memory.maximum) {
  violations.push({
    metric: 'Maximum Memory Usage',
    value: metrics.maxMemoryUsage.toFixed(2),
    threshold: thresholds.memory.maximum,
    unit: 'MB',
  });
}

// CPU usage checks
if (metrics.avgCpuUsage > thresholds.cpu.average) {
  violations.push({
    metric: 'Average CPU Usage',
    value: metrics.avgCpuUsage.toFixed(2),
    threshold: thresholds.cpu.average,
    unit: '%',
  });
}

// Output results
if (violations.length > 0) {
  console.error('❌ Performance threshold violations detected:');
  violations.forEach((v) => {
    console.error(`
    Metric: ${v.metric}
    Current Value: ${v.value}${v.unit}
    Threshold: ${v.threshold}${v.unit}
    `);
  });
  process.exit(1);
} else {
  console.log('✅ All performance thresholds passed');
  process.exit(0);
}
