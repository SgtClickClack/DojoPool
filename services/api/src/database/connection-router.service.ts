import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@dojopool/prisma';
import {
  DatabaseEndpoint,
  HealthStatus,
  RegionalFailoverService,
} from './regional-failover.service';

export interface QueryType {
  isRead: boolean;
  isWrite: boolean;
  isTransaction: boolean;
  estimatedComplexity: 'simple' | 'medium' | 'complex';
}

export interface ConnectionPool {
  primary: PrismaClient | null;
  replicas: PrismaClient[];
  region: string;
}

@Injectable()
export class ConnectionRouterService {
  private readonly logger = new Logger(ConnectionRouterService.name);

  private connectionPools: Map<string, ConnectionPool> = new Map();
  private currentPrimaryPool: ConnectionPool | null = null;
  private readonly MAX_REPLICA_CONNECTIONS = 10;
  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds

  constructor(private regionalFailover: RegionalFailoverService) {}

  /**
   * Initialize connection pools for all regions
   */
  async initializeConnectionPools(): Promise<void> {
    const regionalStatus = this.regionalFailover.getRegionalStatus();

    for (const region of regionalStatus.regions) {
      await this.createConnectionPool(region);
    }

    // Set current primary pool
    if (regionalStatus.currentPrimary) {
      this.currentPrimaryPool =
        this.connectionPools.get(regionalStatus.currentPrimary.region) || null;
    }

    this.logger.log('Connection pools initialized for all regions');
  }

  /**
   * Create connection pool for a region
   */
  private async createConnectionPool(region: any): Promise<void> {
    const connectionPool: ConnectionPool = {
      primary: null,
      replicas: [],
      region: region.region,
    };

    try {
      // Create primary connection
      connectionPool.primary = await this.createPrismaClient(region.primary);

      // Create replica connections (limit to prevent connection exhaustion)
      const replicaLimit = Math.min(
        region.replicas.length,
        this.MAX_REPLICA_CONNECTIONS
      );
      for (let i = 0; i < replicaLimit; i++) {
        const replica = region.replicas[i];
        const replicaClient = await this.createPrismaClient(replica);
        connectionPool.replicas.push(replicaClient);
      }

      this.connectionPools.set(region.region, connectionPool);
      this.logger.log(
        `Connection pool created for region ${region.region} (${connectionPool.replicas.length + 1} connections)`
      );
    } catch (error) {
      this.logger.error(
        `Failed to create connection pool for region ${region.region}: ${error.message}`
      );
    }
  }

