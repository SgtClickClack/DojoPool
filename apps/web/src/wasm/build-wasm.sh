#!/bin/bash

# DojoPool WebAssembly Build Script
# Builds the pool physics engine for WebAssembly

set -e

echo "🔧 DojoPool WebAssembly Build Script"
echo "===================================="

# Check if Emscripten is available
if ! command -v em++ &> /dev/null; then
    echo "❌ Emscripten not found. Please install Emscripten first:"
    echo "   https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Check if CMake is available
if ! command -v cmake &> /dev/null; then
    echo "❌ CMake not found. Please install CMake."
    exit 1
fi

# Create build directory
BUILD_DIR="build"
if [ ! -d "$BUILD_DIR" ]; then
    mkdir -p "$BUILD_DIR"
    echo "📁 Created build directory: $BUILD_DIR"
fi

cd "$BUILD_DIR"

# Configure with CMake for Emscripten
echo "🔧 Configuring with CMake..."
emcmake cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_CXX_FLAGS="-O3 -flto" \
    -DCMAKE_EXE_LINKER_FLAGS="-O3 -flto"

# Build the project
echo "🏗️  Building WebAssembly module..."
make -j$(nproc)

# Check if build was successful
if [ -f "pool-physics.js" ] && [ -f "pool-physics.wasm" ]; then
    echo "✅ Build successful!"
    echo "📦 Generated files:"
    echo "   - pool-physics.js (${ls -lh pool-physics.js | awk '{print $5}'})"
    echo "   - pool-physics.wasm (${ls -lh pool-physics.wasm | awk '{print $5}'})"

    # Copy to public directory for web serving
    PUBLIC_DIR="../../../public/wasm"
    mkdir -p "$PUBLIC_DIR"

    cp pool-physics.js "$PUBLIC_DIR/"
    cp pool-physics.wasm "$PUBLIC_DIR/"

    echo "📤 Copied to public directory: $PUBLIC_DIR"

    # Generate build info
    echo "{
  \"buildTime\": \"$(date -Iseconds)\",
  \"emscriptenVersion\": \"$(emcc --version | head -n 1)\",
  \"optimization\": \"O3\",
  \"features\": [
    \"pool-physics-engine\",
    \"trajectory-calculation\",
    \"collision-detection\",
    \"spin-effects\"
  ]
}" > "$PUBLIC_DIR/build-info.json"

    echo "📊 Build info generated"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🎉 WebAssembly module ready for deployment!"
echo "💡 Usage in JavaScript:"
echo "   import poolPhysicsWasm from '/wasm/pool-physics.js';"
echo "   await poolPhysicsWasm.initialize();"
echo "   // Use physics engine methods..."
