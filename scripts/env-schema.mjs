// Centralized environment schema for DojoPool
// This file defines required and optional environment variables along with helpful hints/examples.

const schema = {
  required: {
    runtime: {
      NODE_ENV: { example: 'development', hint: 'development or production' },
      PORT: { example: '8080', hint: 'API server port (dev default: 8080)' },
    },
    frontend: {
      NEXT_PUBLIC_API_URL: {
        example: 'http://localhost:3002/api/v1',
        hint: 'Public API base used by the browser (align with Next.js rewrites/Vite proxy)',
      },
      NEXT_PUBLIC_MAPBOX_TOKEN: {
        hint: 'Get a token at https://www.mapbox.com/account/ and set it here',
      },
    },
    backend: {
      CORS_ORIGINS: {
        example: 'http://localhost:3000',
        hint: 'Comma-separated origins allowed to access the API',
      },
      SESSION_SECRET: { hint: 'Use a long, random string for session signing' },
      JWT_SECRET: {
        hint: 'Use a long, random string for JWT signing (see config.env placeholder)',
      },
    },
    cache: {
      REDIS_URL: {
        example: 'redis://localhost:6379',
        hint: 'Redis connection string for cache/queues',
      },
    },
    // At least one of these must be set
    dbEither: ['MONGODB_URI', 'POSTGRES_URL', 'DATABASE_URL'],
  },
  optional: {
    email: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
    auth: ['NEXTAUTH_URL', 'NEXTAUTH_SECRET'],
    security: ['CSP_CONNECT_SRC'],
    flask: ['FLASK_BASE_URL'],
  },
};

export default schema;
