const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const config = require('./production-config');

class ProductionBackend {
  constructor() {
    this.server = null;
    this.routes = new Map();
    this.middleware = [];
    this.stats = {
      requests: 0,
      errors: 0,
      startTime: Date.now(),
    };

    this.initializeRoutes();
    this.initializeMiddleware();
  }

  initializeRoutes() {
    // Health check endpoint
    this.routes.set('/api/health', {
      method: 'GET',
      handler: (req, res) => {
        const uptime = Date.now() - this.stats.startTime;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: uptime,
            stats: {
              requests: this.stats.requests,
              errors: this.stats.errors,
              uptime: uptime,
            },
            environment: config.environment,
            version: '1.0.0',
          })
        );
      },
    });

    // Game status endpoint
    this.routes.set('/api/game-status', {
      method: 'GET',
      handler: (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            player: {
              level: 12,
              xp: 1250,
              clan: 'Crimson Monkey Clan',
              achievements: 15,
              homeDojo: 'The Jade Tiger',
              territory: {
                owned: 3,
                total: 8,
                currentObjective: 'Defend The Jade Tiger',
              },
            },
            game: {
              status: 'active',
              lastMatch: '2025-01-30T10:30:00Z',
              nextTournament: '2025-02-01T14:00:00Z',
              features: config.features,
            },
            system: {
              environment: config.environment,
              version: '1.0.0',
              uptime: Date.now() - this.stats.startTime,
            },
          })
        );
      },
    });


    // Performance metrics endpoint
    this.routes.set('/api/metrics', {
      method: 'GET',
      handler: (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            requests: this.stats.requests,
            errors: this.stats.errors,
            uptime: Date.now() - this.stats.startTime,
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
          })
        );
      },
    });

    // Feature flags endpoint
    this.routes.set('/api/features', {
      method: 'GET',
      handler: (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(config.features));
      },
    });

    // Clan wars endpoint
    this.routes.set('/api/clan-wars', {
      method: 'GET',
      handler: (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            activeWars: [
              {
                id: 1,
                clan1: 'Crimson Monkey Clan',
                clan2: 'Shadow Dragon Clan',
                territory: 'The Jade Tiger',
                status: 'active',
                startDate: '2025-01-28T10:00:00Z',
              },
            ],
            playerClan: 'Crimson Monkey Clan',
            territoryControl: {
              owned: 3,
              contested: 1,
              total: 8,
            },
          })
        );
      },
    });

    // Tournament endpoint
    this.routes.set('/api/tournaments', {
      method: 'GET',
      handler: (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            upcoming: [
              {
                id: 1,
                name: 'Winter Championship',
                venue: 'The Jade Tiger',
                date: '2025-02-01T14:00:00Z',
                prizePool: 1000,
                participants: 16,
                maxParticipants: 32,
              },
            ],
            active: [],
            completed: [],
          })
        );
      },
    });

    // AI commentary endpoint
    this.routes.set('/api/ai-commentary', {
      method: 'GET',
      handler: (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'active',
            styles: ['professional', 'excited', 'analytical', 'casual'],
            currentMatch: {
              id: 'match-123',
              players: ['Player1', 'Player2'],
              commentary:
                'What an incredible shot! The precision is absolutely remarkable.',
              excitement: 8.5,
            },
          })
        );
      },
    });
  }

  initializeMiddleware() {
    // CORS middleware
    this.middleware.push((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', config.server.cors.origin);
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      next();
    });

    // Logging middleware
    this.middleware.push((req, res, next) => {
      const start = Date.now();
      this.stats.requests++;

      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
          `${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`
        );
      });

      next();
    });

    // Error handling middleware
    this.middleware.push((req, res, next) => {
      res.on('error', (error) => {
        this.stats.errors++;
        console.error('Response error:', error);
      });

      next();
    });
  }

  handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Apply middleware
    let middlewareIndex = 0;
    const next = () => {
      if (middlewareIndex < this.middleware.length) {
        this.middleware[middlewareIndex++](req, res, next);
      } else {
        this.routeRequest(req, res, pathname, method);
      }
    };

    next();
  }

  routeRequest(req, res, pathname, method) {
    const route = this.routes.get(pathname);

    if (route && route.method === method) {
      try {
        route.handler(req, res);
      } catch (error) {
        this.stats.errors++;
        console.error('Route handler error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Internal Server Error',
            message:
              config.environment === 'development'
                ? error.message
                : 'Something went wrong',
          })
        );
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Not Found',
          message: `Endpoint ${method} ${pathname} not found`,
        })
      );
    }
  }

  start() {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(config.server.port, config.server.host, () => {
      console.log(
        `🚀 DojoPool Production Backend running on http://${config.server.host}:${config.server.port}`
      );
      console.log(
        `📊 Health check: http://${config.server.host}:${config.server.port}/api/health`
      );
      console.log(
        `📈 Metrics: http://${config.server.host}:${config.server.port}/api/metrics`
      );
      console.log(
        `🎮 Game status: http://${config.server.host}:${config.server.port}/api/game-status`
      );
      console.log(
        `🏆 Tournaments: http://${config.server.host}:${config.server.port}/api/tournaments`
      );
      console.log(
        `⚔️ Clan Wars: http://${config.server.host}:${config.server.port}/api/clan-wars`
      );
      console.log(
        `🤖 AI Commentary: http://${config.server.host}:${config.server.port}/api/ai-commentary`
      );
      console.log(`🔧 Environment: ${config.environment}`);
      console.log(
        `⚙️ Features: ${Object.keys(config.features)
          .filter((k) => config.features[k])
          .join(', ')}`
      );
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down production server...');
      this.server.close(() => {
        console.log('✅ Production server closed');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      this.server.close(() => {
        console.log('✅ Production server closed');
        process.exit(0);
      });
    });
  }
}

// Start the production server
if (require.main === module) {
  const server = new ProductionBackend();
  server.start();
}

module.exports = ProductionBackend;
