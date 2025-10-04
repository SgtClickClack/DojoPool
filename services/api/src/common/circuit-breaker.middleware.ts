import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

interface CircuitState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  nextAttempt: number;
}

@Injectable()
export class CircuitBreakerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CircuitBreakerMiddleware.name);
  private circuits: Map<string, CircuitState> = new Map();
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      ...config,
    };

    // Clean up old circuits periodically
    setInterval(() => this.cleanup(), this.config.monitoringPeriod);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const circuitKey = this.getCircuitKey(req);
    const circuit = this.getOrCreateCircuit(circuitKey);

    // Check circuit state
    if (circuit.state === 'OPEN') {
      if (Date.now() < circuit.nextAttempt) {
        this.logger.warn(
          `Circuit breaker OPEN for ${circuitKey} - rejecting request`,
          {
            circuitKey,
            failures: circuit.failures,
            nextAttempt: new Date(circuit.nextAttempt).toISOString(),
          }
        );

        res.status(503).json({
          success: false,
          error: {
            code: 'CIRCUIT_BREAKER_OPEN',
            message: 'Service temporarily unavailable due to high error rate',
            timestamp: new Date().toISOString(),
            retryAfter: Math.ceil((circuit.nextAttempt - Date.now()) / 1000),
          },
        });
        return;
      } else {
        // Transition to HALF_OPEN
        circuit.state = 'HALF_OPEN';
        this.logger.log(
          `Circuit breaker transitioning to HALF_OPEN for ${circuitKey}`
        );
      }
    }

    // Track the original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    let responseSent = false;

    // Override response methods to track success/failure
    res.send = function (body) {
      if (!responseSent) {
        this.trackResponse(circuitKey, res.statusCode);
        responseSent = true;
      }
      return originalSend.call(this, body);
    }.bind(this);

    res.json = function (body) {
      if (!responseSent) {
        this.trackResponse(circuitKey, res.statusCode);
        responseSent = true;
      }
      return originalJson.call(this, body);
    }.bind(this);

    // Handle errors
    const originalNext = next;
    next = function (error) {
      if (error) {
        this.trackResponse(circuitKey, 500);
      }
      return originalNext.call(this, error);
    }.bind(this);

    next();
  }

  private getCircuitKey(req: Request): string {
    // Group by method and path pattern (remove dynamic segments)
    const path = req.path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid');
    return `${req.method}:${path}`;
  }

  private getOrCreateCircuit(key: string): CircuitState {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED',
        nextAttempt: 0,
      });
    }
    return this.circuits.get(key)!;
  }

  private trackResponse(circuitKey: string, statusCode: number) {
    const circuit = this.circuits.get(circuitKey)!;
    const isSuccess = statusCode < 500;

    if (isSuccess) {
      // Reset failure count on success
      if (circuit.state === 'HALF_OPEN') {
        circuit.state = 'CLOSED';
        circuit.failures = 0;
        this.logger.log(
          `Circuit breaker CLOSED for ${circuitKey} - service recovered`
        );
      } else if (circuit.failures > 0) {
        circuit.failures = Math.max(0, circuit.failures - 1);
      }
    } else {
      // Increment failure count
      circuit.failures++;
      circuit.lastFailureTime = Date.now();

      this.logger.warn(`Circuit breaker failure for ${circuitKey}`, {
        circuitKey,
        failures: circuit.failures,
        statusCode,
        threshold: this.config.failureThreshold,
      });

      // Check if threshold exceeded
      if (circuit.failures >= this.config.failureThreshold) {
        circuit.state = 'OPEN';
        circuit.nextAttempt = Date.now() + this.config.recoveryTimeout;

        this.logger.error(`Circuit breaker OPENED for ${circuitKey}`, {
          circuitKey,
          failures: circuit.failures,
          nextAttempt: new Date(circuit.nextAttempt).toISOString(),
        });
      }
    }
  }

  private cleanup() {
    const now = Date.now();
    const keys = Array.from(this.circuits.keys());

    for (const key of keys) {
      const circuit = this.circuits.get(key)!;

      // Remove circuits that have been closed for more than monitoring period
      if (
        circuit.state === 'CLOSED' &&
        circuit.failures === 0 &&
        now - circuit.lastFailureTime > this.config.monitoringPeriod
      ) {
        this.circuits.delete(key);
      }
    }
  }

  // Method to get circuit status (useful for monitoring)
  getCircuitStatus(circuitKey?: string) {
    if (circuitKey) {
      const circuit = this.circuits.get(circuitKey);
      return circuit ? { [circuitKey]: circuit } : {};
    }

    return Object.fromEntries(this.circuits);
  }

  // Method to manually reset a circuit (useful for testing)
  resetCircuit(circuitKey: string) {
    this.circuits.delete(circuitKey);
  }
}
