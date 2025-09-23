/** @type {import('next').NextConfig} */
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
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
  transpilePackages: ['@dojopool/types', '@mui/material', '@mui/system', '@mui/icons-material'],
  compiler: {
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable experimental features for better performance
  experimental: {
    // Removed optimizePackageImports due to ESM directory import issues with MUI during SSR
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Enable static export for Firebase
  // output: 'export',
  trailingSlash: true,
  // Enable build tracing for standalone output
  outputFileTracing: true,
  // Configure pages directory
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Webpack optimizations for Windows file handling
  webpack: (config, { dev, isServer }) => {
    // Increase file watching limits for Windows
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['**/node_modules', '**/.next', '**/dist'],
    };

    // Optimize file processing and tree shaking
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: true,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            chunks: 'all',
            priority: 20,
          },
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|recharts|@ant-design\/charts)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 15,
          },
          maps: {
            test: /[\\/]node_modules[\\/](mapbox-gl|maplibre-gl|@vis\.gl|@react-google-maps)[\\/]/,
            name: 'maps',
            chunks: 'all',
            priority: 15,
          },
          heavy: {
            test: /[\\/]node_modules[\\/](konva|react-konva|lottie-web|jspdf|react-quill)[\\/]/,
            name: 'heavy-libs',
            chunks: 'all',
            priority: 15,
          },
        },
      },
    };

    // Increase memory limits and add optimizations
    config.performance = {
      ...config.performance,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };

    // Resolve aliases for better tree shaking and compatibility
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Mapbox to Maplibre alias for compatibility
      'mapbox-gl': 'maplibre-gl',
      // Fix MUI ESM directory import in SSR (exact match)
      '@mui/material/utils$': '@mui/material/node/utils/index.js',
    };

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
