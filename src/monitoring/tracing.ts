import { trace, Tracer, Span, SpanKind } from '@opentelemetry/api';
import { ConsistencyMetrics } from './types';
import { GameState } from '../types/game';

export interface TracingConfig {
  serviceName: string;
  environment: string;
}

export class DistributedTracer {
  private tracer: Tracer;
  private serviceName: string;
  private environment: string;

  constructor(config: TracingConfig) {
    this.tracer = trace.getTracer('dojopool-tracer');
    this.serviceName = config.serviceName;
    this.environment = config.environment;
  }

  public async trackConsistencyMetrics(metrics: ConsistencyMetrics): Promise<void> {
    const span = this.tracer.startSpan('consistency-check', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'service.name': this.serviceName,
        'environment': this.environment,
        'consistency.latency': metrics.latency,
        'consistency.level': metrics.level,
        'consistency.node_count': metrics.nodes,
        'consistency.success_rate': metrics.successRate
      }
    });

    try {
      await this.recordMetrics(metrics);
    } finally {
      span.end();
    }
  }

  public async trackStateUpdate(state: GameState, nodeId: string): Promise<void> {
    const span = this.tracer.startSpan('state-update', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'service.name': this.serviceName,
        'environment': this.environment,
        'node.id': nodeId,
        'state.tables': state.tables.length,
        'state.players': state.players.length,
        'state.phase': state.gamePhase
      }
    });

    try {
      await this.recordStateMetrics(state);
    } finally {
      span.end();
    }
  }

  public async trackConsensusEvent(
    eventType: string,
    term: number,
    nodeId: string
  ): Promise<void> {
    const span = this.tracer.startSpan('consensus-event', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'service.name': this.serviceName,
        'environment': this.environment,
        'consensus.event': eventType,
        'consensus.term': term,
        'node.id': nodeId
      }
    });

    try {
      await this.recordConsensusMetrics(eventType, term);
    } finally {
      span.end();
    }
  }

  private async recordMetrics(metrics: ConsistencyMetrics): Promise<void> {
    // Here we would integrate with a metrics system like Prometheus
    // For now, we'll just log the metrics
    console.log('Consistency Metrics:', {
      timestamp: new Date().toISOString(),
      ...metrics
    });
  }

  private async recordStateMetrics(state: GameState): Promise<void> {
    console.log('State Metrics:', {
      timestamp: new Date().toISOString(),
      tablesTotalCount: state.tables.length,
      playersTotalCount: state.players.length,
      currentGamePhase: state.gamePhase
    });
  }

  private async recordConsensusMetrics(eventType: string, term: number): Promise<void> {
    console.log('Consensus Metrics:', {
      timestamp: new Date().toISOString(),
      eventType,
      term
    });
  }
} 