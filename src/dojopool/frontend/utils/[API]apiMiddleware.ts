import { RateLimiter } from "./rateLimiter";
import { AuthManager } from "./auth";
import { AuditLogger } from "./auditLogger";

interface ApiMiddlewareConfig {
  rateLimits: {
    default: {
      tokensPerInterval: number;
      interval: number;
      burstLimit: number;
    };
    endpoints?: Record<
      string,
      {
        tokensPerInterval: number;
        interval: number;
        burstLimit: number;
      }
    >;
  };
  security: {
    requireAuth: boolean;
    requiredRoles?: string[];
    requiredPermissions?: string[];
    validateContentType?: boolean;
    validateOrigin?: boolean;
    allowedOrigins?: string[];
  };
  audit: {
    enabled: boolean;
    logBody?: boolean;
    excludePaths?: string[];
  };
}

const DEFAULT_CONFIG: ApiMiddlewareConfig = {
  rateLimits: {
    default: {
      tokensPerInterval: 100,
      interval: 60000, // 1 minute
      burstLimit: 200,
    },
  },
  security: {
    requireAuth: true,
    validateContentType: true,
    validateOrigin: true,
    allowedOrigins: ["http://localhost:3000"],
  },
  audit: {
    enabled: true,
    logBody: false,
  },
};

export class ApiMiddleware {
  private static instance: ApiMiddleware;
  private config: ApiMiddlewareConfig;
  private rateLimiter: RateLimiter;
  private authManager: AuthManager;
  private auditLogger: AuditLogger;

  private constructor(config: Partial<ApiMiddlewareConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
    this.rateLimiter = RateLimiter.getInstance();
    this.authManager = AuthManager.getInstance();
    this.auditLogger = AuditLogger.getInstance();

    // Configure rate limits
    this.setupRateLimits();
  }

  static getInstance(config?: Partial<ApiMiddlewareConfig>): ApiMiddleware {
    if (!ApiMiddleware.instance) {
      ApiMiddleware.instance = new ApiMiddleware(config);
    }
    return ApiMiddleware.instance;
  }

  private mergeConfig(
    base: ApiMiddlewareConfig,
    override: Partial<ApiMiddlewareConfig>,
  ): ApiMiddlewareConfig {
    return {
      ...base,
      ...override,
      rateLimits: {
        ...base.rateLimits,
        ...override.rateLimits,
        endpoints: {
          ...base.rateLimits.endpoints,
          ...override.rateLimits?.endpoints,
        },
      },
      security: {
        ...base.security,
        ...override.security,
        allowedOrigins: [
          ...(base.security.allowedOrigins || []),
          ...(override.security?.allowedOrigins || []),
        ],
      },
      audit: {
        ...base.audit,
        ...override.audit,
        excludePaths: [
          ...(base.audit.excludePaths || []),
          ...(override.audit?.excludePaths || []),
        ],
      },
    };
  }

  private setupRateLimits(): void {
    // Set default rate limit
    this.rateLimiter.setConfig("default", this.config.rateLimits.default);

    // Set endpoint-specific rate limits
    if (this.config.rateLimits.endpoints) {
      Object.entries(this.config.rateLimits.endpoints).forEach(
        ([endpoint, config]) => {
          this.rateLimiter.setConfig(endpoint, config);
        },
      );
    }
  }

  private getRateLimitKey(endpoint: string, userId?: string): string {
    return userId ? `${endpoint}:${userId}` : endpoint;
  }

  private validateOrigin(origin: string): boolean {
    if (!this.config.security.validateOrigin) return true;
    if (!this.config.security.allowedOrigins?.length) return true;

    return this.config.security.allowedOrigins.some((allowed) => {
      if (allowed.includes("*")) {
        const pattern = new RegExp("^" + allowed.replace(/\*/g, ".*") + "$");
        return pattern.test(origin);
      }
      return allowed === origin;
    });
  }

  private validateContentType(contentType: string): boolean {
    if (!this.config.security.validateContentType) return true;

    // Add more content types as needed
    const validTypes = [
      "application/json",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
    ];

    return validTypes.some((type) => contentType.includes(type));
  }

  private shouldAudit(path: string): boolean {
    if (!this.config.audit.enabled) return false;
    if (!this.config.audit.excludePaths?.length) return true;

    return !this.config.audit.excludePaths.some((excluded) =>
      path.startsWith(excluded),
    );
  }

  async processRequest(request: {
    endpoint: string;
    method: string;
    path: string;
    origin?: string;
    contentType?: string;
    body?: any;
    headers?: Record<string, string>;
  }): Promise<{
    allowed: boolean;
    error?: string;
    retryAfter?: number;
  }> {
    try {
      // 1. Origin validation
      if (request.origin && !this.validateOrigin(request.origin)) {
        throw new Error("Invalid origin");
      }

      // 2. Content-Type validation
      if (
        request.contentType &&
        !this.validateContentType(request.contentType)
      ) {
        throw new Error("Invalid content type");
      }

      // 3. Authentication check
      let userId: string | undefined;
      if (this.config.security.requireAuth) {
        const user = await this.authManager.getAuthenticatedUser();
        if (!user) {
          throw new Error("Authentication required");
        }
        userId = user.id;

        // Role/permission check
        if (this.config.security.requiredRoles?.length) {
          const hasRole = this.config.security.requiredRoles.some((role) =>
            this.authManager.hasRole(role as any),
          );
          if (!hasRole) {
            throw new Error("Insufficient roles");
          }
        }

        if (this.config.security.requiredPermissions?.length) {
          const hasPermission = this.config.security.requiredPermissions.every(
            (permission) => this.authManager.hasPermission(permission),
          );
          if (!hasPermission) {
            throw new Error("Insufficient permissions");
          }
        }
      }

      // 4. Rate limiting
      const rateLimitKey = this.getRateLimitKey(request.endpoint, userId);
      const rateLimitResult = this.rateLimiter.checkLimit(rateLimitKey);

      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
        };
      }

      // 5. Audit logging
      if (this.shouldAudit(request.path)) {
        const auditDetails = {
          method: request.method,
          path: request.path,
          origin: request.origin,
          headers: request.headers,
          body: this.config.audit.logBody ? request.body : undefined,
        };

        await this.auditLogger.logDataAccess(
          request.method,
          request.path,
          auditDetails,
        );
      }

      return { allowed: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log security-related errors
      if (
        errorMessage.includes("Invalid") ||
        errorMessage.includes("Authentication") ||
        errorMessage.includes("Insufficient")
      ) {
        await this.auditLogger.logSecurity("access_denied", request.path, {
          reason: errorMessage,
          method: request.method,
          origin: request.origin,
        });
      }

      return {
        allowed: false,
        error: errorMessage,
      };
    }
  }

  getMiddlewareStats(): {
    rateLimits: Record<
      string,
      {
        remaining: number;
        timeToNextRefill: number;
      }
    >;
    activeUsers: number;
    securityViolations: number;
  } {
    const stats = {
      rateLimits: {} as Record<
        string,
        {
          remaining: number;
          timeToNextRefill: number;
        }
      >,
      activeUsers: 0,
      securityViolations: 0,
    };

    // Get rate limit stats
    const endpoints = [
      "default",
      ...Object.keys(this.config.rateLimits.endpoints || {}),
    ];

    endpoints.forEach((endpoint) => {
      const limitStats = this.rateLimiter.getStats(endpoint);
      stats.rateLimits[endpoint] = {
        remaining: limitStats.remaining,
        timeToNextRefill: limitStats.timeToNextRefill,
      };
    });

    return stats;
  }
}
