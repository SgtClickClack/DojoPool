import { AuthManager, UserRole } from './auth';

interface AuditEvent {
  id: string;
  timestamp: number;
  type: string;
  userId?: string;
  username?: string;
  roles?: UserRole[];
  action: string;
  resource: string;
  details: Record<string, any>;
  status: 'success' | 'failure';
  errorDetails?: string;
}

interface AuditLogConfig {
  apiUrl: string;
  batchSize: number;
  flushInterval: number;
  retentionDays: number;
}

const DEFAULT_AUDIT_CONFIG: AuditLogConfig = {
  apiUrl: '/api/audit',
  batchSize: 50,
  flushInterval: 5000, // 5 seconds
  retentionDays: 90,
};

export class AuditLogger {
  private static instance: AuditLogger;
  private config: AuditLogConfig;
  private eventQueue: AuditEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private authManager: AuthManager;

  private constructor(config: Partial<AuditLogConfig> = {}) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
    this.authManager = AuthManager.getInstance();
    this.setupFlushInterval();
  }

  static getInstance(config?: Partial<AuditLogConfig>): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger(config);
    }
    return AuditLogger.instance;
  }

  private setupFlushInterval(): void {
    setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private async getCurrentUser() {
    const user = await this.authManager.getAuthenticatedUser();
    return user
      ? {
          userId: user.id,
          username: user.username,
          roles: user.roles,
        }
      : undefined;
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createAuditEvent(
    type: string,
    action: string,
    resource: string,
    details: Record<string, any>,
    status: 'success' | 'failure' = 'success',
    errorDetails?: string
  ): Promise<AuditEvent> {
    const user = await this.getCurrentUser();

    return {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type,
      ...user,
      action,
      resource,
      details,
      status,
      errorDetails,
    };
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authManager.getAuthorizationHeader() || '',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        // If failed, add events back to queue
        this.eventQueue.unshift(...events);
        throw new Error('Failed to send audit logs');
      }
    } catch (error) {
      console.error('Error flushing audit logs:', error);
      // Add events back to queue
      this.eventQueue.unshift(...events);
    }
  }

  async log(
    type: string,
    action: string,
    resource: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const event = await this.createAuditEvent(type, action, resource, details, 'success');

    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  async logError(
    type: string,
    action: string,
    resource: string,
    error: Error,
    details: Record<string, any> = {}
  ): Promise<void> {
    const event = await this.createAuditEvent(
      type,
      action,
      resource,
      details,
      'failure',
      error.message
    );

    this.eventQueue.push(event);
    this.flush(); // Flush immediately for errors
  }

  async logSecurity(
    action: string,
    resource: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    return this.log('SECURITY', action, resource, details);
  }

  async logDataAccess(
    action: string,
    resource: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    return this.log('DATA_ACCESS', action, resource, details);
  }

  async logSystemChange(
    action: string,
    resource: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    return this.log('SYSTEM_CHANGE', action, resource, details);
  }

  async getAuditLogs(
    options: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
      userId?: string;
      resource?: string;
      status?: 'success' | 'failure';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AuditEvent[]> {
    const queryParams = new URLSearchParams();

    if (options.startDate) {
      queryParams.set('startDate', options.startDate.toISOString());
    }
    if (options.endDate) {
      queryParams.set('endDate', options.endDate.toISOString());
    }
    if (options.type) {
      queryParams.set('type', options.type);
    }
    if (options.userId) {
      queryParams.set('userId', options.userId);
    }
    if (options.resource) {
      queryParams.set('resource', options.resource);
    }
    if (options.status) {
      queryParams.set('status', options.status);
    }
    if (options.limit) {
      queryParams.set('limit', options.limit.toString());
    }
    if (options.offset) {
      queryParams.set('offset', options.offset.toString());
    }

    const response = await fetch(`${this.config.apiUrl}/search?${queryParams.toString()}`, {
      headers: {
        Authorization: this.authManager.getAuthorizationHeader() || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }

    return response.json();
  }
}
