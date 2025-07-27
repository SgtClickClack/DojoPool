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
            activeConnections: 0,
            peakConnections: 0
        };
        this.rateLimitMap = new Map(); // Simple rate limiting
        this.cache = new Map(); // Simple in-memory cache
        this.healthCheckInterval = null;

        this.initializeRoutes();
        this.initializeMiddleware();
        this.startHealthCheck();
    }

    initializeRoutes() {
        // Health check endpoint with enhanced metrics
        this.routes.set('/api/health', {
            method: 'GET',
            handler: (req, res) => {
                const uptime = Date.now() - this.stats.startTime;
                const memUsage = process.memoryUsage();
                const cpuUsage = process.cpuUsage();
                
                const healthData = {
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    uptime: uptime,
                    stats: {
                        requests: this.stats.requests,
                        errors: this.stats.errors,
                        activeConnections: this.stats.activeConnections,
                        peakConnections: this.stats.peakConnections,
                        uptime: uptime,
                        errorRate: this.stats.requests > 0 ? (this.stats.errors / this.stats.requests * 100).toFixed(2) + '%' : '0%'
                    },
                    system: {
                        memory: {
                            used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
                            total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
                            external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
                        },
                        cpu: {
                            user: cpuUsage.user,
                            system: cpuUsage.system
                        }
                    },
                    environment: config.environment,
                    version: '1.0.0'
                };
                
                this.sendJsonResponse(res, 200, healthData);
            },
            cacheable: false
        });

        // Game status endpoint with caching
        this.routes.set('/api/game-status', {
            method: 'GET',
            handler: (req, res) => {
                const cacheKey = 'game-status';
                const cached = this.getFromCache(cacheKey);
                
                if (cached) {
                    this.sendJsonResponse(res, 200, cached);
                    return;
                }
                
                const gameStatus = {
                    player: {
                        level: 12,
                        xp: 1250,
                        clan: 'Crimson Monkey Clan',
                        achievements: 15,
                        homeDojo: 'The Jade Tiger',
                        territory: {
                            owned: 3,
                            total: 8,
                            currentObjective: 'Defend The Jade Tiger'
                        }
                    },
                    game: {
                        status: 'active',
                        lastMatch: '2025-01-30T10:30:00Z',
                        nextTournament: '2025-02-01T14:00:00Z',
                        features: config.features
                    },
                    system: {
                        environment: config.environment,
                        version: '1.0.0',
                        uptime: Date.now() - this.stats.startTime
                    }
                };
                
                this.setCache(cacheKey, gameStatus, 30000); // Cache for 30 seconds
                this.sendJsonResponse(res, 200, gameStatus);
            },
            cacheable: true
        });

        // Test endpoint
        this.routes.set('/api/test', {
            method: 'GET',
            handler: (req, res) => {
                this.sendJsonResponse(res, 200, {
                    message: 'Production backend is working!',
                    timestamp: new Date().toISOString(),
                    nodeVersion: process.version,
                    platform: process.platform
                });
            },
            cacheable: false
        });

        // Performance metrics endpoint
        this.routes.set('/api/metrics', {
            method: 'GET',
            handler: (req, res) => {
                const memUsage = process.memoryUsage();
                const cpuUsage = process.cpuUsage();
                
                this.sendJsonResponse(res, 200, {
                    requests: this.stats.requests,
                    errors: this.stats.errors,
                    uptime: Date.now() - this.stats.startTime,
                    activeConnections: this.stats.activeConnections,
                    peakConnections: this.stats.peakConnections,
                    memory: {
                        heap: {
                            used: memUsage.heapUsed,
                            total: memUsage.heapTotal
                        },
                        external: memUsage.external,
                        rss: memUsage.rss
                    },
                    cpu: cpuUsage,
                    cache: {
                        size: this.cache.size,
                        hitRate: this.calculateCacheHitRate()
                    }
                });
            },
            cacheable: false
        });

        // Feature flags endpoint with caching
        this.routes.set('/api/features', {
            method: 'GET',
            handler: (req, res) => {
                this.sendJsonResponse(res, 200, config.features);
            },
            cacheable: true
        });

        // Clan wars endpoint with enhanced data
        this.routes.set('/api/clan-wars', {
            method: 'GET',
            handler: (req, res) => {
                const cacheKey = 'clan-wars';
                const cached = this.getFromCache(cacheKey);
                
                if (cached) {
                    this.sendJsonResponse(res, 200, cached);
                    return;
                }
                
                const clanWarsData = {
                    activeWars: [
                        {
                            id: 1,
                            clan1: 'Crimson Monkey Clan',
                            clan2: 'Shadow Dragon Clan',
                            territory: 'The Jade Tiger',
                            status: 'active',
                            startDate: '2025-01-28T10:00:00Z',
                            participants: 24,
                            currentScore: { clan1: 15, clan2: 12 }
                        }
                    ],
                    playerClan: 'Crimson Monkey Clan',
                    territoryControl: {
                        owned: 3,
                        contested: 1,
                        total: 8
                    }
                };
                
                this.setCache(cacheKey, clanWarsData, 60000); // Cache for 1 minute
                this.sendJsonResponse(res, 200, clanWarsData);
            },
            cacheable: true
        });

        // Tournament endpoint with enhanced data
        this.routes.set('/api/tournaments', {
            method: 'GET',
            handler: (req, res) => {
                const cacheKey = 'tournaments';
                const cached = this.getFromCache(cacheKey);
                
                if (cached) {
                    this.sendJsonResponse(res, 200, cached);
                    return;
                }
                
                const tournamentData = {
                    upcoming: [
                        {
                            id: 1,
                            name: 'Winter Championship',
                            venue: 'The Jade Tiger',
                            date: '2025-02-01T14:00:00Z',
                            prizePool: 1000,
                            participants: 16,
                            maxParticipants: 32,
                            entryFee: 50,
                            format: 'single-elimination'
                        }
                    ],
                    active: [],
                    completed: []
                };
                
                this.setCache(cacheKey, tournamentData, 120000); // Cache for 2 minutes
                this.sendJsonResponse(res, 200, tournamentData);
            },
            cacheable: true
        });

        // AI commentary endpoint with caching
        this.routes.set('/api/ai-commentary', {
            method: 'GET',
            handler: (req, res) => {
                const cacheKey = 'ai-commentary';
                const cached = this.getFromCache(cacheKey);
                
                if (cached) {
                    this.sendJsonResponse(res, 200, cached);
                    return;
                }
                
                const commentaryData = {
                    status: 'active',
                    styles: ['professional', 'excited', 'analytical', 'casual'],
                    currentMatch: {
                        id: 'match-123',
                        players: ['Player1', 'Player2'],
                        commentary: 'What an incredible shot! The precision is absolutely remarkable.',
                        excitement: 8.5,
                        timestamp: new Date().toISOString()
                    }
                };
                
                this.setCache(cacheKey, commentaryData, 15000); // Cache for 15 seconds
                this.sendJsonResponse(res, 200, commentaryData);
            },
            cacheable: true
        });
    }

    initializeMiddleware() {
        // Connection tracking middleware
        this.middleware.push((req, res, next) => {
            this.stats.activeConnections++;
            this.stats.peakConnections = Math.max(this.stats.peakConnections, this.stats.activeConnections);
            
            res.on('close', () => {
                this.stats.activeConnections--;
            });
            
            next();
        });

        // Rate limiting middleware
        this.middleware.push((req, res, next) => {
            const clientIp = req.connection.remoteAddress || req.socket.remoteAddress;
            const now = Date.now();
            const windowMs = 60000; // 1 minute window
            const maxRequests = 100; // Max 100 requests per minute
            
            if (!this.rateLimitMap.has(clientIp)) {
                this.rateLimitMap.set(clientIp, { requests: 1, resetTime: now + windowMs });
                next();
                return;
            }
            
            const clientData = this.rateLimitMap.get(clientIp);
            
            if (now > clientData.resetTime) {
                // Reset the window
                clientData.requests = 1;
                clientData.resetTime = now + windowMs;
                next();
                return;
            }
            
            if (clientData.requests >= maxRequests) {
                res.writeHead(429, { 
                    'Content-Type': 'application/json',
                    'Retry-After': Math.ceil((clientData.resetTime - now) / 1000)
                });
                res.end(JSON.stringify({
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
                }));
                return;
            }
            
            clientData.requests++;
            next();
        });

        // CORS middleware with improved security
        this.middleware.push((req, res, next) => {
            const allowedOrigins = config.server.cors.origin === '*' 
                ? ['http://localhost:3000', 'http://localhost:5173'] 
                : [config.server.cors.origin];
            
            const origin = req.headers.origin;
            if (allowedOrigins.includes(origin) || config.environment === 'development') {
                res.setHeader('Access-Control-Allow-Origin', origin || '*');
            }
            
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            next();
        });

        // Security headers middleware
        this.middleware.push((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            if (req.headers['x-forwarded-proto'] === 'https' || config.environment === 'production') {
                res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            }
            next();
        });

        // Logging middleware with performance tracking
        this.middleware.push((req, res, next) => {
            const start = process.hrtime.bigint();
            this.stats.requests++;

            res.on('finish', () => {
                const end = process.hrtime.bigint();
                const duration = Number(end - start) / 1000000; // Convert to milliseconds
                
                if (config.environment === 'development' || duration > 1000) { // Log slow requests
                    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
                }
                
                if (res.statusCode >= 400) {
                    this.stats.errors++;
                }
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

    // Cache management methods
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        cached.hits = (cached.hits || 0) + 1;
        return cached.data;
    }

    setCache(key, data, ttl = 60000) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl,
            hits: 0,
            created: Date.now()
        });
        
        // Simple cache cleanup to prevent memory leaks
        if (this.cache.size > 100) {
            const oldestKey = Array.from(this.cache.keys())[0];
            this.cache.delete(oldestKey);
        }
    }

    calculateCacheHitRate() {
        const entries = Array.from(this.cache.values());
        if (entries.length === 0) return 0;
        
        const totalHits = entries.reduce((sum, entry) => sum + (entry.hits || 0), 0);
        return entries.length > 0 ? (totalHits / entries.length).toFixed(2) : 0;
    }

    sendJsonResponse(res, statusCode, data) {
        res.writeHead(statusCode, { 
            'Content-Type': 'application/json',
            'Cache-Control': statusCode === 200 ? 'public, max-age=30' : 'no-cache'
        });
        res.end(JSON.stringify(data, null, config.environment === 'development' ? 2 : 0));
    }

    startHealthCheck() {
        // Periodic cleanup and health monitoring
        this.healthCheckInterval = setInterval(() => {
            // Cleanup expired cache entries
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (now > value.expiry) {
                    this.cache.delete(key);
                }
            }
            
            // Cleanup old rate limit entries
            for (const [ip, data] of this.rateLimitMap.entries()) {
                if (now > data.resetTime) {
                    this.rateLimitMap.delete(ip);
                }
            }
            
            // Log health status in development
            if (config.environment === 'development') {
                console.log(`Health Check - Connections: ${this.stats.activeConnections}, Cache: ${this.cache.size}, Rate Limits: ${this.rateLimitMap.size}`);
            }
        }, 30000); // Every 30 seconds
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
                this.sendJsonResponse(res, 500, {
                    error: 'Internal Server Error',
                    message: config.environment === 'development' ? error.message : 'Something went wrong',
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            this.sendJsonResponse(res, 404, {
                error: 'Not Found',
                message: `Endpoint ${method} ${pathname} not found`,
                timestamp: new Date().toISOString()
            });
        }
    }

    start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        // Set server timeouts for better performance
        this.server.timeout = 30000; // 30 seconds
        this.server.keepAliveTimeout = 5000; // 5 seconds
        this.server.headersTimeout = 60000; // 60 seconds

        this.server.listen(config.server.port, config.server.host, () => {
            console.log(`🚀 DojoPool Production Backend running on http://${config.server.host}:${config.server.port}`);
            console.log(`📊 Health check: http://${config.server.host}:${config.server.port}/api/health`);
            console.log(`📈 Metrics: http://${config.server.host}:${config.server.port}/api/metrics`);
            console.log(`🎮 Game status: http://${config.server.host}:${config.server.port}/api/game-status`);
            console.log(`🏆 Tournaments: http://${config.server.host}:${config.server.port}/api/tournaments`);
            console.log(`⚔️ Clan Wars: http://${config.server.host}:${config.server.port}/api/clan-wars`);
            console.log(`🤖 AI Commentary: http://${config.server.host}:${config.server.port}/api/ai-commentary`);
            console.log(`🔧 Environment: ${config.environment}`);
            console.log(`⚙️ Features: ${Object.keys(config.features).filter(k => config.features[k]).join(', ')}`);
        });

        // Graceful shutdown with cleanup
        const gracefulShutdown = (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down production server...`);
            
            // Stop accepting new connections
            this.server.close(() => {
                console.log('✅ Production server closed');
                
                // Cleanup intervals
                if (this.healthCheckInterval) {
                    clearInterval(this.healthCheckInterval);
                }
                
                // Clear caches
                this.cache.clear();
                this.rateLimitMap.clear();
                
                console.log('🧹 Cleanup completed');
                process.exit(0);
            });
            
            // Force close after 10 seconds
            setTimeout(() => {
                console.log('❌ Forcing shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.stats.errors++;
            gracefulShutdown('uncaughtException');
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.stats.errors++;
        });
    }
}

// Start the production server
if (require.main === module) {
    const server = new ProductionBackend();
    server.start();
}

module.exports = ProductionBackend;