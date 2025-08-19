#!/usr/bin/env node

/**
 * Minimal backend test to isolate the server crash issue
 * This will test the basic server setup without complex imports
 */

process.on('uncaughtException', (err, origin) => {
  console.error('----- UNCAUGHT EXCEPTION -----');
  console.error('Caught exception:', err);
  console.error('Exception origin:', origin);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('----- UNHANDLED REJECTION -----');
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

console.log('🔍 Testing minimal backend setup...\n');

async function testMinimalBackend() {
  try {
    console.log('1. Testing basic imports...');

    // Test basic Node.js modules
    const express = await import('express');
    console.log('✅ Express imported successfully');

    const http = await import('http');
    console.log('✅ HTTP module imported successfully');

    // Test creating express app
    const app = express.default();
    console.log('✅ Express app created successfully');

    // Test basic middleware
    app.use(express.default.json());
    console.log('✅ JSON middleware added successfully');

    // Test basic route
    app.get('/test', (req, res) => {
      res.json({ status: 'ok', message: 'Minimal backend working' });
    });
    console.log('✅ Test route added successfully');

    // Test server creation
    const server = http.createServer(app);
    console.log('✅ HTTP server created successfully');

    // Test server listening
    const port = 8081; // Use different port to avoid conflicts

    await new Promise((resolve, reject) => {
      server.listen(port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ Server listening on port ${port}`);
          resolve();
        }
      });
    });

    // Test server shutdown
    server.close(() => {
      console.log('✅ Server closed successfully');
    });

    console.log('\n🎉 Minimal backend test completed successfully!');
    console.log('The issue is likely in the complex imports or configuration.');
  } catch (error) {
    console.error('\n❌ Minimal backend test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    console.log('\n🔍 This suggests a fundamental issue with:');
    console.log('- Node.js installation');
    console.log('- Package dependencies');
    console.log('- TypeScript/ES module configuration');

    process.exit(1);
  }
}

testMinimalBackend();
