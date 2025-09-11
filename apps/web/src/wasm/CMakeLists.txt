# DojoPool WebAssembly Build Configuration
cmake_minimum_required(VERSION 3.15)

project(DojoPoolWasm)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Emscripten-specific settings
if(EMSCRIPTEN)
  set(CMAKE_EXECUTABLE_SUFFIX ".js")

  # WebAssembly compilation flags
  set(EMSCRIPTEN_FLAGS
    "-s WASM=1"
    "-s EXPORTED_RUNTIME_METHODS=['ccall','cwrap']"
    "-s EXPORTED_FUNCTIONS=['_main']"
    "-s ALLOW_MEMORY_GROWTH=1"
    "-s MODULARIZE=1"
    "-s EXPORT_ES6=1"
    "-s USE_ES6_IMPORT_META=0"
    "-s ENVIRONMENT='web'"
    "-O3"
    "--bind"
  )

  # Add Emscripten flags
  string(REPLACE ";" " " EMSCRIPTEN_FLAGS_STR "${EMSCRIPTEN_FLAGS}")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${EMSCRIPTEN_FLAGS_STR}")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${EMSCRIPTEN_FLAGS_STR}")
endif()

# Include directories
include_directories(${CMAKE_SOURCE_DIR})

# Source files
set(SOURCES
  pool-physics.cpp
)

# Create executable/library
add_executable(pool-physics ${SOURCES})

# Set output properties
if(EMSCRIPTEN)
  set_target_properties(pool-physics PROPERTIES
    OUTPUT_NAME "pool-physics"
    SUFFIX ".js"
  )
endif()

# Installation
install(TARGETS pool-physics
  RUNTIME DESTINATION bin
  LIBRARY DESTINATION lib
  ARCHIVE DESTINATION lib
)

# Build optimization
if(EMSCRIPTEN)
  # Enable link-time optimization
  set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)

  # Additional optimization flags for production
  if(CMAKE_BUILD_TYPE STREQUAL "Release")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -flto -DNDEBUG")
  endif()
endif()
