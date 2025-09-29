/**
 * Query Optimization Utilities
 * 
 * Database query optimization, caching, and performance utilities
 * for the Dojo Pool application.
 */

import { useCallback } from 'react';
import { SimpleCache } from './apiHelpers';

/**
 * Query optimization class
 */
export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private cache = new SimpleCache();
  private queryMetrics = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  /**
   * Optimize Prisma query by adding select fields
   */
  optimizePrismaQuery<T>(
    query: any,
    selectFields: (keyof T)[],
    includeRelations: string[] = []
  ): any {
    const optimizedQuery: any = {};

    // Add select fields to reduce data transfer
    if (selectFields.length > 0) {
      optimizedQuery.select = selectFields.reduce((acc, field) => {
        acc[field as string] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // Add include relations if needed
    if (includeRelations.length > 0) {
      optimizedQuery.include = includeRelations.reduce((acc, relation) => {
        acc[relation] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    return { ...query, ...optimizedQuery };
  }

  /**
   * Add pagination to query
   */
  addPagination(query: any, page: number = 1, limit: number = 10): any {
    const skip = (page - 1) * limit;
    return {
      ...query,
      skip,
      take: limit,
    };
  }

  /**
   * Add sorting to query
   */
  addSorting(query: any, sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): any {
    return {
      ...query,
      orderBy: {
        [sortBy]: sortOrder,
      },
    };
  }

  /**
   * Add filtering to query
   */
  addFiltering(query: any, filters: Record<string, any>): any {
    const where: Record<string, any> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'string') {
          where[key] = {
            contains: value,
            mode: 'insensitive',
          };
        } else if (Array.isArray(value)) {
          where[key] = {
            in: value,
          };
        } else if (typeof value === 'object' && value.gte !== undefined) {
          where[key] = value;
        } else {
          where[key] = value;
        }
      }
    });

    return {
      ...query,
      where: { ...query.where, ...where },
    };
  }

  /**
   * Cache query result
   */
  cacheQuery<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, data, ttl);
  }

  /**
   * Get cached query result
   */
  getCachedQuery<T>(key: string): T | null {
    return this.cache.get(key);
  }

  /**
   * Record query performance
   */
  recordQueryPerformance(queryName: string, executionTime: number): void {
    const existing = this.queryMetrics.get(queryName) || { count: 0, totalTime: 0, avgTime: 0 };
    
    existing.count += 1;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.count;
    
    this.queryMetrics.set(queryName, existing);
  }

  /**
   * Get query performance metrics
   */
  getQueryMetrics(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    return Object.fromEntries(this.queryMetrics);
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear query metrics
   */
  clearMetrics(): void {
    this.queryMetrics.clear();
  }
}

/**
 * Database connection pool manager
 */
export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private connections: Map<string, any> = new Map();
  private connectionMetrics = new Map<string, { active: number; idle: number; total: number }>();

  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  /**
   * Get connection from pool
   */
  async getConnection(connectionName: string = 'default'): Promise<any> {
    // Implementation would depend on your database setup
    // This is a placeholder for the actual connection logic
    return this.connections.get(connectionName);
  }

  /**
   * Release connection back to pool
   */
  async releaseConnection(connection: any, connectionName: string = 'default'): Promise<void> {
    // Implementation would depend on your database setup
    // This is a placeholder for the actual release logic
  }

  /**
   * Get connection pool metrics
   */
  getPoolMetrics(): Record<string, { active: number; idle: number; total: number }> {
    return Object.fromEntries(this.connectionMetrics);
  }
}

/**
 * Query builder for common patterns
 */
export class QueryBuilder {
  private query: any = {};

  /**
   * Select specific fields
   */
  select(fields: string[]): QueryBuilder {
    this.query.select = fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    return this;
  }

  /**
   * Add where conditions
   */
  where(conditions: Record<string, any>): QueryBuilder {
    this.query.where = { ...this.query.where, ...conditions };
    return this;
  }

  /**
   * Add include relations
   */
  include(relations: string[]): QueryBuilder {
    this.query.include = relations.reduce((acc, relation) => {
      acc[relation] = true;
      return acc;
    }, {} as Record<string, boolean>);
    return this;
  }

