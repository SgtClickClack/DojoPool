const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure wasm-pack is installed
try {
  execSync('wasm-pack --version');
} catch (error) {
  console.log('Installing wasm-pack...');
  execSync('cargo install wasm-pack');
}

// Build the WebAssembly module
console.log('Building WebAssembly module...');
execSync('wasm-pack build src/frame-processor --target web', {
  stdio: 'inherit',
});

// Create pkg directory if it doesn't exist
const pkgDir = path.join(__dirname, 'src', 'dojopool', 'static', 'js', 'wasm');
if (!fs.existsSync(pkgDir)) {
  fs.mkdirSync(pkgDir, { recursive: true });
}

// Copy WebAssembly files to the static directory
const wasmPkg = path.join(__dirname, 'src', 'frame-processor', 'pkg');
fs.readdirSync(wasmPkg).forEach((file) => {
  fs.copyFileSync(path.join(wasmPkg, file), path.join(pkgDir, file));
});

console.log('WebAssembly build complete!');
