# Physics library CMakeLists.txt

set(PHYSICS_SOURCES
    pool_physics.cpp
    ball_physics.cpp
    table_physics.cpp
    collision_detection.cpp
)

set(PHYSICS_HEADERS
    pool_physics.hpp
    ball_physics.hpp
    table_physics.hpp
    collision_detection.hpp
    physics_types.hpp
)

# Create physics library
add_library(dojopool_physics ${PHYSICS_SOURCES} ${PHYSICS_HEADERS})

# Set target properties
set_target_properties(dojopool_physics PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION ${PROJECT_VERSION_MAJOR}
    OUTPUT_NAME "dojopool-physics"
)

# Include directories
target_include_directories(dojopool_physics
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>
        $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
)

# Link dependencies
target_link_libraries(dojopool_physics
    PUBLIC
        Threads::Threads
    PRIVATE
        dojopool_core
)

# Compiler warnings and features
target_compile_options(dojopool_physics PRIVATE
    $<$<CXX_COMPILER_ID:GNU>:-Wall -Wextra -Wpedantic -Werror>
    $<$<CXX_COMPILER_ID:Clang>:-Wall -Wextra -Wpedantic -Werror>
    $<$<CXX_COMPILER_ID:MSVC>:/W4 /WX>
)

# Build type specific flags
target_compile_options(dojopool_physics PRIVATE
    $<$<CONFIG:Debug>:-O0 -g3>
    $<$<CONFIG:Release>:-O3 -DNDEBUG>
    $<$<CONFIG:RelWithDebInfo>:-O2 -g3 -DNDEBUG>
)

# Installation
install(TARGETS dojopool_physics
    EXPORT DojoPoolTargets
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    INCLUDES DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)

install(FILES ${PHYSICS_HEADERS}
    DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}/dojopool/physics
)
