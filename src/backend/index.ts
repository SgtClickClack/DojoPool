import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
// Temporarily commenting out the monitoring import to fix the server crash
// import { logger, httpLogger, errorLogger, performanceLogger, metricsMiddleware, healthCheck, gracefulShutdown } from '../config/monitoring';
// Temporary implementations of the monitoring functions
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};
const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};
const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.message} - ${req.method} ${req.url}`);
  next(err);
};
const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${duration}ms`);
  });
  next();
};
const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Basic metrics collection
  next();
};
const healthCheck = (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    memory: process.memoryUsage(),
  });
};
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  process.exit(0);
};
import rateLimit from 'express-rate-limit';
import { body, validationResult, ValidationChain } from 'express-validator'; // Import ValidationChain
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors'; // If you need CORS
import { createProxyMiddleware } from 'http-proxy-middleware';
// import { NarrativeEventSystem } from '../services/narrative/NarrativeEventSystem';
// import blockchainRoutes from './routes/blockchain';
// import venueRoutes from './routes/venue';
// import economyRoutes from './routes/economy';
import socialRoutes from './routes/social';
// import clanRoutes from './routes/clan';
import territoryRoutes from './routes/territory';
import userNftsRoutes from './routes/userNfts';
import challengeRoutes from './routes/challenge';
import tournamentRoutes from './routes/tournament';
import passiveIncomeRoutes from './routes/passive-income';
import enhancedSocialRoutes from './routes/enhanced-social';
import advancedTournamentRoutes from './routes/advanced-tournament';
import advancedPlayerAnalyticsRoutes from './routes/advanced-player-analytics';
import advancedVenueManagementRoutes from './routes/advanced-venue-management';
import advancedSocialCommunityRoutes from './routes/advanced-social-community';
import investorAuthRoutes from './routes/investor-auth';
import venueCustomizationRoutes from './routes/venue-customization';
import { createServer } from 'http';
import { Server } from 'socket.io';
// import morgan from 'morgan';
import { config } from 'dotenv';
// import { errorHandler } from './middleware/errorHandler';
// import { authMiddleware } from './middleware/auth';
// import { validateRequest } from './middleware/validation';
import { param, query } from 'express-validator';
import venueLeaderboardRoutes from './routes/venue-leaderboard';
import { venueLeaderboardService } from '../services/venue/VenueLeaderboardService';
import advancedAnalyticsRoutes from './routes/advanced-analytics';
import { advancedAnalyticsService } from '../services/analytics/AdvancedAnalyticsService';
import highlightsRoutes from './routes/highlights';
import dojoRoutes from './routes/dojo';
import challengePhase4Routes from './routes/challenge-phase4';
import playerRoutes from './routes/player';
import matchTrackingRoutes from './routes/match-tracking';
// import { advancedBlockchainIntegrationRouter } from './routes/advanced-blockchain-integration';

// Load environment variables
config();

logger.info('🔍 Backend index.ts loaded - app initialization starting');

const app = express();
const port = process.env.PORT || 8080;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// --- Essential Middleware ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced Helmet configuration for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Environment-specific CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://dojopool.com']
    : ['http://localhost:3000', 'http://localhost:3101', 'http://127.0.0.1:3101'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Enhanced rate limiting for production
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 50 : 100, // Stricter in production
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Additional security middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
});

// Monitoring and logging middleware
app.use(metricsMiddleware);
app.use(httpLogger);
app.use(performanceLogger);

// --- API Routes ---
app.get('/', (req: Request, res: Response) => {
  res.send('DojoPool Platform Backend API');
});

// Enhanced health check with metrics
app.get('/api/health', healthCheck);

// Register routes
app.use('/api/challenge', challengeRoutes(io));
app.use('/api', socialRoutes);
app.use('/api', territoryRoutes);
app.use('/api', userNftsRoutes);
app.use('/api', tournamentRoutes);
app.use('/api/passive-income', passiveIncomeRoutes);
app.use('/api/venue-leaderboard', venueLeaderboardRoutes);
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
app.use('/api/analytics', advancedAnalyticsRoutes);
app.use('/api/highlights', highlightsRoutes);
app.use('/api/enhanced-social', enhancedSocialRoutes);
app.use('/api/advanced-tournaments', advancedTournamentRoutes);
app.use('/api/advanced-player-analytics', advancedPlayerAnalyticsRoutes);
app.use('/api/advanced-venue-management', advancedVenueManagementRoutes);
// app.use('/api/advanced-blockchain-integration', advancedBlockchainIntegrationRouter);
app.use('/api/advanced-social-community', advancedSocialCommunityRoutes);
app.use('/api/dojo', dojoRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/challenge', challengePhase4Routes);
app.use('/api/match-tracking', matchTrackingRoutes);
app.use('/api/investor/auth', investorAuthRoutes);
app.use('/api/venue-customization', venueCustomizationRoutes);

// --- Global Error Handling Middleware ---
app.use(errorLogger);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`[${req.method}] ${req.originalUrl} - Unhandled Error: ${err.message}`);

  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
});

// --- Not Found Handler for API ---
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Initialize Socket.IO
io.on('connection', (socket) => {
  logger.info(`Socket.IO client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Socket.IO client disconnected: ${socket.id}`);
  });
});

// Initialize venue leaderboard service
venueLeaderboardService.startLeaderboardUpdates();
logger.info('Venue Leaderboard Service connected to server');

// Initialize advanced analytics service
advancedAnalyticsService.startAnalyticsUpdates();
logger.info('Advanced Analytics Service connected to server');

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
if (require.main === module) {
  server.listen(port, () => {
    logger.info(`🚀 DojoPool Backend Server running on port ${port}`);
    logger.info(`📊 Health check available at http://localhost:${port}/api/health`);
    logger.info(`🏆 Tournament API available at http://localhost:${port}/api/tournaments`);
  });
}

export default app;