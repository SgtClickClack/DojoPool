import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function runTypeCheck() {
    console.log('🔍 Starting TypeScript type checking...');

    try {
        // Run TypeScript compiler in noEmit mode with stricter checks
        console.log('\n📝 Running tsc...');
        execSync('tsc --noEmit --strict --pretty', { 
            stdio: 'inherit',
            encoding: 'utf-8'
        });

        // Check for proper type imports in Next.js pages and API routes
        console.log('\n🔍 Checking Next.js specific types...');
        execSync('tsc --project tsconfig.json --noEmit --pretty', {
            stdio: 'inherit',
            encoding: 'utf-8'
        });

        // Additional checks for React component props
        console.log('\n✨ Validating React component types...');
        execSync('tsc --jsx react-jsx --noEmit --pretty', {
            stdio: 'inherit',
            encoding: 'utf-8'
        });

        console.log('\n✅ Type checking completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Type checking failed:', error);
        process.exit(1);
    }
}

// Add this script to your package.json scripts:
// "type-check:enhanced": "ts-node scripts/type-check.ts"

runTypeCheck(); 