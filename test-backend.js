// Simple test to check if backend can compile
const { spawn } = require('child_process');

console.log('Testing backend compilation...');

const tsc = spawn(
  'npx',
  ['tsc', '--noEmit', '--project', 'tsconfig.backend.json'],
  {
    stdio: 'pipe',
    shell: true,
  }
);

let output = '';
let errorOutput = '';

tsc.stdout.on('data', (data) => {
  output += data.toString();
});

tsc.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

tsc.on('close', (code) => {
  console.log(`TypeScript compilation exit code: ${code}`);
  if (output) {
    console.log('STDOUT:', output);
  }
  if (errorOutput) {
    console.log('STDERR:', errorOutput);
  }

  if (code === 0) {
    console.log('✅ Backend TypeScript compilation successful!');
  } else {
    console.log('❌ Backend TypeScript compilation failed');
  }
});
