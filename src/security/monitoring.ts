import { Redis } from "ioredis";
import { createLogger, format, transports } from "winston";
import { Logtail } from "@logtail/node";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// Initialize clients
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN || "");
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// Configure Winston logger
const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({ filename: "logs/security.log" }),
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

// Security event types
export enum SecurityEventType {
  AUTH_FAILURE = "auth_failure",
  BRUTE_FORCE = "brute_force",
  SUSPICIOUS_IP = "suspicious_ip",
  RATE_LIMIT = "rate_limit",
  API_ABUSE = "api_abuse",
  INVALID_TOKEN = "invalid_token",
  CSRF_VIOLATION = "csrf_violation",
  XSS_ATTEMPT = "xss_attempt",
  SQL_INJECTION = "sql_injection",
  FILE_UPLOAD = "file_upload",
  ADMIN_ACTION = "admin_action",
}

// Security event severity levels
export enum SecurityEventSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

interface SecurityEvent {
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  message: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

// Monitoring thresholds
const THRESHOLDS = {
  AUTH_FAILURES: 5, // Number of failures before alert
  RATE_LIMIT_VIOLATIONS: 10, // Number of violations before alert
  SUSPICIOUS_IP_SCORE: 0.7, // IP risk score threshold
  ALERT_WINDOW: 300, // 5 minutes in seconds
};

// Security monitoring class
export class SecurityMonitor {
  private static instance: SecurityMonitor;

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  private async initializeMonitoring() {
    try {
      // Set up real-time monitoring
      await this.setupRedisSubscriptions();

      // Start periodic checks
      this.startPeriodicChecks();

      logger.info("Security monitoring initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize security monitoring:", error);
      throw error;
    }
  }

  private async setupRedisSubscriptions() {
    const subscriber = redis.duplicate();
    await subscriber.subscribe("security-events");

    subscriber.on("message", async (channel, message) => {
      const event = JSON.parse(message) as SecurityEvent;
      await this.handleSecurityEvent(event);
    });
  }

  private startPeriodicChecks() {
    // Check for authentication failures
    setInterval(() => this.checkAuthFailures(), 60000);

    // Check for rate limit violations
    setInterval(() => this.checkRateLimitViolations(), 300000);

    // Check for suspicious IPs
    setInterval(() => this.checkSuspiciousIPs(), 600000);
  }

  public async logSecurityEvent(event: SecurityEvent) {
    try {
      // Log to Winston
      logger.log({
        level: this.getSeverityLevel(event.severity),
        message: event.message,
        ...event,
      });

      // Log to Logtail
      await logtail.log({
        level: this.getSeverityLevel(event.severity),
        message: event.message,
        ...event,
      });

      // Store in Redis for analysis
      const key = `security:event:${event.type}:${Date.now()}`;
      await redis.setex(key, 86400, JSON.stringify(event)); // Store for 24 hours

      // Check if immediate alert is needed
      if (this.requiresImmediateAlert(event)) {
        await this.sendAlert(event);
      }

      // Publish event for real-time monitoring
      await redis.publish("security-events", JSON.stringify(event));
    } catch (error) {
      logger.error("Failed to log security event:", error);
    }
  }

  private async handleSecurityEvent(event: SecurityEvent) {
    try {
      // Update statistics
      await this.updateSecurityStats(event);

      // Check for patterns
      await this.analyzePatterns(event);

      // Take automated actions if needed
      await this.takeAutomatedAction(event);
    } catch (error) {
      logger.error("Failed to handle security event:", error);
    }
  }

  private async updateSecurityStats(event: SecurityEvent) {
    const date = new Date().toISOString().split("T")[0];
    const key = `security:stats:${date}:${event.type}`;

    await redis.hincrby(key, event.severity, 1);
    await redis.expire(key, 2592000); // Keep stats for 30 days
  }

  private async analyzePatterns(event: SecurityEvent) {
    const windowKey = `security:pattern:${event.type}:${event.metadata.ip}`;
    await redis.incr(windowKey);
    await redis.expire(windowKey, THRESHOLDS.ALERT_WINDOW);

    const count = await redis.get(windowKey);
    if (count && parseInt(count) >= this.getThresholdForEventType(event.type)) {
      await this.sendAlert({
        ...event,
        message: `Pattern detected: ${event.type} from IP ${event.metadata.ip}`,
        severity: SecurityEventSeverity.HIGH,
      });
    }
  }

  private async takeAutomatedAction(event: SecurityEvent) {
    switch (event.type) {
      case SecurityEventType.BRUTE_FORCE:
        await this.blockIP(event.metadata.ip);
        break;
      case SecurityEventType.SUSPICIOUS_IP:
        await this.flagIPForReview(event.metadata.ip);
        break;
      case SecurityEventType.API_ABUSE:
        await this.restrictAPIAccess(event.metadata.ip);
        break;
    }
  }

