# DojoPool Modern CMake Build System

This document describes the modern CMake build system that has been implemented for the DojoPool project. The system provides a robust, modular, and scalable foundation for building, testing, and distributing the DojoPool physics engine.

## 🎯 Overview

The new build system implements:

- **Modular Architecture**: Clean separation of libraries and executables
- **Modern CMake Practices**: Target-based configuration with proper dependency management
- **Static Analysis**: Integrated clang-tidy and IWYU for code quality
- **Comprehensive Testing**: CTest integration for unit and integration tests
- **Cross-Platform Packaging**: CPack support for distribution
- **CI/CD Ready**: Standardized presets and automated quality checks

## 📁 Project Structure

```
DojoPool/
├── CMakeLists.txt              # Root CMake configuration
├── CMakePresets.json           # Build presets for different configurations
├── .clang-tidy                 # Static analysis configuration
├── .iwyu                       # Include-What-You-Use configuration
├── build.sh                    # Build automation script
├── cmake/
│   ├── CPackConfig.cmake       # Packaging configuration
│   ├── check_circular_deps.py  # Circular dependency checker
│   └── run_iwyu.py            # IWYU analysis runner
├── src/                        # Source code
│   ├── CMakeLists.txt          # Source configuration
│   ├── core/                   # Core utilities library
│   ├── physics/                # Physics engine library
│   └── [other modules]/
├── tests/                      # Test suite
│   ├── CMakeLists.txt
│   ├── unit/                   # Unit tests
│   └── integration/            # Integration tests
└── apps/                       # Applications and examples
    └── web/
        └── src/
            └── wasm/           # WebAssembly module
```

## 🚀 Quick Start

### Prerequisites

- CMake 3.20 or later
- C++17 compatible compiler (GCC 8+, Clang 8+, MSVC 2019+)
- Python 3.6+ (for analysis tools)
- Optional: clang-tidy, include-what-you-use, Google Test

### Basic Build

```bash
# Clone and enter the project directory
cd DojoPool

# Configure and build (default preset)
cmake --preset default
cmake --build build/default

# Run tests
cmake --build build/default --target test

# Install
cmake --build build/default --target install
```

### Using the Build Script

The provided `build.sh` script simplifies the build process:

```bash
# Basic release build
./build.sh --release

# Debug build with tests
./build.sh --debug --test

# Full analysis build
./build.sh --analyze --test

# Create distribution packages
./build.sh --package
```

## ⚙️ Build Presets

The `CMakePresets.json` file defines standardized build configurations:

| Preset           | Description              | Compiler       | Build Type     |
| ---------------- | ------------------------ | -------------- | -------------- |
| `default`        | Default configuration    | System default | Release        |
| `debug`          | Debug build with symbols | System default | Debug          |
| `release`        | Optimized release build  | System default | Release        |
| `relwithdebinfo` | Release with debug info  | System default | RelWithDebInfo |
| `clang`          | Force Clang compiler     | Clang          | Release        |
| `gcc`            | Force GCC compiler       | GCC            | Release        |
| `msvc`           | MSVC build (Windows)     | MSVC           | Release        |
| `emscripten`     | WebAssembly build        | Emscripten     | Release        |

Usage:

```bash
# Use specific preset
cmake --preset clang
cmake --build build/clang
```

## 🧪 Testing

The build system integrates CTest for comprehensive testing:

```bash
# Run all tests
cmake --build build/default --target test

# Run specific test
ctest --test-dir build/default -R physics_test

# Run tests with verbose output
ctest --test-dir build/default -V
```

### Test Structure

- **Unit Tests**: Located in `tests/unit/`
- **Integration Tests**: Located in `tests/integration/`
- **Test Discovery**: Automatic discovery using Google Test

## 🔍 Static Analysis

### Clang-Tidy

Automatically runs during compilation if available:

```bash
# Manual clang-tidy run
clang-tidy src/**/*.cpp src/**/*.hpp -- -I src/
```

### Include-What-You-Use (IWYU)

Checks for proper header inclusion:

```bash
# Run IWYU analysis
cmake --build build/default --target iwyu
```

