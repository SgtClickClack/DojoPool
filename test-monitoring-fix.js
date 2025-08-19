// Test script to verify monitoring import fix
const { spawn } = require('child_process');

console.log('Testing backend with monitoring import fixes...');

const test = spawn(
  'node',
  [
    '-e',
    `
try {
  console.log('Testing import resolution...');
  // This will test if the monitoring module can be resolved
  const path = require('path');
  const fs = require('fs');
  
  const monitoringPath = path.join(__dirname, 'src', 'config', 'monitoring.ts');
  const backendPath = path.join(__dirname, 'src', 'backend', 'index.ts');
  
  if (fs.existsSync(monitoringPath)) {
    console.log('✅ monitoring.ts exists');
  } else {
    console.log('❌ monitoring.ts not found');
  }
  
  if (fs.existsSync(backendPath)) {
    console.log('✅ backend/index.ts exists');
    const content = fs.readFileSync(backendPath, 'utf8');
    if (content.includes("from '../config/monitoring.js'")) {
      console.log('✅ monitoring import has .js extension');
    } else {
      console.log('❌ monitoring import missing .js extension');
    }
  }
  
  console.log('Import path test completed');
} catch (error) {
  console.error('Test failed:', error.message);
}
`,
  ],
  {
    stdio: 'pipe',
    shell: true,
  }
);

let output = '';
let errorOutput = '';

test.stdout.on('data', (data) => {
  output += data.toString();
});

test.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

test.on('close', (code) => {
  console.log('Test output:', output);
  if (errorOutput) {
    console.log('Errors:', errorOutput);
  }
  console.log(`Test exit code: ${code}`);
});
