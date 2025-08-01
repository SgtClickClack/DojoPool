// Simple test to verify monitoring import works
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
  stdio: 'inherit',
  shell: true
});

test.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Test completed successfully');
  } else {
    console.log('❌ Test failed with exit code:', code);
  }
});