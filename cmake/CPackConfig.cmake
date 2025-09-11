# CPack configuration for DojoPool

set(CPACK_PACKAGE_NAME "DojoPool")
set(CPACK_PACKAGE_VENDOR "DojoPool Team")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "DojoPool - Physics Engine for Pool Games")
set(CPACK_PACKAGE_DESCRIPTION "A high-performance physics engine for pool/billiards games with WebAssembly support")
set(CPACK_PACKAGE_VERSION_MAJOR "1")
set(CPACK_PACKAGE_VERSION_MINOR "0")
set(CPACK_PACKAGE_VERSION_PATCH "0")
set(CPACK_PACKAGE_VERSION "${CPACK_PACKAGE_VERSION_MAJOR}.${CPACK_PACKAGE_VERSION_MINOR}.${CPACK_PACKAGE_VERSION_PATCH}")

set(CPACK_PACKAGE_CONTACT "contact@dojopool.com")
set(CPACK_PACKAGE_HOMEPAGE_URL "https://github.com/dojopool/dojopool")

# Package file name
set(CPACK_PACKAGE_FILE_NAME "${CPACK_PACKAGE_NAME}-${CPACK_PACKAGE_VERSION}-${CMAKE_SYSTEM_NAME}")

# Generators
set(CPACK_GENERATOR "TGZ;ZIP")

# Platform specific configurations
if(WIN32)
    set(CPACK_GENERATOR "${CPACK_GENERATOR};NSIS")
    set(CPACK_NSIS_DISPLAY_NAME "DojoPool Physics Engine")
    set(CPACK_NSIS_PACKAGE_NAME "DojoPool")
    set(CPACK_NSIS_CONTACT "${CPACK_PACKAGE_CONTACT}")
    set(CPACK_NSIS_URL_INFO_ABOUT "${CPACK_PACKAGE_HOMEPAGE_URL}")
elseif(APPLE)
    set(CPACK_GENERATOR "${CPACK_GENERATOR};DragNDrop")
    set(CPACK_DMG_VOLUME_NAME "DojoPool")
    set(CPACK_DMG_FORMAT "UDZO")
elseif(UNIX AND NOT APPLE)
    set(CPACK_GENERATOR "${CPACK_GENERATOR};DEB;RPM")
    set(CPACK_DEBIAN_PACKAGE_MAINTAINER "${CPACK_PACKAGE_CONTACT}")
    set(CPACK_DEBIAN_PACKAGE_SECTION "devel")
    set(CPACK_DEBIAN_PACKAGE_DEPENDS "libc6 (>= 2.7)")
    set(CPACK_RPM_PACKAGE_LICENSE "MIT")
    set(CPACK_RPM_PACKAGE_GROUP "Development/Libraries")
endif()

# Installation directories
set(CPACK_PACKAGING_INSTALL_PREFIX "/usr/local")

# Component configuration
set(CPACK_COMPONENTS_ALL libraries headers documentation examples)

# Resource files
set(CPACK_RESOURCE_FILE_LICENSE "${CMAKE_SOURCE_DIR}/LICENSE")
set(CPACK_RESOURCE_FILE_README "${CMAKE_SOURCE_DIR}/README.md")

# Strip binaries
set(CPACK_STRIP_FILES TRUE)

include(CPack)
