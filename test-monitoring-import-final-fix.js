// Test script to verify monitoring import fix without .js extension
const { spawn } = require('child_process');

console.log('Testing monitoring import without .js extension...');

const test = spawn('npx', ['ts-node', '--project', 'tsconfig.backend.json', '-e', `
try {
  const monitoring = require('./src/config/monitoring');
  console.log('✅ Monitoring import successful');
  console.log('Available exports:', Object.keys(monitoring));
} catch (error) {
  console.error('❌ Import failed:', error.message);
}
`], {
  stdio: 'pipe',
  shell: true
});

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
  
  if (code === 0 && output.includes('✅')) {
    console.log('✅ Monitoring import fix is working!');
  } else {
    console.log('❌ Monitoring import may still have issues');
  }
});