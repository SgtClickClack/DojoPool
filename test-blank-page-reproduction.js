// Test script to reproduce the blank page issue
import { spawn } from 'child_process';

console.log('🔍 Testing DojoPool blank page issue...');
console.log('🚀 Starting Next.js development server...');

// Start Next.js development server
const frontend = spawn('npx', ['next', 'dev'], {
  stdio: 'pipe',
  shell: true,
});

let serverReady = false;
let testCompleted = false;

frontend.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('Frontend:', output.trim());

  if (output.includes('Ready') || output.includes('started server on')) {
    serverReady = true;
    console.log('✅ Next.js server is ready!');

    // Test the page after a short delay
    setTimeout(testBlankPage, 3000);
  }
});

frontend.stderr.on('data', (data) => {
  const error = data.toString();
  console.error('Frontend Error:', error.trim());
});

async function testBlankPage() {
  if (testCompleted) return;
  testCompleted = true;

  try {
    console.log('🧪 Testing page at http://localhost:3000...');
    const response = await fetch('http://localhost:3000');

    if (response.ok) {
      const html = await response.text();

      console.log('📄 Response status:', response.status);
      console.log('📄 HTML length:', html.length);

      if (html.length < 500) {
        console.log('❌ BLANK PAGE DETECTED - HTML content too short');
        console.log('📄 HTML preview:', html.substring(0, 300));
      } else if (
        html.includes('DojoPool World Map') ||
        html.includes('Loading DojoPool')
      ) {
        console.log('✅ Page is rendering MapView component');
      } else if (html.includes('Google Maps API key not configured')) {
        console.log('⚠️  MapView showing API key error fallback');
      } else {
        console.log('⚠️  Page loaded but content unclear');
        console.log('📄 HTML preview:', html.substring(0, 300));
      }
    } else {
      console.log(
        '❌ Failed to load page:',
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.log('❌ Failed to test page:', error.message);
  }

  // Clean up
  console.log('🛑 Stopping test server...');
  frontend.kill();
  setTimeout(() => process.exit(0), 1000);
}

frontend.on('error', (error) => {
  console.error('❌ Failed to start frontend:', error.message);
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping test...');
  frontend.kill();
  process.exit(0);
});

// Timeout after 45 seconds
setTimeout(() => {
  if (!testCompleted) {
    console.log('⏰ Test timeout - stopping server');
    frontend.kill();
    process.exit(1);
  }
}, 45000);
