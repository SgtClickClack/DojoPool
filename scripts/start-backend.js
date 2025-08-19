#!/usr/bin/env node

// Simple backend startup script that avoids ts-node compilation issues
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting DojoPool Backend...');

// Use ts-node with specific options to avoid frontend environment issues
const backendProcess = spawn(
  'npx',
  [
    'ts-node',
    '--project',
    'tsconfig.backend.json',
    '--skip-project',
    'src/backend/index.ts',
  ],
  {
    stdio: 'inherit',
    cwd: process.cwd(),
  }
);

backendProcess.on('error', (error) => {
  console.error('Backend startup error:', error);
  process.exit(1);
});

backendProcess.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code);
});
