# Node.js Addon CMakeLists.txt

# Find Node.js and npm
find_program(NODE_EXECUTABLE node REQUIRED)
find_program(NPM_EXECUTABLE npm REQUIRED)

# Get Node.js addon API
execute_process(
    COMMAND ${NODE_EXECUTABLE} -p "require('node-addon-api').include"
    OUTPUT_VARIABLE NODE_ADDON_API_DIR
    OUTPUT_STRIP_TRAILING_WHITESPACE
)

if(NOT NODE_ADDON_API_DIR)
    message(FATAL_ERROR "node-addon-api not found. Install with: npm install node-addon-api")
endif()

# Find Python for node-gyp
find_program(PYTHON_EXECUTABLE python3 python REQUIRED)

# Set addon source files
set(ADDON_SOURCES
    physics_addon.cpp
)

# Create the addon library
add_library(dojopool_physics_addon SHARED ${ADDON_SOURCES})

# Set library properties for Node.js addon
set_target_properties(dojopool_physics_addon PROPERTIES
    PREFIX ""
    SUFFIX ".node"
    OUTPUT_NAME "dojopool_physics"
)

# Include directories
target_include_directories(dojopool_physics_addon
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${NODE_ADDON_API_DIR}
        ${CMAKE_SOURCE_DIR}/src
)

# Link dependencies
target_link_libraries(dojopool_physics_addon
    PRIVATE
        dojopool_physics
        dojopool_core
)

# Node.js specific compile definitions
target_compile_definitions(dojopool_physics_addon
    PRIVATE
        NODE_ADDON_API_DISABLE_DEPRECATED
        NODE_ADDON_API_ENABLE_MAYBE
        NAPI_VERSION=6
        BUILDING_NODE_EXTENSION
)

# Platform specific settings
if(WIN32)
    target_compile_definitions(dojopool_physics_addon PRIVATE _HAS_EXCEPTIONS=1)
    target_link_libraries(dojopool_physics_addon PRIVATE node.lib)
elseif(APPLE)
    target_link_libraries(dojopool_physics_addon PRIVATE
        "-undefined dynamic_lookup"
        "-Wl,-no_pie"
    )
    set_target_properties(dojopool_physics_addon PROPERTIES
        LINK_FLAGS "-bundle"
    )
else() # Linux
    target_link_libraries(dojopool_physics_addon PRIVATE
        "-Wl,--no-undefined"
    )
endif()

# Install the addon
install(TARGETS dojopool_physics_addon
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}/node_modules/dojopool-physics
    RUNTIME DESTINATION ${CMAKE_INSTALL_LIBDIR}/node_modules/dojopool-physics
)

# Generate package.json for the addon
configure_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/package.json.in
    ${CMAKE_CURRENT_BINARY_DIR}/package.json
    @ONLY
)

# Install package.json
install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/package.json
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/node_modules/dojopool-physics
)

# Custom target to build with node-gyp if needed
add_custom_target(build_nodejs_addon
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:dojopool_physics_addon> ${CMAKE_CURRENT_BINARY_DIR}/
    DEPENDS dojopool_physics_addon
    COMMENT "Building Node.js addon"
)

# Set up node-gyp build (optional fallback)
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/binding.gyp")
    add_custom_target(node_gyp_build
        COMMAND ${NPM_EXECUTABLE} install
        COMMAND ${NODE_EXECUTABLE} ${CMAKE_CURRENT_SOURCE_DIR}/node-gyp-build.js
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
        COMMENT "Building with node-gyp"
    )
endif()

# Copy built addon to Node.js project
add_custom_target(install_nodejs_addon
    COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_SOURCE_DIR}/api/src/addons
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:dojopool_physics_addon> ${CMAKE_SOURCE_DIR}/api/src/addons/
    COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_BINARY_DIR}/package.json ${CMAKE_SOURCE_DIR}/api/src/addons/
    DEPENDS dojopool_physics_addon
    COMMENT "Installing addon to Node.js project"
)
