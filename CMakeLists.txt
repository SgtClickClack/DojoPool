cmake_minimum_required(VERSION 3.20 FATAL_ERROR)

# Set project name and version
project(DojoPool VERSION 1.0.0 LANGUAGES CXX C)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Enable folder organization in IDEs
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

# Set output directories
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# Include CMake built-in modules
include(GNUInstallDirs)
include(CMakePackageConfigHelpers)
include(CTest)

# Include CPack for packaging
include(cmake/CPackConfig.cmake)

# Find required packages
find_package(Threads REQUIRED)

# Enable testing if BUILD_TESTING is ON
if(BUILD_TESTING)
    enable_testing()
endif()

# Add subdirectories for modular components
add_subdirectory(src)

# Add tests if enabled
if(BUILD_TESTING)
    add_subdirectory(tests)
endif()

# Add WebAssembly module if Emscripten is available
if(EMSCRIPTEN)
    add_subdirectory(apps/web/src/wasm)
endif()

# Installation
install(EXPORT DojoPoolTargets
    FILE DojoPoolTargets.cmake
    NAMESPACE DojoPool::
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/DojoPool
)

# Generate and install package configuration files
configure_package_config_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/cmake/DojoPoolConfig.cmake.in
    ${CMAKE_CURRENT_BINARY_DIR}/DojoPoolConfig.cmake
    INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/DojoPool
)

write_basic_package_version_file(
    ${CMAKE_CURRENT_BINARY_DIR}/DojoPoolConfigVersion.cmake
    VERSION ${PROJECT_VERSION}
    COMPATIBILITY SameMajorVersion
)

install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/DojoPoolConfig.cmake
    ${CMAKE_CURRENT_BINARY_DIR}/DojoPoolConfigVersion.cmake
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/DojoPool
)

# Print project summary
# Static analysis and quality checks
find_program(CLANG_TIDY_EXE clang-tidy)
find_program(IWYU_EXE include-what-you-use)
find_program(PYTHON_EXE python3 python)

# Add clang-tidy target
if(CLANG_TIDY_EXE)
    set(CMAKE_CXX_CLANG_TIDY ${CLANG_TIDY_EXE})
    message(STATUS "Clang-tidy enabled")
endif()

# Add IWYU target
if(IWYU_EXE AND PYTHON_EXE)
    add_custom_target(iwyu
        COMMAND ${PYTHON_EXE} ${CMAKE_SOURCE_DIR}/cmake/run_iwyu.py
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        COMMENT "Running Include-What-You-Use analysis"
    )
    message(STATUS "IWYU analysis target added")
endif()

# Circular dependency check
if(PYTHON_EXE)
    add_custom_target(check_circular_deps
        COMMAND ${PYTHON_EXE} ${CMAKE_SOURCE_DIR}/cmake/check_circular_deps.py ${CMAKE_SOURCE_DIR}/src
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        COMMENT "Checking for circular dependencies"
    )
    message(STATUS "Circular dependency check target added")
endif()

# Add quality check target that runs all static analysis
add_custom_target(quality_check
    COMMENT "Running all quality checks"
)

if(TARGET check_circular_deps)
    add_dependencies(quality_check check_circular_deps)
endif()

if(TARGET iwyu)
    add_dependencies(quality_check iwyu)
endif()

message(STATUS "DojoPool Build Configuration:")
message(STATUS "  Version: ${PROJECT_VERSION}")
message(STATUS "  C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "  Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "  Testing: ${BUILD_TESTING}")
message(STATUS "  Emscripten: ${EMSCRIPTEN}")
message(STATUS "  Clang-tidy: ${CLANG_TIDY_EXE}")
message(STATUS "  IWYU: ${IWYU_EXE}")
message(STATUS "  Install Prefix: ${CMAKE_INSTALL_PREFIX}")
