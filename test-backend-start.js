// Simple test to start the minimal backend server
import { spawn } from 'child_process';

console.log('🚀 Starting DojoPool Backend Test...');

// Start the minimal backend server
const backend = spawn(
  'node',
  ['--loader', 'ts-node/esm', '--no-warnings', 'src/backend/index-minimal.ts'],
  {
    stdio: 'inherit',
    shell: true,
  }
);

backend.on('error', (error) => {
  console.error('❌ Backend failed to start:', error.message);
  process.exit(1);
});

backend.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

// Test connection after 3 seconds
setTimeout(async () => {
  try {
    const response = await fetch('http://localhost:8080/api/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is running successfully!');
      console.log('Health check response:', data);
    } else {
      console.log('❌ Backend health check failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Failed to connect to backend:', error.message);
  }

  // Kill the backend process
  backend.kill();
  process.exit(0);
}, 3000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping backend test...');
  backend.kill();
  process.exit(0);
});
