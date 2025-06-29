import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { logger } from '../utils/logger'; // Assuming your logger setup
import rateLimit from 'express-rate-limit';
import { body, validationResult, ValidationChain } from 'express-validator'; // Import ValidationChain
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors'; // If you need CORS
import { createProxyMiddleware } from 'http-proxy-middleware';
import { NarrativeEventSystem } from '../services/narrative/NarrativeEventSystem';
import blockchainRoutes from './routes/blockchain';
import venueRoutes from './routes/venue';
import economyRoutes from './routes/economy';
import socialRoutes from './routes/social';
import clanRoutes from './routes/clan';
import territoryRoutes from './routes/territory';
import userNftsRoutes from './routes/userNfts';
import challengeRoutes from './routes/challenge';
import tournamentRoutes from './routes/tournament';
import aiCommentaryRoutes from './routes/ai-commentary';
import aiCommentaryHighlightsRoutes from './routes/ai-commentary-highlights';
import passiveIncomeRoutes from './routes/passive-income';
import enhancedSocialRoutes from './routes/enhanced-social';
import advancedTournamentRoutes from './routes/advanced-tournament';
import advancedPlayerAnalyticsRoutes from './routes/advanced-player-analytics';
import advancedVenueManagementRoutes from './routes/advanced-venue-management';
import advancedSocialCommunityRoutes from './routes/advanced-social-community';
import advancedAIRefereeRuleEnforcementRoutes from './routes/advanced-ai-referee-rule-enforcement';
import advancedAIMatchCommentaryHighlightsRoutes from './routes/advanced-ai-match-commentary-highlights';
import { createServer } from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';
import { config } from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';
import { param, query } from 'express-validator';
import venueLeaderboardRoutes from './routes/venue-leaderboard';
import { venueLeaderboardService } from '../services/venue/VenueLeaderboardService';
import advancedAnalyticsRoutes from './routes/advanced-analytics';
import { advancedAnalyticsService } from '../services/analytics/AdvancedAnalyticsService';
import highlightsRoutes from './routes/highlights';
import { advancedBlockchainIntegrationRouter } from './routes/advanced-blockchain-integration';

// Load environment variables
config();

console.log('🔍 Backend index.ts loaded - app initialization starting');

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3101', 'http://127.0.0.1:3101'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

// --- Essential Middleware ---
app.use(express.json());

// Helmet configuration
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3101'],
  credentials: true,
}));

// HTTP Request Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- API Routes ---
app.get('/', (req: Request, res: Response) => {
  res.send('DojoPool Platform Backend API');
});

// Register routes
app.use('/api', challengeRoutes);
app.use('/api', socialRoutes);
app.use('/api', territoryRoutes);
app.use('/api', userNftsRoutes);
app.use('/api', aiCommentaryRoutes);
app.use('/api/ai-commentary-highlights', aiCommentaryHighlightsRoutes);
app.use('/api', clanRoutes);
app.use('/api', blockchainRoutes);
app.use('/api', venueRoutes);
app.use('/api', economyRoutes);
app.use('/api', tournamentRoutes);
app.use('/api/passive-income', passiveIncomeRoutes);
app.use('/api/venue-leaderboard', venueLeaderboardRoutes);
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
app.use('/api/highlights', highlightsRoutes);
app.use('/api/enhanced-social', enhancedSocialRoutes);
app.use('/api/advanced-tournaments', advancedTournamentRoutes);
app.use('/api/advanced-player-analytics', advancedPlayerAnalyticsRoutes);
app.use('/api/advanced-venue-management', advancedVenueManagementRoutes);
app.use('/api/advanced-blockchain-integration', advancedBlockchainIntegrationRouter);
app.use('/api/advanced-social-community', advancedSocialCommunityRoutes);
app.use('/api/advanced-ai-referee-rule-enforcement', advancedAIRefereeRuleEnforcementRoutes);
app.use('/api/advanced-ai-match-commentary-highlights', advancedAIMatchCommentaryHighlightsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// --- Global Error Handling Middleware ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${req.method}] ${req.originalUrl} - Unhandled Error: ${err.message}`);

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
  console.log('Socket.IO client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Socket.IO client disconnected:', socket.id);
  });
});

// Initialize venue leaderboard service
venueLeaderboardService.startLeaderboardUpdates();
console.log('Venue Leaderboard Service connected to server');

// Initialize advanced analytics service
advancedAnalyticsService.startAnalyticsUpdates();
console.log('Advanced Analytics Service connected to server');

// Start server
if (require.main === module) {
  server.listen(port, () => {
    console.log(`🚀 DojoPool Backend Server running on port ${port}`);
    console.log(`📊 Health check available at http://localhost:${port}/api/health`);
    console.log(`🏆 Tournament API available at http://localhost:${port}/api/tournaments`);
  });
}

export default app;