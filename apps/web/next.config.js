/** @type {import('next').NextConfig} */
// eslint-disable-next-line no-undef
const { randomBytes } = require('crypto');

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
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', '@mui/system'],
    optimizeCss: true,
    scrollRestoration: true,
    // Force ESM compatibility for MUI packages - disabled for MUI compatibility
    esmExternals: false,
  },
  // Enable static export for Firebase
  // output: 'export',
  trailingSlash: true,
  // Disable build tracing to reduce build size for Vercel deployment
  outputFileTracing: false,
  // Disable webpack cache completely for Vercel deployment
  webpack5: false,
  // Configure pages directory
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Webpack optimizations for Windows file handling
  webpack: (config) => {
    // Disable webpack cache to reduce build size
    config.cache = false;

    // Increase file watching limits for Windows
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['**/node_modules', '**/.next', '**/dist'],
    };

    // Optimize memory limits for Vercel deployment
    config.performance = {
      ...config.performance,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };

    // Add optimizations to reduce bundle size
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 150000, // Further reduced for better splitting
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            maxSize: 150000,
          },
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            chunks: 'all',
            priority: 20,
            maxSize: 150000,
          },
          maps: {
            test: /[\\/]node_modules[\\/](mapbox-gl|maplibre-gl|@vis\.gl|@react-google-maps)[\\/]/,
            name: 'maps',
            chunks: 'all',
            priority: 15,
            maxSize: 150000,
          },
          editor: {
            test: /[\\/]node_modules[\\/](react-quill-new|quill)[\\/]/,
            name: 'editor',
            chunks: 'all',
            priority: 15,
            maxSize: 150000,
          },
          motion: {
            test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
            name: 'motion',
            chunks: 'all',
            priority: 15,
            maxSize: 150000,
          },
        },
      },
    };

    // Resolve aliases for better tree shaking and compatibility
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Mapbox to Maplibre alias for compatibility
      'mapbox-gl': 'maplibre-gl',
      // Fix MUI ESM directory import in SSR - comprehensive patterns
      '@mui/material/utils': '@mui/material/node/utils/index.js',
      '@mui/material/utils/': '@mui/material/node/utils/',
      // Additional MUI directory imports that might cause issues
      '@mui/material/styles': '@mui/material/node/styles/index.js',
      '@mui/material/styles/': '@mui/material/node/styles/',
      '@mui/material/colors': '@mui/material/node/colors/index.js',
      '@mui/material/colors/': '@mui/material/node/colors/',
    };

    // Add fallback for MUI directory imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
    };

    // MUI directory imports are now handled by disabling esmExternals

    return config;
  },

  // Rewrite rules for frontend routing
  async rewrites() {
    return [
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
          {
            key: 'Content-Security-Policy',
            value: getCsp(),
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
function getCsp() {
  const nonce = randomBytes(16).toString('base64');
  // IMPORTANT: In a real app, you would generate a new nonce for each request.
  // For this implementation, we will pass it via a custom header that the
  // _document can read. A more complex but robust solution would use middleware.
  // This approach is a pragmatic balance for Vercel deployments.

  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http: 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https://fonts.gstatic.com https://maps.gstatic.com`,
    `connect-src 'self' https://vitals.vercel-insights.com https://maps.googleapis.com https://maps.gstatic.com https://maps.google.com ws: wss:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ];

  return directives.join('; ');
}
