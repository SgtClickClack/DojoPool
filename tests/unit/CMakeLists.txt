# Unit tests CMakeLists.txt

set(UNIT_TEST_SOURCES
    test_physics_types.cpp
    test_ball_physics.cpp
    test_table_physics.cpp
    test_collision_detection.cpp
    test_pool_physics.cpp
    test_logging.cpp
)

# Create unit test executable
add_executable(dojopool_unit_tests ${UNIT_TEST_SOURCES})

# Include directories
target_include_directories(dojopool_unit_tests
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_SOURCE_DIR}/src
)

# Link dependencies
target_link_libraries(dojopool_unit_tests
    PRIVATE
        GTest::gtest_main
        dojopool_physics
        dojopool_core
)

# Compiler options for tests
target_compile_options(dojopool_unit_tests PRIVATE
    $<$<CXX_COMPILER_ID:GNU>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:Clang>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:MSVC>:/W4>
)

# Discover tests
gtest_discover_tests(dojopool_unit_tests
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    PROPERTIES
        ENVIRONMENT "GTEST_COLOR=1"
)

# Test labels
set_tests_properties(${dojopool_unit_tests} PROPERTIES
    LABELS "unit"
    TIMEOUT 30
)
