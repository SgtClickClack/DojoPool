import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EdgeCacheService } from './edge-cache.service';

export interface RevalidationPattern {
  entityType: string;
  patterns: string[];
  conditions?: {
    field?: string;
    value?: any;
    operation?: 'eq' | 'ne' | 'in' | 'nin';
  };
}

export interface RevalidationEvent {
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  oldData?: any;
  newData?: any;
  metadata?: Record<string, any>;
}

@Injectable()
export class CacheRevalidationService implements OnModuleInit {
  private readonly logger = new Logger(CacheRevalidationService.name);
  private readonly revalidationPatterns: RevalidationPattern[] = [
    // Venue-related patterns
    {
      entityType: 'venue',
      patterns: [
        'venues:list',
        'venues:detail:*',
        'strategic-map:*',
        'territories:*',
      ],
    },
    // Clan-related patterns
    {
      entityType: 'clan',
      patterns: ['clans:list', 'clans:detail:*', 'territories:clan:*'],
    },
    // Territory-related patterns
    {
      entityType: 'territory',
      patterns: ['territories:*', 'territories:map', 'strategic-map:*'],
    },
    // User-related patterns
    {
      entityType: 'user',
      patterns: ['users:list', 'users:detail:*'],
    },
    // Tournament-related patterns
    {
      entityType: 'tournament',
      patterns: ['tournaments:*', 'venues:specials:*'],
    },
    // Match-related patterns (more selective)
    {
      entityType: 'match',
      patterns: ['matches:analysis:*', 'matches:insights:*'],
    },
  ];

  constructor(private readonly edgeCacheService: EdgeCacheService) {}

  async onModuleInit() {
    this.logger.log('Cache revalidation service initialized');
  }

  /**
   * Handle revalidation event when data changes
   */
  async handleRevalidation(event: RevalidationEvent): Promise<void> {
    try {
      this.logger.log(
        `Processing revalidation event: ${event.entityType}:${event.operation}:${event.entityId}`
      );

      const patternsToInvalidate = this.getPatternsForEntity(event);

      if (patternsToInvalidate.length > 0) {
        await this.edgeCacheService.invalidateEdgeCache(patternsToInvalidate);

        this.logger.log(
          `Invalidated ${patternsToInvalidate.length} cache patterns for ${event.entityType}`
        );
      } else {
        this.logger.warn(
          `No cache patterns found for entity type: ${event.entityType}`
        );
      }
    } catch (error) {
      this.logger.error('Failed to handle revalidation event:', error);
    }
  }

  /**
   * Get cache patterns to invalidate for a specific entity
   */
  private getPatternsForEntity(event: RevalidationEvent): string[] {
    const entityPattern = this.revalidationPatterns.find(
      (pattern) => pattern.entityType === event.entityType
    );

    if (!entityPattern) {
      return [];
    }

    // Expand patterns with entity ID for specific invalidation
    const expandedPatterns: string[] = [];

    for (const pattern of entityPattern.patterns) {
      if (pattern.includes('*')) {
        // Replace wildcard with entity ID for specific invalidation
        expandedPatterns.push(pattern.replace('*', event.entityId));
        // Also invalidate broader patterns
        expandedPatterns.push(pattern);
      } else {
        expandedPatterns.push(pattern);
      }
    }

    // Add operation-specific patterns
    if (event.operation === 'delete') {
      expandedPatterns.push(`${event.entityType}:detail:${event.entityId}`);
    }

    return [...new Set(expandedPatterns)]; // Remove duplicates
  }

  /**
   * Register revalidation hooks for service methods
   */
  async registerHooks(): Promise<void> {
    // This would typically be done through decorators or AOP
    // For now, we'll log the registration
    this.logger.log('Cache revalidation hooks registered');
  }

  /**
   * Bulk revalidation for multiple entities
   */
  async bulkRevalidate(events: RevalidationEvent[]): Promise<void> {
    this.logger.log(`Processing bulk revalidation for ${events.length} events`);

    const allPatterns = new Set<string>();

    for (const event of events) {
      const patterns = this.getPatternsForEntity(event);
      patterns.forEach((pattern) => allPatterns.add(pattern));
    }

    if (allPatterns.size > 0) {
      await this.edgeCacheService.invalidateEdgeCache(Array.from(allPatterns));
      this.logger.log(
        `Bulk invalidated ${allPatterns.size} unique cache patterns`
      );
    }
  }

  /**
   * Emergency cache purge for all patterns
   */
  async emergencyPurge(): Promise<void> {
    this.logger.warn('Performing emergency cache purge');

    const allPatterns = this.revalidationPatterns.flatMap(
      (pattern) => pattern.patterns
    );
    await this.edgeCacheService.invalidateEdgeCache(allPatterns);

    this.logger.warn(
      `Emergency purge completed for ${allPatterns.length} patterns`
    );
  }

  /**
   * Add custom revalidation pattern
   */
  addRevalidationPattern(pattern: RevalidationPattern): void {
    this.revalidationPatterns.push(pattern);
    this.logger.log(
      `Added custom revalidation pattern for ${pattern.entityType}`
    );
  }

  /**
   * Get current revalidation patterns
   */
  getRevalidationPatterns(): RevalidationPattern[] {
    return [...this.revalidationPatterns];
  }

  /**
   * Validate revalidation patterns
   */
  async validatePatterns(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Test pattern syntax
    for (const pattern of this.revalidationPatterns) {
      if (!pattern.entityType || pattern.entityType.trim() === '') {
        errors.push(
          `Invalid entity type in pattern: ${JSON.stringify(pattern)}`
        );
      }

      if (!pattern.patterns || pattern.patterns.length === 0) {
        errors.push(`No patterns defined for entity: ${pattern.entityType}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
