import { pgPool, redis, initializeDatabase } from '../src/config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

async function optimizeDatabase() {
  try {
    console.log('Starting database optimization...');

    // Initialize database connections
    await initializeDatabase();

    // Read and execute index creation script
    const indexScript = readFileSync(
      join(__dirname, '../src/config/database-indexes.sql'),
      'utf8'
    );

    console.log('Creating optimized indexes...');
    await pgPool.query(indexScript);

    // Vacuum analyze to update statistics and reclaim space
    console.log('Running VACUUM ANALYZE...');
    await pgPool.query('VACUUM ANALYZE');

    // Configure Redis cache settings
    console.log('Configuring Redis cache...');
    await redis.config('SET', 'maxmemory', '2gb');
    await redis.config('SET', 'maxmemory-policy', 'allkeys-lru');
    await redis.config('SET', 'maxmemory-samples', '10');

    // Set up Redis key space notifications for cache invalidation
    await redis.config('SET', 'notify-keyspace-events', 'KEA');

    console.log('Database optimization completed successfully!');

    // Print optimization summary
    const indexCount = await pgPool.query(`
      SELECT count(*) as index_count 
      FROM pg_indexes 
      WHERE schemaname = 'dojopool'
    `);

    const tableStats = await pgPool.query(`
      SELECT relname as table_name, 
             n_live_tup as row_count,
             n_dead_tup as dead_tuples
      FROM pg_stat_user_tables 
      WHERE schemaname = 'dojopool'
    `);

    console.log('\nOptimization Summary:');
    console.log('--------------------');
    console.log(`Total indexes: ${indexCount.rows[0].index_count}`);
    console.log('\nTable Statistics:');
    tableStats.rows.forEach((stat: any) => {
      console.log(`${stat.table_name}:`);
      console.log(`  - Live rows: ${stat.row_count}`);
      console.log(`  - Dead tuples: ${stat.dead_tuples}`);
    });
  } catch (error) {
    console.error('Error during database optimization:', error);
    throw error;
  } finally {
    // Close connections
    await pgPool.end();
    await redis.quit();
  }
}

// Run optimization if executed directly
if (require.main === module) {
  optimizeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Optimization failed:', error);
      process.exit(1);
    });
}
