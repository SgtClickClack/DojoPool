# Tests CMakeLists.txt

# Find Google Test
find_package(GTest REQUIRED)
include(GoogleTest)

# Enable testing
enable_testing()

# Add unit tests
add_subdirectory(unit)

# Add integration tests
add_subdirectory(integration)

# Test coverage target (if gcov is available)
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    option(CODE_COVERAGE "Enable code coverage" OFF)
    if(CODE_COVERAGE)
        add_custom_target(coverage
            COMMAND ${CMAKE_COMMAND} --build ${CMAKE_BINARY_DIR} --target test
            COMMAND lcov --capture --directory . --output-file coverage.info
            COMMAND lcov --remove coverage.info '/usr/*' '*/tests/*' '*/build/*' --output-file coverage.info
            COMMAND genhtml coverage.info --output-directory coverage-report
            WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
            COMMENT "Generating code coverage report"
        )
    endif()
endif()
