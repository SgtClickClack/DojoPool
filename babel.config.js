module.exports = function (api) {
  // Configure Babel caching based on the environment
  api.cache.using(() => process.env.NODE_ENV);

  const presets = [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
    "@babel/preset-typescript",
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ];

  const plugins = [
    [
      "@babel/plugin-transform-runtime",
      {
        regenerator: true,
      },
    ],
    // Ensure import.meta plugins always run
    "babel-plugin-transform-import-meta",
    "@babel/plugin-syntax-import-meta",
  ];

  return {
    presets,
    plugins,
  };
};
