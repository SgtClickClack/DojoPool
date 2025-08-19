// Test script to isolate backend crash
console.log('Starting backend crash test...');

async function testBackend() {
  try {
    console.log('Testing basic Node.js functionality...');

    // Test 1: Basic ES module imports
    console.log('Test 1: Testing basic ES module imports...');
    const express = await import('express');
    console.log('✓ Express import successful');

    // Test 2: Backend module import (this might be the issue)
    console.log('Test 2: Testing backend module import...');
    const backend = await import('./src/backend/index.ts');
    console.log('✓ Backend module import successful');
  } catch (error) {
    console.error('✗ Test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testBackend()
  .then(() => {
    console.log('Test script completed');
  })
  .catch((error) => {
    console.error('✗ Async test failed:', error);
    console.log('Test script completed with errors');
  });
