// Test script to check if the blank page issue is resolved
import { spawn } from 'child_process';

console.log('🔍 Testing DojoPool blank page fix...');
console.log('📝 MapView component has been temporarily disabled');
console.log('🚀 Starting Next.js development server...');

// Start Next.js development server
const frontend = spawn('npx', ['next', 'dev'], {
  stdio: 'pipe',
  shell: true,
});

let serverReady = false;

frontend.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('Frontend:', output.trim());

  if (output.includes('Ready') || output.includes('started server on')) {
    serverReady = true;
    console.log('✅ Next.js server is ready!');

    // Test the page after a short delay
    setTimeout(testPage, 2000);
  }
});

frontend.stderr.on('data', (data) => {
  const error = data.toString();
  console.error('Frontend Error:', error.trim());
});

async function testPage() {
  try {
    console.log('🧪 Testing page at http://localhost:3000...');
    const response = await fetch('http://localhost:3000');

    if (response.ok) {
      const html = await response.text();

      if (html.includes('DojoPool - Debug Mode')) {
        console.log('✅ SUCCESS: Page is rendering correctly!');
        console.log('🎯 The issue was with the MapView component');
        console.log(
          '📋 Next steps: Fix the MapView component or provide alternative'
        );
      } else if (html.length > 100) {
        console.log('⚠️  Page is loading but content might be different');
        console.log('📄 HTML length:', html.length);
      } else {
        console.log('❌ Page is still blank or has minimal content');
        console.log('📄 HTML content:', html.substring(0, 200));
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
  process.exit(0);
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

// Timeout after 30 seconds
setTimeout(() => {
  if (!serverReady) {
    console.log('⏰ Test timeout - server did not start in time');
    frontend.kill();
    process.exit(1);
  }
}, 30000);
