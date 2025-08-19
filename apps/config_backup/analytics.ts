// import { Redis } from 'ioredis';
// import { ClickHouse } from '@clickhouse/client';
// import { Segment } from '@segment/analytics-node';
// import { MixpanelClient } from 'mixpanel';
import { createLogger, format, transports } from 'winston';

// Initialize clients - temporarily disabled
// const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
// const clickhouse = new ClickHouse({
//   host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
//   database: 'dojopool_analytics',
// });

// const segment = new Segment({
//   writeKey: process.env.SEGMENT_WRITE_KEY || '',
// });

// const mixpanel = new MixpanelClient(process.env.MIXPANEL_TOKEN || '');

// Configure Winston logger for analytics
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({ filename: 'logs/analytics.log' }),
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

// Analytics event types
export enum AnalyticsEventType {
  // User events
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PROFILE_UPDATE = 'profile_update',

  // Game events
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  SHOT_TAKEN = 'shot_taken',
  GAME_VICTORY = 'game_victory',

  // Tournament events
  TOURNAMENT_JOIN = 'tournament_join',
  TOURNAMENT_START = 'tournament_start',
  TOURNAMENT_END = 'tournament_end',
  TOURNAMENT_VICTORY = 'tournament_victory',

  // Venue events
  VENUE_VISIT = 'venue_visit',
  TABLE_BOOKING = 'table_booking',
  VENUE_RATING = 'venue_rating',

  // Feature usage
  AI_COACH_SESSION = 'ai_coach_session',
  SHOT_ANALYSIS = 'shot_analysis',
  RECOMMENDATION_CLICK = 'recommendation_click',

  // Performance events
  PAGE_LOAD = 'page_load',
  API_LATENCY = 'api_latency',
  ERROR_OCCURRED = 'error_occurred',

  // Business events
  SUBSCRIPTION_STARTED = 'subscription_started',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  REVENUE_GENERATED = 'revenue_generated',
}

// Analytics dimensions
export interface AnalyticsDimensions {
  userId?: string;
  sessionId?: string;
  deviceType?: string;
  platform?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  userAgent?: string;
  referrer?: string;
  timestamp: Date;
}

// Analytics metrics
export interface AnalyticsMetrics {
  duration?: number;
  value?: number;
  count?: number;
  score?: number;
  latency?: number;
  errorCount?: number;
}

// Analytics event interface
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  dimensions: AnalyticsDimensions;
  metrics: AnalyticsMetrics;
  metadata?: Record<string, any>;
}

// Analytics configuration
export const analyticsConfig = {
  // Sampling rates
  sampling: {
    pageViews: 1.0, // 100% of page views
    events: 1.0, // 100% of events
    performance: 0.1, // 10% of performance data
  },

  // Retention periods
  retention: {
    rawEvents: 90, // days to keep raw events
    aggregatedData: 365, // days to keep aggregated data
    performanceMetrics: 30, // days to keep performance data
  },

  // Batch processing
  batch: {
    size: 100, // events per batch
    flushInterval: 30000, // flush every 30 seconds
  },

  // Real-time processing
  realtime: {
    enabled: true,
    updateInterval: 10000, // update real-time dashboards every 10 seconds
  },
};

