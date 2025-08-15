// Test script to verify monitoring import fix (ESM)
import { spawn } from 'node:child_process';

console.log('Testing monitoring import with .js extension...');

const test = spawn('node', ['--loader', 'ts-node/esm', 'scripts/monitoring-import-check.ts'], {
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