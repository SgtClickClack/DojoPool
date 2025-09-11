// Simple script to start DojoPool servers
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting DojoPool servers...');

// Start frontend server
console.log('Starting frontend server...');
const frontendPath = path.join(__dirname, 'apps', 'web');
const frontendProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: frontendPath,
  stdio: 'inherit',
  shell: true,
});

frontendProcess.on('error', (error) => {
  console.error('Frontend server error:', error);
});

// Start backend server after a short delay
setTimeout(() => {
  console.log('Starting backend server...');
  const backendPath = path.join(__dirname, 'services', 'api');
  const backendProcess = spawn('npm', ['run', 'start:dev'], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true,
  });

  backendProcess.on('error', (error) => {
    console.error('Backend server error:', error);
  });
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping servers...');
  frontendProcess.kill();
  process.exit(0);
});

console.log('⏳ Servers are starting...');
console.log('Frontend: http://localhost:3000');
console.log('Backend: http://localhost:3002');
console.log('Press Ctrl+C to stop');
