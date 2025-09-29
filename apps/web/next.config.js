/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    // Speed up CI builds and avoid ESLint ESM config issues during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even if there are type errors
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  transpilePackages: [
    '@dojopool/types',
    '@dojopool/ui',
    '@dojopool/utils',
    '@mui/material',
    '@mui/system',
    '@mui/icons-material',
    '@mui/x-date-pickers',
  ],
  compiler: {
    styledComponents: true,
    // eslint-disable-next-line no-undef
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Disable experimental features that cause chunk issues
  experimental: {
    // Disable all optimizations that might cause chunk resolution issues
    optimizePackageImports: [],
    optimizeCss: false,
    scrollRestoration: true,
    esmExternals: false,
  },
  // Enable static export for Firebase
  // output: 'export',
  trailingSlash: false, // Disabled for API routes compatibility
  // Disable build tracing to reduce build size for Vercel deployment
  outputFileTracing: false,
  // Configure pages directory
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Optimized webpack configuration for better performance
  webpack: (config, { dev, isServer }) => {
    // Add Prisma binary target for Vercel
    if (process.env.NODE_ENV === 'production') {
      config.resolve.alias['@prisma/client'] = false;
      config.resolve.alias['prisma'] = false;
    }

    // Enable webpack cache for better build performance
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // Optimize for production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
        concatenateModules: true,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };
    }

    // Performance hints
    config.performance = {
      hints: dev ? false : 'warning',
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };

    // Resolve aliases for compatibility
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Mapbox to Maplibre alias for compatibility
      'mapbox-gl': 'maplibre-gl',
      // Add path alias for @/*
      '@/*': require('path').resolve(__dirname, 'src'),
    };

    return config;
  },

  // Rewrite rules for frontend routing
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/pages/api/:path*',
      },
      {
        source: '/store',
        destination: '/marketplace',
      },
      {
        source: '/healthcheck',
        destination: '/api/health',
      },
      {
        source: '/investor-portal',
        destination: '/investor-portal/index.html',
      },
      {
        source: '/invest/:path*',
        destination: '/investor-portal/index.html',
      },
    ];
  },

  // Configure headers migrated from Vercel and for API
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        source: '/investor-portal/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },

  // Configure image optimization
  images: {
    domains: ['localhost', 'dojopool.com.au'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

// eslint-disable-next-line no-undef
module.exports = nextConfig;
