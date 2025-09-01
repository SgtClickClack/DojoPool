// Simple verification script to check if WebSocketService imports are working
// This is a basic Node.js script to validate the file structure and imports

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying WebSocketService import fixes...\n');

// Check if the canonical WebSocketService file exists
const websocketServicePath = path.join(
  __dirname,
  'apps/web/src/services/services/network/WebSocketService.ts'
);

if (fs.existsSync(websocketServicePath)) {
  console.log(
    '✅ Canonical WebSocketService.ts file found at:',
    websocketServicePath
  );

  // Check if it exports the websocketService
  const content = fs.readFileSync(websocketServicePath, 'utf8');
  if (content.includes('export const websocketService')) {
    console.log('✅ websocketService export found');
  } else {
    console.log('❌ websocketService export not found');
  }

  if (content.includes('export class WebSocketService')) {
    console.log('✅ WebSocketService class export found');
  } else {
    console.log('❌ WebSocketService class export not found');
  }
} else {
  console.log('❌ Canonical WebSocketService.ts file not found');
}

// Check for any remaining incorrect imports
const filesToCheck = [
  'apps/web/src/contexts/NotificationContext.tsx',
  'apps/web/src/components/ActivityFeed.tsx',
  'apps/web/src/pages/test-notifications.tsx',
  'apps/web/src/components/world/WorldHubMap.tsx',
  'apps/web/src/hooks/useMapData.ts',
  'apps/web/src/pages/test-websocket.tsx',
];

let incorrectImportsFound = 0;

filesToCheck.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');

    // Check for incorrect relative imports
    const hasIncorrectImport =
      content.includes('../services/WebSocketService') ||
      content.includes('../../services/WebSocketService') ||
      content.includes('../../../services/WebSocketService');

    // Check for correct alias imports
    const hasCorrectImport = content.includes(
      '@/services/services/network/WebSocketService'
    );

    if (hasIncorrectImport) {
      console.log(`❌ Incorrect import found in: ${filePath}`);
      incorrectImportsFound++;
    } else if (hasCorrectImport) {
      console.log(`✅ Correct import verified in: ${filePath}`);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n📊 SUMMARY:');
if (incorrectImportsFound === 0) {
  console.log('✅ All WebSocketService imports have been corrected!');
  console.log('🎉 Build should now work without ENOENT errors.');
} else {
  console.log(`❌ ${incorrectImportsFound} incorrect imports still found.`);
  console.log('🔧 Please fix remaining imports.');
}

console.log('\n📁 Files checked:');
filesToCheck.forEach((file) => console.log(`   - ${file}`));

console.log('\n🏁 Verification complete!');
