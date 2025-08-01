// Test script to verify monitoring import fix
const fs = require('fs');
const path = require('path');

console.log('Testing monitoring import fix...');

try {
  // Check if the backend index.ts has the correct import
  const backendPath = path.join(__dirname, 'src', 'backend', 'index.ts');
  const content = fs.readFileSync(backendPath, 'utf8');
  
  if (content.includes("from '../config/monitoring.js'")) {
    console.log('✅ Backend index.ts has correct monitoring import with .js extension');
  } else if (content.includes("from '../config/monitoring'")) {
    console.log('❌ Backend index.ts still has monitoring import without .js extension');
  } else {
    console.log('❌ No monitoring import found in backend index.ts');
  }
  
  // Check if monitoring.ts exists
  const monitoringPath = path.join(__dirname, 'src', 'config', 'monitoring.ts');
  if (fs.existsSync(monitoringPath)) {
    console.log('✅ monitoring.ts file exists');
    
    // Check exports
    const monitoringContent = fs.readFileSync(monitoringPath, 'utf8');
    const requiredExports = ['logger', 'httpLogger', 'errorLogger', 'performanceLogger', 'metricsMiddleware', 'healthCheck', 'gracefulShutdown'];
    
    let allExportsFound = true;
    requiredExports.forEach(exportName => {
      if (monitoringContent.includes(`export const ${exportName}`)) {
        console.log(`✅ ${exportName} export found`);
      } else {
        console.log(`❌ ${exportName} export missing`);
        allExportsFound = false;
      }
    });
    
    if (allExportsFound) {
      console.log('✅ All required exports are present in monitoring.ts');
      console.log('✅ Monitoring import fix should resolve the ERR_MODULE_NOT_FOUND error');
    }
  } else {
    console.log('❌ monitoring.ts file not found');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}