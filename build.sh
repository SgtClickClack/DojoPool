#!/bin/bash
# DojoPool Build Script
# This script demonstrates how to use the modern CMake build system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BUILD_TYPE="Release"
CLEAN_BUILD=false
RUN_TESTS=false
RUN_ANALYSIS=false
PACKAGE=false
PRESET="default"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)
            BUILD_TYPE="Debug"
            PRESET="debug"
            shift
            ;;
        --release)
            BUILD_TYPE="Release"
            PRESET="release"
            shift
            ;;
        --relwithdebinfo)
            BUILD_TYPE="RelWithDebInfo"
            PRESET="relwithdebinfo"
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --test)
            RUN_TESTS=true
            shift
            ;;
        --analyze)
            RUN_ANALYSIS=true
            shift
            ;;
        --package)
            PACKAGE=true
            shift
            ;;
        --clang)
            PRESET="clang"
            shift
            ;;
        --gcc)
            PRESET="gcc"
            shift
            ;;
        --msvc)
            PRESET="msvc"
            shift
            ;;
        --help)
            echo "DojoPool Build Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --debug          Build in Debug mode"
            echo "  --release        Build in Release mode (default)"
            echo "  --relwithdebinfo Build in RelWithDebInfo mode"
            echo "  --clean          Clean build directory before building"
            echo "  --test           Run unit tests after building"
            echo "  --analyze        Run static analysis tools"
            echo "  --package        Create distribution packages"
            echo "  --clang          Use Clang compiler"
            echo "  --gcc            Use GCC compiler"
            echo "  --msvc           Use MSVC compiler (Windows only)"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 DojoPool Modern CMake Build System${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if we're in the right directory
if [[ ! -f "CMakeLists.txt" ]]; then
    echo -e "${RED}Error: CMakeLists.txt not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Clean build if requested
if [[ "$CLEAN_BUILD" == true ]]; then
    echo -e "${YELLOW}🧹 Cleaning build directory...${NC}"
    rm -rf build/
fi

# Create build directory
echo -e "${BLUE}📁 Creating build directory...${NC}"
mkdir -p build/

# Configure with CMake
echo -e "${BLUE}⚙️  Configuring with CMake (preset: $PRESET)...${NC}"
if ! cmake --preset "$PRESET"; then
    echo -e "${RED}❌ CMake configuration failed${NC}"
    exit 1
fi

# Build the project
echo -e "${BLUE}🔨 Building project...${NC}"
if ! cmake --build build/"$PRESET" --config "$BUILD_TYPE"; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Run tests if requested
if [[ "$RUN_TESTS" == true ]]; then
    echo -e "${BLUE}🧪 Running tests...${NC}"
    if ! cmake --build build/"$PRESET" --target test; then
        echo -e "${RED}❌ Some tests failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ All tests passed!${NC}"
fi

# Run static analysis if requested
if [[ "$RUN_ANALYSIS" == true ]]; then
    echo -e "${BLUE}🔍 Running static analysis...${NC}"

    # Run circular dependency check
    if [[ -f "cmake/check_circular_deps.py" ]]; then
        echo -e "${BLUE}  Checking circular dependencies...${NC}"
        if python3 cmake/check_circular_deps.py src/; then
            echo -e "${GREEN}  ✅ No circular dependencies found${NC}"
        else
            echo -e "${RED}  ❌ Circular dependencies detected${NC}"
        fi
    fi

    # Run IWYU analysis
    if command -v include-what-you-use &> /dev/null; then
        echo -e "${BLUE}  Running IWYU analysis...${NC}"
        if python3 cmake/run_iwyu.py build/"$PRESET" src/; then
            echo -e "${GREEN}  ✅ IWYU analysis completed${NC}"
        else
            echo -e "${YELLOW}  ⚠️  IWYU suggestions found${NC}"
        fi
    else
        echo -e "${YELLOW}  ⚠️  IWYU not found, skipping header analysis${NC}"
    fi
fi

# Create packages if requested
if [[ "$PACKAGE" == true ]]; then
    echo -e "${BLUE}📦 Creating distribution packages...${NC}"
    if ! cmake --build build/"$PRESET" --target package; then
        echo -e "${RED}❌ Package creation failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Packages created successfully!${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}🎉 Build process completed!${NC}"
echo ""
echo -e "${BLUE}Build artifacts:${NC}"
echo -e "  Binaries:    build/$PRESET/bin/"
echo -e "  Libraries:   build/$PRESET/lib/"
if [[ "$PACKAGE" == true ]]; then
    echo -e "  Packages:    build/$PRESET/"
fi
echo ""
echo -e "${BLUE}Available targets:${NC}"
echo -e "  cmake --build build/$PRESET --target <target>"
echo -e "  Available targets: all, test, install, package, quality_check, iwyu, check_circular_deps"

echo ""
echo -e "${YELLOW}💡 Pro tips:${NC}"
echo -e "  • Use 'cmake --preset $PRESET' to reconfigure"
echo -e "  • Use 'cmake --build build/$PRESET --target quality_check' for full analysis"
echo -e "  • Use 'cmake --build build/$PRESET --target install' to install"
echo -e "  • Use 'cmake --build build/$PRESET --target package' to create distributables"
