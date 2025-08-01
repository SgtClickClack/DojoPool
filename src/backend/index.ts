process.on('uncaughtException', (err, origin) => {
  console.error('----- UNCAUGHT EXCEPTION -----');
  console.error('Caught exception:', err, 'Exception origin:', origin);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('----- UNHANDLED REJECTION -----');
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { logger, httpLogger, errorLogger, performanceLogger, metricsMiddleware, healthCheck, gracefulShutdown } from '../config/monitoring.js';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors'; // If you need CORS
import { createProxyMiddleware } from 'http-proxy-middleware';
// import { NarrativeEventSystem } from '.ts';
// import blockchainRoutes from '.ts';
// import venueRoutes from '.ts';
// import economyRoutes from '.ts';
// import socialRoutes from './routes/social.js';
// import clanRoutes from '.ts';
// import territoryRoutes from './routes/territory.js';
// import userNftsRoutes from './routes/userNfts.js';
import challengeRoutes from './routes/challenge.js';
// import tournamentRoutes from './routes/tournament.js';
// import passiveIncomeRoutes from './routes/passive-income.js';
// import enhancedSocialRoutes from '.js';
// import advancedTournamentRoutes from '.js';
// import advancedPlayerAnalyticsRoutes from '.js';
// import advancedVenueManagementRoutes from '.js';
// import advancedSocialCommunityRoutes from '.js';
// import investorAuthRoutes from './routes/investor-auth.js';
// import venueCustomizationRoutes from './routes/venue-customization.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
// import morgan from 'morgan';
import { config } from 'dotenv';
// import { errorHandler } from '.ts';
// import { authMiddleware } from '.ts';
// import { validateRequest } from '.ts';
import { param, query } from 'express-validator';
// import venueLeaderboardRoutes from '.js';
// import { venueLeaderboardService } from '.js';
// import advancedAnalyticsRoutes from '.js';
// import { advancedAnalyticsService } from '.js';
// import highlightsRoutes from './routes/highlights.js';
// import dojoRoutes from './routes/dojo.js';
// import challengePhase4Routes from './routes/challenge-phase4.js';
// import playerRoutes from './routes/player.js';
// import matchTrackingRoutes from './routes/match-tracking.js';
// import { advancedBlockchainIntegrationRouter } from '.ts';

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
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('DojoPool Platform Backend API');
});

// Enhanced health check with metrics
app.get('/api/health', healthCheck);

// Register routes
app.use('/api/challenge', challengeRoutes(io));
// app.use('/api', socialRoutes);
// app.use('/api', territoryRoutes);
// app.use('/api', userNftsRoutes);
// app.use('/api', tournamentRoutes);
// app.use('/api/passive-income', passiveIncomeRoutes);
// app.use('/api/venue-leaderboard', venueLeaderboardRoutes);
// app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
// app.use('/api/analytics', advancedAnalyticsRoutes);
// app.use('/api/highlights', highlightsRoutes);
// app.use('/api/enhanced-social', enhancedSocialRoutes);
// app.use('/api/advanced-tournaments', advancedTournamentRoutes);
// app.use('/api/advanced-player-analytics', advancedPlayerAnalyticsRoutes);
// app.use('/api/advanced-venue-management', advancedVenueManagementRoutes);
// app.use('/api/advanced-blockchain-integration', advancedBlockchainIntegrationRouter);
// app.use('/api/advanced-social-community', advancedSocialCommunityRoutes);
// app.use('/api/dojo', dojoRoutes);
// app.use('/api/player', playerRoutes);
// app.use('/api/challenge', challengePhase4Routes);
// app.use('/api/match-tracking', matchTrackingRoutes);
// app.use('/api/investor/auth', investorAuthRoutes);
// app.use('/api/venue-customization', venueCustomizationRoutes);

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
app.use('/api/*', (req: express.Request, res: express.Response) => {
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
// venueLeaderboardService.startLeaderboardUpdates();
// logger.info('Venue Leaderboard Service connected to server');

// Initialize advanced analytics service
// advancedAnalyticsService.startAnalyticsUpdates();
// logger.info('Advanced Analytics Service connected to server');

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
// Only start server if this file is being run directly
if (process.argv[1] && process.argv[1].endsWith('index.ts')) {
  server.listen(port, () => {
    logger.info(`🚀 DojoPool Backend Server running on port ${port}`);
    logger.info(`📊 Health check available at http://localhost:${port}/api/health`);
    logger.info(`🏆 Tournament API available at http://localhost:${port}/api/tournaments`);
  });
}

export default app;


