const fs = require('fs');
const path = require('path');

// Read performance thresholds
const thresholds = require('../cypress/config/performance-thresholds');

// Read latest performance report
const reportPath = path.join(__dirname, '../cypress/reports/performance/report.json');
const report = JSON.parse(fs.readFileSync(reportPath));

// Check thresholds
const violations = [];

Object.entries(report.metrics).forEach(([name, data]) => {
  const category = name.split('.')[0].toLowerCase();
  const metric = name.split('.')[1];
  
  if (thresholds[category] && thresholds[category][metric]) {
    const threshold = thresholds[category][metric];
    
    if (data.avg > threshold) {
      violations.push({
        metric: name,
        value: data.avg,
        threshold,
        percentOver: ((data.avg - threshold) / threshold * 100).toFixed(2)
      });
    }
  }
});

// Generate report
console.log('\nPerformance Threshold Check Report');
console.log('==================================');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`Total Metrics Checked: ${Object.keys(report.metrics).length}`);
console.log(`Violations Found: ${violations.length}`);

if (violations.length > 0) {
  console.log('\nThreshold Violations:');
  violations.forEach(v => {
    console.log(`\n- ${v.metric}`);
    console.log(`  Value: ${v.value}`);
    console.log(`  Threshold: ${v.threshold}`);
    console.log(`  Exceeded by: ${v.percentOver}%`);
  });

  // If FAIL_ON_THRESHOLD_BREACH is set, exit with error
  if (process.env.FAIL_ON_THRESHOLD_BREACH === 'true') {
    console.error('\nPerformance thresholds exceeded. Check the report for details.');
    process.exit(1);
  }
} else {
  console.log('\nAll performance metrics are within acceptable thresholds! 🎉');
}

// Save violations report
const reportDir = path.join(__dirname, '../cypress/reports/performance');
fs.writeFileSync(
  path.join(reportDir, 'violations.json'),
  JSON.stringify({ violations, timestamp: new Date().toISOString() }, null, 2)
); 