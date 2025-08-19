// Test script to capture backend error
import { spawn } from 'child_process';

console.log('Starting backend test to capture error...');

const backend = spawn(
  'node',
  ['--loader', 'ts-node/esm', '--no-warnings', 'src/backend/index.ts'],
  {
    stdio: 'pipe',
    shell: true,
  }
);

backend.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

backend.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

backend.on('error', (error) => {
  console.error('Process error:', error);
});

// Kill after 10 seconds to prevent hanging
setTimeout(() => {
  console.log('Killing backend process after 10 seconds...');
  backend.kill();
}, 10000);
