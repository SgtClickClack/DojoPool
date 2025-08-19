// Test script to verify _document.tsx compilation fix
import { spawn } from 'child_process';

console.log('🔍 Testing Next.js _document.tsx compilation fix...');
console.log('🗑️ Build cache has been cleared');
console.log('🚀 Testing Next.js build process...');

// Test Next.js build to see if _document.tsx compiles properly
const build = spawn('npx', ['next', 'build'], {
  stdio: 'pipe',
  shell: true,
});

let buildSuccess = false;
let buildOutput = '';

build.stdout.on('data', (data) => {
  const output = data.toString();
  buildOutput += output;
  console.log('Build:', output.trim());

  if (
    output.includes('Compiled successfully') ||
    output.includes('✓ Compiled')
  ) {
    buildSuccess = true;
  }
});

build.stderr.on('data', (data) => {
  const error = data.toString();
  console.error('Build Error:', error.trim());

  if (error.includes('ENOENT') && error.includes('_document.js')) {
    console.log('❌ SAME ERROR: _document.js compilation still failing');
  }
});

build.on('close', (code) => {
  console.log(`\n📊 Build process finished with code: ${code}`);

  if (code === 0 && buildSuccess) {
    console.log('✅ SUCCESS: _document.tsx compilation fixed!');
    console.log('🎯 Next.js can now properly compile the document file');
  } else if (code !== 0) {
    console.log('❌ BUILD FAILED: There may be other compilation issues');
  } else {
    console.log('⚠️  Build completed but success unclear');
  }

  process.exit(code);
});

build.on('error', (error) => {
  console.error('❌ Failed to start build process:', error.message);
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping build test...');
  build.kill();
  process.exit(0);
});

// Timeout after 60 seconds
setTimeout(() => {
  console.log('⏰ Build test timeout - stopping process');
  build.kill();
  process.exit(1);
}, 60000);
