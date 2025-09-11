{
  "targets": [
    {
      "target_name": "dojopool_physics",
      "sources": [
        "physics_addon.cpp"
      ],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")",
        "../core",
        "../physics",
        "../../src"
      ],
      "libraries": [],
      "dependencies": [],
      "defines": [
        "NODE_ADDON_API_DISABLE_DEPRECATED",
        "NODE_ADDON_API_ENABLE_MAYBE",
        "NAPI_VERSION=6",
        "BUILDING_NODE_EXTENSION"
      ],
      "cflags!": [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.15"
      },
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      },
      "conditions": [
        ["OS=='win'", {
          "defines": [
            "_HAS_EXCEPTIONS=1"
          ],
          "libraries": [
            "node.lib"
          ]
        }],
        ["OS=='mac'", {
          "xcode_settings": {
            "OTHER_LDFLAGS": [
              "-Wl,-no_pie"
            ]
          }
        }],
        ["OS=='linux'", {
          "libraries": [
            "-Wl,--no-undefined"
          ]
        }]
      ]
    }
  ]
}
