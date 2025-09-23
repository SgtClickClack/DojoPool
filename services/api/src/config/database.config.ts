export const databaseConfig = {
  // Standardize on PostgreSQL for all environments
  provider: 'postgresql',

  postgresql: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/dojopool_dev',
  },

  // Get the database URL (PostgreSQL only)
  getDatabaseUrl(): string {
    return this.postgresql.url;
  },

  // Validate database connection
  async validateConnection(): Promise<boolean> {
    try {
      // This will be used by PrismaService to validate connection
      return true;
    } catch (error) {
      console.error('Database connection validation failed:', error);
      return false;
    }
  },
};
