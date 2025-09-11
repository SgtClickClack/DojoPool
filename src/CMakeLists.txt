# Source directory CMakeLists.txt
# This file manages the modular components of DojoPool

# Add core library
add_subdirectory(core)

# Add physics library (if not using WASM version)
if(NOT EMSCRIPTEN)
    add_subdirectory(physics)
endif()

# Add AI library
add_subdirectory(ai)

# Add networking library
add_subdirectory(networking)

# Add utilities library
add_subdirectory(utils)

# Add Node.js addon
if(NOT EMSCRIPTEN)
    add_subdirectory(addon)
endif()
