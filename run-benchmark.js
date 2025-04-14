const { spawn } = require('child_process');
const path = require('path');

// Get the directory of this script
const scriptDir = __dirname;

// Change to the script directory
process.chdir(scriptDir);

console.log('Setting up environment for network transport benchmark...');

// Function to run a command
function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, {
            stdio: 'inherit',
            shell: true
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });
    });
}

// Main function to run the benchmark
async function runBenchmark() {
    try {
        // Install dependencies if needed
        if (!require('fs').existsSync('node_modules')) {
            console.log('Installing dependencies...');
            await runCommand('npm', ['install']);
        }

        // Ensure ts-node and other required packages are installed
        if (!require('fs').existsSync('node_modules/ts-node')) {
            console.log('Installing ts-node and required packages...');
            await runCommand('npm', ['install', 'ts-node', '@types/node', 'typescript', 'tsconfig-paths']);
        }

        console.log('Running network transport benchmark...');

        // Run the benchmark
        await runCommand('npx', [
            'ts-node',
            '--project', 'tsconfig.json',
            '--transpile-only',
            '--require', 'tsconfig-paths/register',
            'src/tests/benchmarks/NetworkTransport.bench.ts'
        ]);

        console.log('Benchmark completed successfully.');
    } catch (error) {
        console.error('Error running benchmark:', error.message);
        process.exit(1);
    }
}

// Run the benchmark
runBenchmark(); 