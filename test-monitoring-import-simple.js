// Simple test to verify monitoring import resolution
const { spawn } = require('child_process');

console.log('Testing monitoring import resolution...');

const test = spawn('npx', ['ts-node', '-e', 'import("./src/config/monitoring").then(() => console.log("✅ Monitoring import successful")).catch(err => console.error("❌ Import failed:", err.message))'], {
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