  private async sendAlert(event: SecurityEvent) {
    try {
      // Send email alert
      await this.sendEmailAlert(event);

      // Send SNS notification
      await this.sendSNSAlert(event);

      logger.info("Security alert sent successfully", { event });
    } catch (error) {
      logger.error("Failed to send security alert:", error);
    }
  }

  private async sendEmailAlert(event: SecurityEvent) {
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [
          process.env.SECURITY_ALERT_EMAIL || "security@dojopool.com",
        ],
      },
      Message: {
        Body: {
          Text: {
            Data: `Security Alert:\n\nType: ${event.type}\nSeverity: ${event.severity}\nMessage: ${event.message}\n\nMetadata: ${JSON.stringify(event.metadata, null, 2)}`,
          },
        },
        Subject: {
          Data: `[${event.severity.toUpperCase()}] Security Alert - ${event.type}`,
        },
      },
      Source: process.env.SECURITY_EMAIL_FROM || "alerts@dojopool.com",
    });

    await sesClient.send(command);
  }

  private async sendSNSAlert(event: SecurityEvent) {
    const command = new PublishCommand({
      TopicArn: process.env.SECURITY_SNS_TOPIC,
      Message: JSON.stringify(event),
      MessageAttributes: {
        severity: {
          DataType: "String",
          StringValue: event.severity,
        },
        type: {
          DataType: "String",
          StringValue: event.type,
        },
      },
    });

    await snsClient.send(command);
  }

  private async blockIP(ip: string) {
    await redis.setex(`security:blocked:ip:${ip}`, 3600, "1"); // Block for 1 hour
    logger.info(`Blocked IP address: ${ip}`);
  }

  private async flagIPForReview(ip: string) {
    await redis.sadd("security:ip:review", ip);
    logger.info(`Flagged IP for review: ${ip}`);
  }

  private async restrictAPIAccess(ip: string) {
    await redis.setex(`security:api:restricted:${ip}`, 1800, "1"); // Restrict for 30 minutes
    logger.info(`Restricted API access for IP: ${ip}`);
  }

  private getSeverityLevel(severity: SecurityEventSeverity): string {
    switch (severity) {
      case SecurityEventSeverity.CRITICAL:
        return "error";
      case SecurityEventSeverity.HIGH:
        return "warn";
      case SecurityEventSeverity.MEDIUM:
        return "info";
      case SecurityEventSeverity.LOW:
        return "debug";
      default:
        return "info";
    }
  }

  private getThresholdForEventType(type: SecurityEventType): number {
    switch (type) {
      case SecurityEventType.AUTH_FAILURE:
        return THRESHOLDS.AUTH_FAILURES;
      case SecurityEventType.RATE_LIMIT:
        return THRESHOLDS.RATE_LIMIT_VIOLATIONS;
      default:
        return 5; // Default threshold
    }
  }

  private requiresImmediateAlert(event: SecurityEvent): boolean {
    return (
      event.severity === SecurityEventSeverity.CRITICAL ||
      event.type === SecurityEventType.SQL_INJECTION ||
      event.type === SecurityEventType.XSS_ATTEMPT
    );
  }

  private async checkAuthFailures() {
    const failures = await redis.keys("security:pattern:auth_failure:*");
    for (const key of failures) {
      const count = await redis.get(key);
      if (count && parseInt(count) >= THRESHOLDS.AUTH_FAILURES) {
        const ip = key.split(":").pop();
        await this.blockIP(ip!);
      }
    }
  }

  private async checkRateLimitViolations() {
    const violations = await redis.keys("security:pattern:rate_limit:*");
    for (const key of violations) {
      const count = await redis.get(key);
      if (count && parseInt(count) >= THRESHOLDS.RATE_LIMIT_VIOLATIONS) {
        const ip = key.split(":").pop();
        await this.restrictAPIAccess(ip!);
      }
    }
  }

  private async checkSuspiciousIPs() {
    const ips = await redis.smembers("security:ip:review");
    for (const ip of ips) {
      const score = await this.calculateIPRiskScore(ip);
      if (score >= THRESHOLDS.SUSPICIOUS_IP_SCORE) {
        await this.blockIP(ip);
      }
    }
  }

  private async calculateIPRiskScore(ip: string): Promise<number> {
    // Implement IP risk scoring logic here
    // This could include:
    // - Geographic location check
    // - VPN/Proxy detection
    // - Previous violation history
    // - Request patterns
    return 0.5; // Placeholder implementation
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();