  /**
   * Create Prisma client with specific database URL
   */
  private async createPrismaClient(
    endpoint: DatabaseEndpoint
  ): Promise<PrismaClient> {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: endpoint.url,
        },
      },
      log:
        process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    });

    // Test connection
    await client.$connect();

    return client;
  }

  /**
   * Route query to appropriate database connection
   */
  async routeQuery<T>(
    queryFn: (client: PrismaClient) => Promise<T>,
    queryType: QueryType,
    options: {
      preferredRegion?: string;
      useNearest?: boolean;
      allowStaleRead?: boolean;
    } = {}
  ): Promise<T> {
    const { preferredRegion, useNearest, allowStaleRead } = options;

    // For write queries or transactions, always use primary
    if (queryType.isWrite || queryType.isTransaction) {
      return this.executeOnPrimary(queryFn);
    }

    // For read queries, use optimal replica
    return this.executeOnReplica(queryFn, {
      preferredRegion,
      useNearest,
      allowStaleRead,
    });
  }

  /**
   * Execute query on primary database
   */
  private async executeOnPrimary<T>(
    queryFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    if (!this.currentPrimaryPool?.primary) {
      throw new Error('No primary database connection available');
    }

    try {
      const result = await queryFn(this.currentPrimaryPool.primary);
      this.logger.debug('Query executed on primary database');
      return result;
    } catch (error) {
      this.logger.error(`Primary database query failed: ${error.message}`);

      // Trigger failover if primary is unhealthy
      await this.regionalFailover.manualFailover('any'); // Will select best available region

      throw new Error(
        `Primary database query failed and failover triggered: ${error.message}`
      );
    }
  }

  /**
   * Execute read query on optimal replica
   */
  private async executeOnReplica<T>(
    queryFn: (client: PrismaClient) => Promise<T>,
    options: {
      preferredRegion?: string;
      useNearest?: boolean;
      allowStaleRead?: boolean;
    }
  ): Promise<T> {
    const bestReplica = await this.selectOptimalReplica(options);

    if (!bestReplica) {
      // Fallback to primary if no healthy replicas available
      this.logger.warn(
        'No healthy replicas available, falling back to primary'
      );
      return this.executeOnPrimary(queryFn);
    }

    try {
      const result = await queryFn(bestReplica);
      this.logger.debug(
        `Query executed on replica in region ${bestReplica._region}`
      );
      return result;
    } catch (error) {
      this.logger.warn(
        `Replica query failed: ${error.message}, falling back to primary`
      );
      return this.executeOnPrimary(queryFn);
    }
  }

  /**
   * Select the optimal replica for a query
   */
  private async selectOptimalReplica(options: {
    preferredRegion?: string;
    useNearest?: boolean;
    allowStaleRead?: boolean;
  }): Promise<PrismaClient | null> {
    const { preferredRegion, useNearest, allowStaleRead } = options;
    const healthStatus = this.regionalFailover.getHealthStatus();

    // Get all healthy replica connections
    const healthyReplicas: Array<{
      client: PrismaClient;
      region: string;
      health: HealthStatus;
    }> = [];

    for (const [regionName, pool] of this.connectionPools) {
      for (const replica of pool.replicas) {
        const replicaHealth = healthStatus.statuses.find(
          (status) => status.endpoint.id === replica._endpoint?.id
        );

        if (replicaHealth?.isHealthy) {
          healthyReplicas.push({
            client: replica,
            region: regionName,
            health: replicaHealth,
          });
        }
      }
    }

    if (healthyReplicas.length === 0) {
      return null;
    }

    // 1. Prefer specified region
    if (preferredRegion) {
      const preferredReplica = healthyReplicas.find(
        (rep) => rep.region === preferredRegion
      );
      if (preferredReplica) {
        return preferredReplica.client;
      }
    }

    // 2. Use nearest region (would use geolocation in production)
    if (useNearest) {
      // For now, use a simple region priority
      const regionPriority = {
        'us-east': 3,
        'eu-west': 2,
        'asia-pacific': 1,
      };

      healthyReplicas.sort((a, b) => {
        const priorityA = regionPriority[a.region] || 0;
        const priorityB = regionPriority[b.region] || 0;
        return priorityB - priorityA; // Higher priority first
      });

      return healthyReplicas[0].client;
    }

    // 3. Select based on response time (lowest latency)
    healthyReplicas.sort(
      (a, b) => a.health.responseTime - b.health.responseTime
    );
    return healthyReplicas[0].client;
  }

  /**
   * Get query statistics for optimization
   */
  getQueryStats() {
    const regionalStatus = this.regionalFailover.getRegionalStatus();
    const healthStatus = this.regionalFailover.getHealthStatus();

    return {
      primaryRegion: this.currentPrimaryPool?.region,
      availableRegions: Array.from(this.connectionPools.keys()),
      healthyReplicas: healthStatus.overallHealth.healthyEndpoints - 1, // Subtract primary
      totalConnections: Array.from(this.connectionPools.values()).reduce(
        (sum, pool) => sum + pool.replicas.length + 1,
        0
      ), // +1 for primary
      healthSummary: healthStatus.overallHealth,
      regionalBreakdown: regionalStatus.regions.map((region) => ({
        region: region.region,
        primaryHealthy: region.primaryHealth?.isHealthy || false,
        replicaHealth: region.replicaHealth.map((h) => h?.isHealthy || false),
        healthyCount: [
          region.primaryHealth?.isHealthy,
          ...region.replicaHealth.map((h) => h?.isHealthy),
        ].filter(Boolean).length,
        totalCount: region.replicas.length + 1,
      })),
    };
  }

  /**
   * Force refresh of connection pools
   */
  async refreshConnectionPools(): Promise<void> {
    this.logger.log('Refreshing connection pools...');

    // Close existing connections
    for (const pool of this.connectionPools.values()) {
      if (pool.primary) {
        await pool.primary.$disconnect();
      }
      for (const replica of pool.replicas) {
        await replica.$disconnect();
      }
    }

    this.connectionPools.clear();
    await this.initializeConnectionPools();
  }

  /**
   * Handle region failover
   */
  async handleRegionFailover(newPrimaryRegion: string): Promise<void> {
    this.logger.log(`Handling failover to region: ${newPrimaryRegion}`);

    const newPrimaryPool = this.connectionPools.get(newPrimaryRegion);
    if (!newPrimaryPool) {
      throw new Error(
        `Connection pool not found for region ${newPrimaryRegion}`
      );
    }

    this.currentPrimaryPool = newPrimaryPool;

    // Refresh replica connections in other regions
    await this.refreshReplicaConnections();

    this.logger.log(`Failover completed, new primary: ${newPrimaryRegion}`);
  }

  /**
   * Refresh replica connections after failover
   */
  private async refreshReplicaConnections(): Promise<void> {
    const regionalStatus = this.regionalFailover.getRegionalStatus();

    for (const region of regionalStatus.regions) {
      const pool = this.connectionPools.get(region.region);
      if (!pool) continue;

      // Close old replica connections
      for (const replica of pool.replicas) {
        await replica.$disconnect();
      }

      // Create new replica connections
      pool.replicas = [];
      const replicaLimit = Math.min(
        region.replicas.length,
        this.MAX_REPLICA_CONNECTIONS
      );

      for (let i = 0; i < replicaLimit; i++) {
        const replica = region.replicas[i];
        try {
          const replicaClient = await this.createPrismaClient(replica);
          pool.replicas.push(replicaClient);
        } catch (error) {
          this.logger.warn(
            `Failed to connect to replica ${replica.id}: ${error.message}`
          );
        }
      }
    }
  }

  /**
   * Analyze query to determine type and complexity
   */
  analyzeQuery(query: string): QueryType {
    const upperQuery = query.toUpperCase();

    // Determine if it's a read or write query
    const isRead =
      /\bSELECT\b/.test(upperQuery) && !/\bINTO\b/.test(upperQuery);
    const isWrite = /\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/.test(
      upperQuery
    );
    const isTransaction = /\b(BEGIN|COMMIT|ROLLBACK|START TRANSACTION)\b/.test(
      upperQuery
    );

    // Estimate complexity based on query patterns
    let complexity: 'simple' | 'medium' | 'complex' = 'simple';

    if (
      upperQuery.includes('JOIN') ||
      upperQuery.includes('GROUP BY') ||
      upperQuery.includes('ORDER BY')
    ) {
      complexity = 'medium';
    }

    if (
      upperQuery.includes('UNION') ||
      upperQuery.includes('SUBQUERY') ||
      upperQuery.match(/\b(JOIN|GROUP BY|ORDER BY)\b/g)?.length > 2
    ) {
      complexity = 'complex';
    }

    return {
      isRead,
      isWrite,
      isTransaction,
      estimatedComplexity: complexity,
    };
  }

  /**
   * Get connection pool status for monitoring
   */
  getConnectionPoolStatus() {
    return {
      pools: Array.from(this.connectionPools.entries()).map(
        ([region, pool]) => ({
          region,
          primaryConnected: pool.primary !== null,
          replicaCount: pool.replicas.length,
          totalConnections: pool.replicas.length + (pool.primary ? 1 : 0),
        })
      ),
      currentPrimary: this.currentPrimaryPool?.region,
      failoverService: this.regionalFailover.getRegionalStatus(),
    };
  }

  /**
   * Clean up connections on shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.log('Shutting down connection pools...');

    for (const pool of this.connectionPools.values()) {
      if (pool.primary) {
        await pool.primary.$disconnect();
      }
      for (const replica of pool.replicas) {
        await replica.$disconnect();
      }
    }

    this.connectionPools.clear();
    this.currentPrimaryPool = null;

    this.logger.log('Connection pools shut down');
  }
}
