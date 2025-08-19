// Test script to verify frontend build
import { spawn } from 'child_process';

console.log('Testing Next.js build...');

const build = spawn('npm', ['run', 'build'], {
  stdio: 'pipe',
  shell: true,
});

build.stdout.on('data', (data) => {
  console.log('BUILD OUTPUT:', data.toString());
});

build.stderr.on('data', (data) => {
  console.error('BUILD ERROR:', data.toString());
});

build.on('close', (code) => {
  console.log(`Build process exited with code ${code}`);
  if (code === 0) {
    console.log('✅ Build successful! Frontend should work properly.');
  } else {
    console.log('❌ Build failed. Check errors above.');
  }
});

build.on('error', (error) => {
  console.error('Process error:', error);
});

// Kill after 2 minutes to prevent hanging
setTimeout(() => {
  console.log('Killing build process after 2 minutes...');
  build.kill();
}, 120000);
