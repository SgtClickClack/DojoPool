/**
 * DojoPool Regional Database Configuration
 *
 * This file contains the configuration for multi-region database setup
 * including primary databases, read replicas, and failover settings.
 *
 * In production, these values should be loaded from environment variables
 * or a secure configuration management system.
 */

export const REGIONAL_DATABASE_CONFIG = {
  // US East - Primary Region (Highest Priority)
  'us-east': {
    priority: 10, // Highest priority for failover
    primary: {
      id: 'us-east-primary',
      host: process.env.DB_US_EAST_HOST || 'db-us-east.dojo-pool.internal',
      port: parseInt(process.env.DB_US_EAST_PORT || '5432'),
      database: process.env.DB_US_EAST_DATABASE || 'dojopool',
      username: process.env.DB_US_EAST_USERNAME || 'dojopool_user',
      password: process.env.DB_US_EAST_PASSWORD || 'password',
      ssl: process.env.DB_US_EAST_SSL !== 'false',
      region: 'us-east',
      url:
        process.env.DB_US_EAST_URL ||
        `postgresql://${process.env.DB_US_EAST_USERNAME || 'dojopool_user'}:${process.env.DB_US_EAST_PASSWORD || 'password'}@${process.env.DB_US_EAST_HOST || 'db-us-east.dojo-pool.internal'}:${process.env.DB_US_EAST_PORT || '5432'}/${process.env.DB_US_EAST_DATABASE || 'dojopool'}?sslmode=require`,
    },
    replicas: [
      {
        id: 'us-east-replica-1',
        host:
          process.env.DB_US_EAST_REPLICA1_HOST ||
          'db-us-east-replica-1.dojo-pool.internal',
        port: parseInt(process.env.DB_US_EAST_REPLICA1_PORT || '5432'),
        database: process.env.DB_US_EAST_REPLICA1_DATABASE || 'dojopool',
        username: process.env.DB_US_EAST_REPLICA1_USERNAME || 'dojopool_user',
        password: process.env.DB_US_EAST_REPLICA1_PASSWORD || 'password',
        ssl: process.env.DB_US_EAST_REPLICA1_SSL !== 'false',
        region: 'us-east',
        url:
          process.env.DB_US_EAST_REPLICA1_URL ||
          `postgresql://${process.env.DB_US_EAST_REPLICA1_USERNAME || 'dojopool_user'}:${process.env.DB_US_EAST_REPLICA1_PASSWORD || 'password'}@${process.env.DB_US_EAST_REPLICA1_HOST || 'db-us-east-replica-1.dojo-pool.internal'}:${process.env.DB_US_EAST_REPLICA1_PORT || '5432'}/${process.env.DB_US_EAST_REPLICA1_DATABASE || 'dojopool'}?sslmode=require`,
      },
      {
        id: 'us-east-replica-2',
        host:
          process.env.DB_US_EAST_REPLICA2_HOST ||
          'db-us-east-replica-2.dojo-pool.internal',
        port: parseInt(process.env.DB_US_EAST_REPLICA2_PORT || '5432'),
        database: process.env.DB_US_EAST_REPLICA2_DATABASE || 'dojopool',
        username: process.env.DB_US_EAST_REPLICA2_USERNAME || 'dojopool_user',
        password: process.env.DB_US_EAST_REPLICA2_PASSWORD || 'password',
        ssl: process.env.DB_US_EAST_REPLICA2_SSL !== 'false',
        region: 'us-east',
        url:
          process.env.DB_US_EAST_REPLICA2_URL ||
          `postgresql://${process.env.DB_US_EAST_REPLICA2_USERNAME || 'dojopool_user'}:${process.env.DB_US_EAST_REPLICA2_PASSWORD || 'password'}@${process.env.DB_US_EAST_REPLICA2_HOST || 'db-us-east-replica-2.dojo-pool.internal'}:${process.env.DB_US_EAST_REPLICA2_PORT || '5432'}/${process.env.DB_US_EAST_REPLICA2_DATABASE || 'dojopool'}?sslmode=require`,
      },
    ],
    healthCheckInterval: parseInt(
      process.env.DB_US_EAST_HEALTH_INTERVAL || '30000'
    ),
    failoverTimeout: parseInt(
      process.env.DB_US_EAST_FAILOVER_TIMEOUT || '300000'
    ),
  },

  // EU West - Secondary Region
  'eu-west': {
    priority: 8,
    primary: {
      id: 'eu-west-primary',
      host: process.env.DB_EU_WEST_HOST || 'db-eu-west.dojo-pool.internal',
      port: parseInt(process.env.DB_EU_WEST_PORT || '5432'),
      database: process.env.DB_EU_WEST_DATABASE || 'dojopool',
      username: process.env.DB_EU_WEST_USERNAME || 'dojopool_user',
      password: process.env.DB_EU_WEST_PASSWORD || 'password',
      ssl: process.env.DB_EU_WEST_SSL !== 'false',
      region: 'eu-west',
      url:
        process.env.DB_EU_WEST_URL ||
        `postgresql://${process.env.DB_EU_WEST_USERNAME || 'dojopool_user'}:${process.env.DB_EU_WEST_PASSWORD || 'password'}@${process.env.DB_EU_WEST_HOST || 'db-eu-west.dojo-pool.internal'}:${process.env.DB_EU_WEST_PORT || '5432'}/${process.env.DB_EU_WEST_DATABASE || 'dojopool'}?sslmode=require`,
    },
    replicas: [
      {
        id: 'eu-west-replica-1',
        host:
          process.env.DB_EU_WEST_REPLICA1_HOST ||
          'db-eu-west-replica-1.dojo-pool.internal',
        port: parseInt(process.env.DB_EU_WEST_REPLICA1_PORT || '5432'),
        database: process.env.DB_EU_WEST_REPLICA1_DATABASE || 'dojopool',
        username: process.env.DB_EU_WEST_REPLICA1_USERNAME || 'dojopool_user',
        password: process.env.DB_EU_WEST_REPLICA1_PASSWORD || 'password',
        ssl: process.env.DB_EU_WEST_REPLICA1_SSL !== 'false',
        region: 'eu-west',
        url:
          process.env.DB_EU_WEST_REPLICA1_URL ||
          `postgresql://${process.env.DB_EU_WEST_REPLICA1_USERNAME || 'dojopool_user'}:${process.env.DB_EU_WEST_REPLICA1_PASSWORD || 'password'}@${process.env.DB_EU_WEST_REPLICA1_HOST || 'db-eu-west-replica-1.dojo-pool.internal'}:${process.env.DB_EU_WEST_REPLICA1_PORT || '5432'}/${process.env.DB_EU_WEST_REPLICA1_DATABASE || 'dojopool'}?sslmode=require`,
      },
    ],
    healthCheckInterval: parseInt(
      process.env.DB_EU_WEST_HEALTH_INTERVAL || '30000'
    ),
    failoverTimeout: parseInt(
      process.env.DB_EU_WEST_FAILOVER_TIMEOUT || '300000'
    ),
  },

  // Asia Pacific - Tertiary Region
  'asia-pacific': {
    priority: 6,
    primary: {
      id: 'asia-pacific-primary',
      host:
        process.env.DB_ASIA_PACIFIC_HOST ||
        'db-asia-pacific.dojo-pool.internal',
      port: parseInt(process.env.DB_ASIA_PACIFIC_PORT || '5432'),
      database: process.env.DB_ASIA_PACIFIC_DATABASE || 'dojopool',
      username: process.env.DB_ASIA_PACIFIC_USERNAME || 'dojopool_user',
      password: process.env.DB_ASIA_PACIFIC_PASSWORD || 'password',
      ssl: process.env.DB_ASIA_PACIFIC_SSL !== 'false',
      region: 'asia-pacific',
      url:
        process.env.DB_ASIA_PACIFIC_URL ||
        `postgresql://${process.env.DB_ASIA_PACIFIC_USERNAME || 'dojopool_user'}:${process.env.DB_ASIA_PACIFIC_PASSWORD || 'password'}@${process.env.DB_ASIA_PACIFIC_HOST || 'db-asia-pacific.dojo-pool.internal'}:${process.env.DB_ASIA_PACIFIC_PORT || '5432'}/${process.env.DB_ASIA_PACIFIC_DATABASE || 'dojopool'}?sslmode=require`,
    },
    replicas: [
      {
        id: 'asia-pacific-replica-1',
        host:
          process.env.DB_ASIA_PACIFIC_REPLICA1_HOST ||
          'db-asia-pacific-replica-1.dojo-pool.internal',
        port: parseInt(process.env.DB_ASIA_PACIFIC_REPLICA1_PORT || '5432'),
        database: process.env.DB_ASIA_PACIFIC_REPLICA1_DATABASE || 'dojopool',
        username:
          process.env.DB_ASIA_PACIFIC_REPLICA1_USERNAME || 'dojopool_user',
        password: process.env.DB_ASIA_PACIFIC_REPLICA1_PASSWORD || 'password',
        ssl: process.env.DB_ASIA_PACIFIC_REPLICA1_SSL !== 'false',
        region: 'asia-pacific',
        url:
          process.env.DB_ASIA_PACIFIC_REPLICA1_URL ||
          `postgresql://${process.env.DB_ASIA_PACIFIC_REPLICA1_USERNAME || 'dojopool_user'}:${process.env.DB_ASIA_PACIFIC_REPLICA1_PASSWORD || 'password'}@${process.env.DB_ASIA_PACIFIC_REPLICA1_HOST || 'db-asia-pacific-replica-1.dojo-pool.internal'}:${process.env.DB_ASIA_PACIFIC_REPLICA1_PORT || '5432'}/${process.env.DB_ASIA_PACIFIC_REPLICA1_DATABASE || 'dojopool'}?sslmode=require`,
      },
    ],
    healthCheckInterval: parseInt(
      process.env.DB_ASIA_PACIFIC_HEALTH_INTERVAL || '30000'
    ),
    failoverTimeout: parseInt(
      process.env.DB_ASIA_PACIFIC_FAILOVER_TIMEOUT || '300000'
    ),
  },
};

/**
 * Environment Variables Required:
 *
 * Primary Databases:
 * - DB_US_EAST_URL (or individual host/port/db/credentials)
 * - DB_EU_WEST_URL (or individual components)
 * - DB_ASIA_PACIFIC_URL (or individual components)
 *
 * Replica Databases:
 * - DB_US_EAST_REPLICA1_URL
 * - DB_US_EAST_REPLICA2_URL
 * - DB_EU_WEST_REPLICA1_URL
 * - DB_ASIA_PACIFIC_REPLICA1_URL
 *
 * Optional Configuration:
 * - DB_*_HEALTH_INTERVAL (default: 30000ms)
 * - DB_*_FAILOVER_TIMEOUT (default: 300000ms)
 * - DB_*_SSL (default: true)
 */

export default REGIONAL_DATABASE_CONFIG;
