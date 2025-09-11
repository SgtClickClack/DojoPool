# Core library CMakeLists.txt

set(CORE_SOURCES
    types.cpp
    logging.cpp
    configuration.cpp
    utilities.cpp
)

set(CORE_HEADERS
    types.hpp
    logging.hpp
    configuration.hpp
    utilities.hpp
    exceptions.hpp
)

# Create core library
add_library(dojopool_core ${CORE_SOURCES} ${CORE_HEADERS})

# Set target properties
set_target_properties(dojopool_core PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION ${PROJECT_VERSION_MAJOR}
    OUTPUT_NAME "dojopool-core"
)

# Include directories
target_include_directories(dojopool_core
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>
        $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
)

# Link dependencies
target_link_libraries(dojopool_core
    PUBLIC
        Threads::Threads
)

# Compiler warnings and features
target_compile_options(dojopool_core PRIVATE
    $<$<CXX_COMPILER_ID:GNU>:-Wall -Wextra -Wpedantic -Werror>
    $<$<CXX_COMPILER_ID:Clang>:-Wall -Wextra -Wpedantic -Werror>
    $<$<CXX_COMPILER_ID:MSVC>:/W4 /WX>
)

# Build type specific flags
target_compile_options(dojopool_core PRIVATE
    $<$<CONFIG:Debug>:-O0 -g3>
    $<$<CONFIG:Release>:-O3 -DNDEBUG>
    $<$<CONFIG:RelWithDebInfo>:-O2 -g3 -DNDEBUG>
)

# Installation
install(TARGETS dojopool_core
    EXPORT DojoPoolTargets
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    INCLUDES DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)

install(FILES ${CORE_HEADERS}
    DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}/dojopool/core
)
