const { execSync } = require('child_process');
const fs = require('fs');

async function updateDependencies() {
    try {
        console.log('📦 Checking for updates...');
        
        // Backup package.json
        fs.copyFileSync('package.json', 'package.json.backup');
        
        // Update dependencies
        console.log('⬆️  Updating dependencies...');
        execSync('npm update', { stdio: 'inherit' });
        
        // Check for major version updates
        console.log('🔍 Checking for major version updates...');
        execSync('npx npm-check-updates -u', { stdio: 'inherit' });
        
        // Install updated versions
        console.log('📥 Installing updates...');
        execSync('npm install', { stdio: 'inherit' });
        
        // Run tests
        console.log('🧪 Running tests...');
        execSync('npm run test', { stdio: 'inherit' });
        
        // Run build
        console.log('🏗️  Building project...');
        execSync('npm run build', { stdio: 'inherit' });
        
        console.log('✅ Dependencies successfully updated!');
        
        // Remove backup if everything succeeded
        fs.unlinkSync('package.json.backup');
        
    } catch (error) {
        console.error('❌ Error updating dependencies:', error);
        
        // Restore from backup if something failed
        if (fs.existsSync('package.json.backup')) {
            console.log('🔄 Restoring from backup...');
            fs.copyFileSync('package.json.backup', 'package.json');
            fs.unlinkSync('package.json.backup');
            execSync('npm install', { stdio: 'inherit' });
        }
        
        process.exit(1);
    }
}

updateDependencies(); 