// Analytics class
export class Analytics {
  private static instance: Analytics;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeAnalytics();
  }

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private async initializeAnalytics() {
    try {
      // Initialize ClickHouse tables if they don't exist
      await this.initializeClickHouseTables();

      // Start batch processing
      this.startBatchProcessing();

      // Start real-time processing if enabled
      if (analyticsConfig.realtime.enabled) {
        this.startRealtimeProcessing();
      }

      logger.info('Analytics system initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize analytics:', error);
      throw error;
    }
  }

  private async initializeClickHouseTables() {
    const queries = [
      `
      CREATE TABLE IF NOT EXISTS events (
        type String,
        userId String,
        sessionId String,
        deviceType String,
        platform String,
        country String,
        region String,
        city String,
        userAgent String,
        referrer String,
        timestamp DateTime,
        duration Nullable(Float64),
        value Nullable(Float64),
        count Nullable(UInt32),
        score Nullable(Float64),
        latency Nullable(Float64),
        errorCount Nullable(UInt32),
        metadata String,
        date Date
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(date)
      ORDER BY (timestamp, type)
      TTL date + INTERVAL ${analyticsConfig.retention.rawEvents} DAY;
      `,
      `
      CREATE TABLE IF NOT EXISTS aggregated_metrics (
        date Date,
        type String,
        dimension String,
        dimension_value String,
        count UInt64,
        sum_value Float64,
        avg_value Float64,
        min_value Float64,
        max_value Float64
      )
      ENGINE = SummingMergeTree()
      PARTITION BY toYYYYMM(date)
      ORDER BY (date, type, dimension, dimension_value)
      TTL date + INTERVAL ${analyticsConfig.retention.aggregatedData} DAY;
      `,
    ];

    // for (const query of queries) {
    //   await clickhouse.query(query).exec();
    // }
    logger.info('Would execute ClickHouse queries (disabled)');
  }

  private startBatchProcessing() {
    const flush = async () => {
      if (this.eventQueue.length === 0) return;

      const events = [...this.eventQueue];
      this.eventQueue = [];

      try {
        await this.processBatch(events);
      } catch (error) {
        logger.error('Failed to process batch:', error);
        // Re-add failed events to the queue
        this.eventQueue.push(...events);
      }
    };

    // Flush on interval
    setInterval(flush, analyticsConfig.batch.flushInterval);

    // Flush on queue size threshold
    this.flushTimeout = null;
  }

  private startRealtimeProcessing() {
    setInterval(async () => {
      try {
        await this.updateRealtimeMetrics();
      } catch (error) {
        logger.error('Failed to update real-time metrics:', error);
      }
    }, analyticsConfig.realtime.updateInterval);
  }

  public async trackEvent(event: AnalyticsEvent) {
    try {
      // Add to queue for batch processing
      this.eventQueue.push(event);

      // Track in Segment - temporarily disabled
      // segment.track({
      //   userId: event.dimensions.userId,
      //   event: event.type,
      //   properties: {
      //     ...event.metrics,
      //     ...event.metadata,
      //   },
      // });

      // Track in Mixpanel - temporarily disabled
      // mixpanel.track(event.type, {
      //   distinct_id: event.dimensions.userId,
      //   ...event.dimensions,
      //   ...event.metrics,
      //   ...event.metadata,
      // });

      // Process immediately if queue is full
      if (this.eventQueue.length >= analyticsConfig.batch.size) {
        await this.processBatch(this.eventQueue);
        this.eventQueue = [];
      }

      // Schedule flush if not already scheduled
      if (!this.flushTimeout) {
        this.flushTimeout = setTimeout(
          () => this.processBatch(this.eventQueue),
          analyticsConfig.batch.flushInterval
        );
      }
    } catch (error) {
      logger.error('Failed to track event:', error);
    }
  }

  private async processBatch(events: AnalyticsEvent[]) {
    try {
      // Store in ClickHouse
      await this.storeEventsInClickHouse(events);

      // Update Redis for real-time analytics
      await this.updateRedisMetrics(events);

      logger.info(`Processed batch of ${events.length} events`);
    } catch (error) {
      logger.error('Failed to process batch:', error);
      throw error;
    }
  }

  private async storeEventsInClickHouse(events: AnalyticsEvent[]) {
    const values = events.map((event) => ({
      type: event.type,
      userId: event.dimensions.userId || '',
      sessionId: event.dimensions.sessionId || '',
      deviceType: event.dimensions.deviceType || '',
      platform: event.dimensions.platform || '',
      country: event.dimensions.location?.country || '',
      region: event.dimensions.location?.region || '',
      city: event.dimensions.location?.city || '',
      userAgent: event.dimensions.userAgent || '',
      referrer: event.dimensions.referrer || '',
      timestamp: event.dimensions.timestamp,
      duration: event.metrics.duration || null,
      value: event.metrics.value || null,
      count: event.metrics.count || null,
      score: event.metrics.score || null,
      latency: event.metrics.latency || null,
      errorCount: event.metrics.errorCount || null,
      metadata: JSON.stringify(event.metadata || {}),
      date: event.dimensions.timestamp,
    }));

    // await clickhouse.insert({
    //   table: 'events',
    //   values,
    //   format: 'JSONEachRow',
    // });
    logger.info(`Would insert ${values.length} events into ClickHouse (disabled)`);
  }

  private async updateRedisMetrics(events: AnalyticsEvent[]) {
    // const pipeline = redis.pipeline();
    const now = new Date();
    const minute = now.getMinutes();
    const hour = now.getHours();

    for (const event of events) {
      const baseKey = `analytics:realtime:${event.type}`;

      // Increment counters - temporarily disabled
      // pipeline.incr(`${baseKey}:total`);
      // pipeline.hincrby(`${baseKey}:by_minute`, minute.toString(), 1);
      // pipeline.hincrby(`${baseKey}:by_hour`, hour.toString(), 1);

      // Store metrics if present
      if (event.metrics.value) {
        // pipeline.zadd(`${baseKey}:values`, event.metrics.value, Date.now());
      }

      // Set expiry
      // pipeline.expire(`${baseKey}:total`, 86400); // 24 hours
      // pipeline.expire(`${baseKey}:by_minute`, 3600); // 1 hour
      // pipeline.expire(`${baseKey}:by_hour`, 86400); // 24 hours
      // pipeline.expire(`${baseKey}:values`, 86400); // 24 hours
    }

    // await pipeline.exec();
    logger.info(`Would update Redis metrics for ${events.length} events (disabled)`);
  }

  private async updateRealtimeMetrics() {
    // const pipeline = redis.pipeline();
    const now = new Date();
    const minute = now.getMinutes();

    // Clean up old data - temporarily disabled
    // pipeline.del(`analytics:realtime:metrics:${(minute - 1 + 60) % 60}`);

    // Get current metrics - temporarily disabled
    // const results = await Promise.all([
    //   redis.hgetall('analytics:realtime:active_users'),
    //   redis.zcount('analytics:realtime:page_loads', '-inf', '+inf'),
    //   redis.hgetall('analytics:realtime:errors'),
    // ]);

    // Store current snapshot - temporarily disabled
    // pipeline.hmset(`analytics:realtime:metrics:${minute}`, {
    //   active_users: results[0] ? Object.keys(results[0]).length : 0,
    //   page_loads: results[1] || 0,
    //   errors: results[2]
    //     ? Object.values(results[2]).reduce(
    //         (a: any, b: any) => a + parseInt(b),
    //         0
    //       )
    //     : 0,
    // });

    // await pipeline.exec();
    logger.info(`Would update realtime metrics for minute ${minute} (disabled)`);
  }

  public async getRealtimeMetrics() {
    const now = new Date();
    const minute = now.getMinutes();

    // Get last 5 minutes of data - temporarily disabled
    // const metrics = await Promise.all(
    //   Array.from({ length: 5 }, (_, i) => {
    //     const m = (minute - i + 60) % 60;
    //     return redis.hgetall(`analytics:realtime:metrics:${m}`);
    //   })
    // );
    const metrics = [];

    return metrics.filter(Boolean);
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance();
