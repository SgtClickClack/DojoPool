export const databaseConfig = {
  // Use SQLite for development/testing, PostgreSQL for production
  provider: process.env.DATABASE_PROVIDER || 'sqlite',

  sqlite: {
    url: 'file:./dev.db',
  },

  postgresql: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/dojopool_dev',
  },

  // Get the appropriate database URL
  getDatabaseUrl(): string {
    if (this.provider === 'postgresql') {
      return this.postgresql.url;
    }
    return this.sqlite.url;
  },
};
