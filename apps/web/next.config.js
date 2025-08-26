/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  // Prevent EMFILE errors during build trace collection
  outputFileTracing: false,
  // Configure pages directory
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'mapbox-gl': 'maplibre-gl',
    };
    return config;
  },
};

module.exports = nextConfig;
