// import { Pool } from 'pg';
// import Redis from 'ioredis';
import { parse } from 'url';

// Parse database URL - temporarily disabled
// const dbUrl = parse(process.env.DATABASE_URL || '');
// const [username, password] = (dbUrl.auth || '').split(':');

// Optimized PostgreSQL pool configuration - temporarily disabled
// export const pgPool = new Pool({
//   user: username,
//   password: password,
//   host: dbUrl.hostname || 'localhost',
//   port: parseInt(dbUrl.port || '5432', 10),
//   database: dbUrl.pathname?.slice(1),
//   // Connection pool settings
//   max: 20, // Maximum number of clients in the pool
//   idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
//   connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
//   maxUses: 7500, // Close a connection after it has been used 7500 times

//   // Query execution settings
//   statement_timeout: 10000, // Cancel queries that take more than 10 seconds
//   query_timeout: 5000, // Return an error if a query takes more than 5 seconds

//   // SSL configuration for production
//   ssl:
//     process.env.NODE_ENV === 'production'
//       ? {
//           rejectUnauthorized: false,
//           ca: process.env.SSL_CERT,
//         }
//       : undefined,
// });

// Temporary stub for pgPool
export const pgPool = null;

// Redis client configuration - temporarily disabled
// export const redis = new Redis({
//   host: process.env.REDIS_URL
//     ? parse(process.env.REDIS_URL).hostname || 'localhost'
//     : 'localhost',
//   port: process.env.REDIS_URL
//     ? parseInt(parse(process.env.REDIS_URL).port || '6379', 10)
//     : 6379',
//   password:
//     process.env.REDIS_PASSWORD ||
//     'A16aql5hjk86zqm2ham78r9rnmgkyz6bk88vih6sugp23giq8ht',

//   // Connection settings
//   maxRetriesPerRequest: 3,
//   enableReadyCheck: true,
//   autoResubscribe: true,

//   // Performance settings
//   connectTimeout: 10000,
//   commandTimeout: 5000,
//   keepAlive: 30000,

//   // Reconnection settings
//   retryStrategy: (times: number) => {
//     const delay = Math.min(times * 50, 2000);
//     return delay;
//   },
// });

// Temporary stub for redis
export const redis = null;

// Query result caching middleware - temporarily disabled
export const withCache = async <T>(
  key: string,
  query: () => Promise<T>,
  ttl: number = 3600 // Default TTL: 1 hour
): Promise<T> => {
  try {
    // Cache temporarily disabled - execute query directly
    const result = await query();
    return result;
  } catch (error) {
    console.error('Cache error:', error);
    // If cache fails, fallback to direct query
    return query();
  }
};

// Cache invalidation helper - temporarily disabled
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    // Cache invalidation temporarily disabled
    console.log(`Would invalidate cache for pattern: ${pattern} (disabled)`);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Query builder with automatic caching
export class QueryBuilder {
  private conditions: string[] = [];
  private params: any[] = [];
  private cacheKey: string = '';
  private cacheTTL: number = 3600;

  constructor(private table: string) {
    this.cacheKey = `query:${table}`;
  }

  where(condition: string, value: any): QueryBuilder {
    this.conditions.push(condition);
    this.params.push(value);
    this.cacheKey += `:${condition}:${value}`;
    return this;
  }

  setCacheTTL(seconds: number): QueryBuilder {
    this.cacheTTL = seconds;
    return this;
  }

  async execute<T>(): Promise<T[]> {
    const whereClause = this.conditions.length
      ? 'WHERE ' + this.conditions.join(' AND ')
      : '';

    const query = `
      SELECT * FROM ${this.table}
      ${whereClause}
    `;

    return withCache<T[]>(
      this.cacheKey,
      async () => {
        // Database query temporarily disabled
        // const result = await pgPool.query(query, this.params);
        // return result.rows;
        console.log(`Would execute query: ${query} (disabled)`);
        return [] as T[];
      },
      this.cacheTTL
    );
  }
}

// Database health check - temporarily disabled
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    // Database health check temporarily disabled
    // await pgPool.query('SELECT 1');
    // await redis.ping();
    console.log('Database health check disabled');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Initialize database connections - temporarily disabled
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test database connection - temporarily disabled
    await checkDatabaseHealth();

    // Set up error handlers - temporarily disabled
    // pgPool.on('error', (err) => {
    //   console.error('Unexpected database error:', err);
    // });

    // redis.on('error', (err) => {
    //   console.error('Redis error:', err);
    // });

    console.log('Database connections initialization disabled');
  } catch (error) {
    console.error('Failed to initialize database connections:', error);
    throw error;
  }
};
