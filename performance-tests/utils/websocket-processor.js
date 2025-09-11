const { v4: uuidv4 } = require('uuid');

class WebSocketProcessor {
  constructor() {
    this.connections = new Map();
    this.messageCounts = new Map();
  }

  // Setup function called before tests start
  setup(requestParams, context, ee, next) {
    console.log('WebSocket performance test setup complete');
    return next();
  }

  // Cleanup function called after tests complete
  teardown(requestParams, context, ee, next) {
    console.log('WebSocket performance test teardown complete');
    console.log(
      'Connection summary:',
      this.connections.size,
      'total connections'
    );
    console.log('Message summary:', this.getMessageStats());
    return next();
  }

  // Handle WebSocket connection events
  onConnection(socket, context, ee, next) {
    const connectionId = uuidv4();
    this.connections.set(connectionId, {
      id: connectionId,
      connectedAt: Date.now(),
      messageCount: 0,
      lastActivity: Date.now(),
    });

    console.log(`WebSocket connection established: ${connectionId}`);
    return next();
  }

  // Handle WebSocket disconnection events
  onDisconnect(socket, context, ee, next) {
    // Find and update connection record
    for (const [id, connection] of this.connections) {
      if (connection.socket === socket) {
        connection.disconnectedAt = Date.now();
        connection.duration =
          connection.disconnectedAt - connection.connectedAt;
        console.log(
          `WebSocket connection closed: ${id} (duration: ${connection.duration}ms)`
        );
        break;
      }
    }
    return next();
  }

  // Handle incoming WebSocket messages
  onMessage(message, socket, context, ee, next) {
    try {
      const data = JSON.parse(message);
      const eventType = data.type || data.event || 'unknown';

      // Track message counts by type
      const currentCount = this.messageCounts.get(eventType) || 0;
      this.messageCounts.set(eventType, currentCount + 1);

      // Update connection activity
      for (const [id, connection] of this.connections) {
        if (connection.socket === socket) {
          connection.messageCount++;
          connection.lastActivity = Date.now();
          break;
        }
      }

      // Log significant events
      if (
        ['tournament_started', 'match_ended', 'achievement_unlocked'].includes(
          eventType
        )
      ) {
        console.log(`Received ${eventType} event`);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }

    return next();
  }

  // Generate random tournament ID for testing
  generateTournamentId(context, events, done) {
    const tournamentId = `perf-test-tournament-${Math.floor(Math.random() * 1000)}`;
    context.vars.tournamentId = tournamentId;
    return done();
  }

  // Generate random match ID for testing
  generateMatchId(context, events, done) {
    const matchId = `perf-test-match-${Math.floor(Math.random() * 1000)}`;
    context.vars.matchId = matchId;
    return done();
  }

  // Generate random user ID for testing
  generateUserId(context, events, done) {
    const userId = `perf-test-user-${Math.floor(Math.random() * 10000)}`;
    context.vars.userId = userId;
    return done();
  }

  // Get message statistics
  getMessageStats() {
    const stats = {};
    for (const [eventType, count] of this.messageCounts) {
      stats[eventType] = count;
    }
    return stats;
  }

  // Custom metrics collection
  collectMetrics(context, events, done) {
    const metrics = {
      activeConnections: this.connections.size,
      totalMessages: Array.from(this.messageCounts.values()).reduce(
        (a, b) => a + b,
        0
      ),
      messageTypes: this.getMessageStats(),
      timestamp: Date.now(),
    };

    // Emit custom metrics
    events.emit('histogram', 'websocket_connections', this.connections.size);
    events.emit('counter', 'websocket_messages_total', metrics.totalMessages);

    context.vars.metrics = metrics;
    return done();
  }
}

module.exports = {
  WebSocketProcessor,
  // Export individual functions for Artillery
  setup: function (requestParams, context, ee, next) {
    const processor = new WebSocketProcessor();
    return processor.setup(requestParams, context, ee, next);
  },
  teardown: function (requestParams, context, ee, next) {
    const processor = new WebSocketProcessor();
    return processor.teardown(requestParams, context, ee, next);
  },
  onConnection: function (socket, context, ee, next) {
    const processor = new WebSocketProcessor();
    return processor.onConnection(socket, context, ee, next);
  },
  onDisconnect: function (socket, context, ee, next) {
    const processor = new WebSocketProcessor();
    return processor.onDisconnect(socket, context, ee, next);
  },
  onMessage: function (message, socket, context, ee, next) {
    const processor = new WebSocketProcessor();
    return processor.onMessage(message, socket, context, ee, next);
  },
  generateTournamentId: function (context, events, done) {
    const processor = new WebSocketProcessor();
    return processor.generateTournamentId(context, events, done);
  },
  generateMatchId: function (context, events, done) {
    const processor = new WebSocketProcessor();
    return processor.generateMatchId(context, events, done);
  },
  generateUserId: function (context, events, done) {
    const processor = new WebSocketProcessor();
    return processor.generateUserId(context, events, done);
  },
  collectMetrics: function (context, events, done) {
    const processor = new WebSocketProcessor();
    return processor.collectMetrics(context, events, done);
  },
};
