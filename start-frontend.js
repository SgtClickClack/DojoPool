const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting DojoPool Frontend Development Server...');

// Start Vite development server
const viteProcess = spawn('npx', ['vite', '--port', '3000'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
});

viteProcess.on('error', (error) => {
    console.error('❌ Failed to start Vite server:', error.message);
});

viteProcess.on('close', (code) => {
    console.log(`🛑 Vite server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down frontend server...');
    viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    viteProcess.kill('SIGTERM');
});