### Circular Dependency Check

Detects circular dependencies in the codebase:

```bash
# Check for circular dependencies
cmake --build build/default --target check_circular_deps
```

### Quality Check Suite

Run all quality checks at once:

```bash
# Full quality analysis
cmake --build build/default --target quality_check
```

## 📦 Packaging

Create distribution packages using CPack:

```bash
# Create packages
cmake --build build/default --target package

# List available package generators
cpack --help
```

Supported package formats:

- **TGZ/ZIP**: Cross-platform archives
- **DEB**: Debian packages (Linux)
- **RPM**: Red Hat packages (Linux)
- **NSIS**: Windows installer

## 🏗️ Architecture

### Library Structure

The build system creates the following libraries:

- **dojopool_core**: Core utilities and logging
- **dojopool_physics**: Physics engine implementation
- **dojopool\_[module]**: Additional modular libraries

### Modern CMake Practices

- **Target-based**: All configuration uses `target_*` commands
- **Proper Dependencies**: Clear PUBLIC/PRIVATE/INTERFACE distinctions
- **Export Configuration**: Proper CMake package export
- **Cross-platform**: Works on Windows, macOS, and Linux
- **IDE Integration**: Generates compile_commands.json for IDEs

### Compiler Warnings

All targets enable comprehensive warnings:

- GCC/Clang: `-Wall -Wextra -Wpedantic -Werror`
- MSVC: `/W4 /WX`

### Build Types

Support for all standard CMake build types:

- **Debug**: Full debugging, no optimizations
- **Release**: Optimized, no debug info
- **RelWithDebInfo**: Optimized with debug symbols
- **MinSizeRel**: Size-optimized

## 🐛 Troubleshooting

### Common Issues

1. **CMake version too old**

   ```bash
   cmake --version  # Should be 3.20+
   ```

2. **Missing dependencies**

   ```bash
   # Ubuntu/Debian
   sudo apt-get install build-essential cmake clang-tidy python3

   # macOS
   brew install cmake llvm python3

   # Windows (Chocolatey)
   choco install cmake ninja python
   ```

3. **IWYU not found**
   - IWYU is optional; the build will work without it
   - Install from package manager or build from source

### Debug Build

For debugging build issues:

```bash
# Verbose CMake output
cmake --preset debug -DCMAKE_VERBOSE_MAKEFILE=ON

# Clean rebuild
rm -rf build/ && ./build.sh --clean --debug
```

## 🤝 Contributing

When contributing to the build system:

1. **Test your changes**: Run the full test suite
2. **Check quality**: Run static analysis tools
3. **Update documentation**: Keep this README current
4. **Follow conventions**: Use the established patterns

### Adding New Modules

1. Create module directory under `src/`
2. Add `CMakeLists.txt` with target definitions
3. Update `src/CMakeLists.txt` to include the new module
4. Add appropriate tests in `tests/unit/`
5. Update documentation

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `test_*.cpp`
3. Use Google Test framework
4. Add to `tests/unit/CMakeLists.txt`
5. Run tests to verify

## 📋 Build System Checklist

Before committing changes:

- [ ] CMake configuration works (`cmake --preset default`)
- [ ] Project builds successfully (`cmake --build build/default`)
- [ ] All tests pass (`cmake --build build/default --target test`)
- [ ] Static analysis clean (`cmake --build build/default --target quality_check`)
- [ ] No circular dependencies (`cmake --build build/default --target check_circular_deps`)
- [ ] Cross-platform compatibility verified
- [ ] Documentation updated

## 🔗 References

- [CMake Documentation](https://cmake.org/cmake/help/latest/)
- [Modern CMake](https://cliutils.gitlab.io/modern-cmake/)
- [CTest Documentation](https://cmake.org/cmake/help/latest/manual/ctest.1.html)
- [CPack Documentation](https://cmake.org/cmake/help/latest/manual/cpack.1.html)
- [Google Test](https://google.github.io/googletest/)
- [Clang-Tidy](https://clang.llvm.org/extra/clang-tidy/)
- [Include-What-You-Use](https://include-what-you-use.org/)