  /**
   * Add pagination
   */
  paginate(page: number = 1, limit: number = 10): QueryBuilder {
    this.query.skip = (page - 1) * limit;
    this.query.take = limit;
    return this;
  }

  /**
   * Add sorting
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder {
    this.query.orderBy = { [field]: direction };
    return this;
  }

  /**
   * Build the final query
   */
  build(): any {
    return this.query;
  }

  /**
   * Reset the query builder
   */
  reset(): QueryBuilder {
    this.query = {};
    return this;
  }
}

/**
 * N+1 query prevention utilities
 */
export class NPlusOnePrevention {
  private static instance: NPlusOnePrevention;
  private queryCache = new Map<string, any[]>();

  static getInstance(): NPlusOnePrevention {
    if (!NPlusOnePrevention.instance) {
      NPlusOnePrevention.instance = new NPlusOnePrevention();
    }
    return NPlusOnePrevention.instance;
  }

  /**
   * Batch load related data to prevent N+1 queries
   */
  async batchLoad<T>(
    items: any[],
    relationKey: string,
    loader: (ids: string[]) => Promise<T[]>
  ): Promise<Map<string, T[]>> {
    const ids = items.map(item => item.id).filter(Boolean);
    const uniqueIds = [...new Set(ids)];
    
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const cacheKey = `${relationKey}_${uniqueIds.sort().join(',')}`;
    let relatedData = this.queryCache.get(cacheKey);

    if (!relatedData) {
      relatedData = await loader(uniqueIds);
      this.queryCache.set(cacheKey, relatedData);
    }

    // Group related data by parent ID
    const groupedData = new Map<string, T[]>();
    relatedData.forEach((item: any) => {
      const parentId = item[`${relationKey}Id`] || item[relationKey];
      if (!groupedData.has(parentId)) {
        groupedData.set(parentId, []);
      }
      groupedData.get(parentId)!.push(item);
    });

    return groupedData;
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }
}

/**
 * Database index optimization suggestions
 */
export class IndexOptimizer {
  private static instance: IndexOptimizer;
  private slowQueries = new Map<string, { count: number; avgTime: number; fields: string[] }>();

  static getInstance(): IndexOptimizer {
    if (!IndexOptimizer.instance) {
      IndexOptimizer.instance = new IndexOptimizer();
    }
    return IndexOptimizer.instance;
  }

  /**
   * Record slow query for analysis
   */
  recordSlowQuery(query: string, executionTime: number, fields: string[]): void {
    const existing = this.slowQueries.get(query) || { count: 0, avgTime: 0, fields: [] };
    
    existing.count += 1;
    existing.avgTime = (existing.avgTime + executionTime) / 2;
    existing.fields = fields;
    
    this.slowQueries.set(query, existing);
  }

  /**
   * Get index optimization suggestions
   */
  getOptimizationSuggestions(): Array<{
    query: string;
    count: number;
    avgTime: number;
    suggestedIndex: string;
    fields: string[];
  }> {
    const suggestions: Array<{
      query: string;
      count: number;
      avgTime: number;
      suggestedIndex: string;
      fields: string[];
    }> = [];

    this.slowQueries.forEach((data, query) => {
      if (data.avgTime > 100) { // Queries taking more than 100ms
        suggestions.push({
          query,
          count: data.count,
          avgTime: data.avgTime,
          suggestedIndex: `CREATE INDEX idx_${data.fields.join('_')} ON table_name (${data.fields.join(', ')});`,
          fields: data.fields,
        });
      }
    });

    return suggestions.sort((a, b) => b.avgTime - a.avgTime);
  }

  /**
   * Clear slow query records
   */
  clearSlowQueries(): void {
    this.slowQueries.clear();
  }
}

/**
 * Query performance monitoring hook
 */
export const useQueryPerformance = () => {
  const measureQuery = useCallback(async <T>(
    queryName: string,
    queryFn: () => Promise<T>,
    fields: string[] = []
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Record query performance
      const optimizer = QueryOptimizer.getInstance();
      optimizer.recordQueryPerformance(queryName, executionTime);
      
      // Record slow queries for index optimization
      if (executionTime > 100) {
        const indexOptimizer = IndexOptimizer.getInstance();
        indexOptimizer.recordSlowQuery(queryName, executionTime, fields);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Error logged by query function
      throw error;
    }
  }, []);

  return { measureQuery };
};
