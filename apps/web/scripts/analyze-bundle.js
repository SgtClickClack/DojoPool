#!/usr/bin/env node

/**
 * Bundle analysis script for DojoPool frontend
 * Helps identify bundle size issues and optimization opportunities
 */

/* eslint-env node */
/* eslint-disable no-console */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 DojoPool Bundle Analysis\n');

// Check if @next/bundle-analyzer is available
try {
  execSync('npx @next/bundle-analyzer --help', { stdio: 'ignore' });
  console.log('✅ @next/bundle-analyzer is available');
} catch (error) {
  console.log('❌ @next/bundle-analyzer not found. Install with: npm install --save-dev @next/bundle-analyzer');
}

// Check package.json for unused dependencies
console.log('\n📦 Checking for unused dependencies...');
try {
  const depcheckOutput = execSync('npx depcheck --json', { encoding: 'utf8' });
  const depcheck = JSON.parse(depcheckOutput);
  
  if (depcheck.dependencies && Object.keys(depcheck.dependencies).length > 0) {
    console.log('⚠️  Unused dependencies found:');
    Object.keys(depcheck.dependencies).forEach(dep => {
      console.log(`   - ${dep}`);
    });
  } else {
    console.log('✅ No unused dependencies found');
  }
  
  if (depcheck.devDependencies && Object.keys(depcheck.devDependencies).length > 0) {
    console.log('⚠️  Unused devDependencies found:');
    Object.keys(depcheck.devDependencies).forEach(dep => {
      console.log(`   - ${dep}`);
    });
  }
} catch (error) {
  console.log('❌ Error running depcheck:', error.message);
}

// Check for large files in node_modules
console.log('\n📊 Checking for large dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Known large dependencies to watch
  const largeDeps = [
    'framer-motion',
    'maplibre-gl',
    '@react-google-maps/api',
    'react-quill-new',
    '@mui/material',
    '@mui/icons-material'
  ];
  
  largeDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`   📦 ${dep}: ${dependencies[dep]}`);
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check Next.js config optimizations
console.log('\n⚙️  Checking Next.js configuration...');
try {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8');
  
  const optimizations = [
    { check: 'optimizePackageImports', name: 'Package import optimization' },
    { check: 'splitChunks', name: 'Bundle splitting' },
    { check: 'dynamic', name: 'Dynamic imports' },
    { check: 'compress', name: 'Compression' },
    { check: 'swcMinify', name: 'SWC minification' }
  ];
  
  optimizations.forEach(opt => {
    if (nextConfig.includes(opt.check)) {
      console.log(`   ✅ ${opt.name} enabled`);
    } else {
      console.log(`   ⚠️  ${opt.name} not found`);
    }
  });
} catch (error) {
  console.log('❌ Error reading next.config.js:', error.message);
}

console.log('\n🎯 Optimization Recommendations:');
console.log('   1. Use dynamic imports for heavy components (maps, charts, editors)');
console.log('   2. Enable optimizePackageImports for MUI components');
console.log('   3. Split large vendor chunks into smaller ones');
console.log('   4. Remove unused dependencies');
console.log('   5. Consider Vercel Pro for higher build limits');
console.log('   6. Use Next.js Image optimization for all images');
console.log('   7. Enable compression and minification');

console.log('\n📈 To analyze bundle size:');
console.log('   npm run build && npx @next/bundle-analyzer .next/static/chunks/');
