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
// import morgan from 'morgan'; // For HTTP request logging

// --- Route Imports (Example of modular routes) ---
// import authRoutes from './routes/auth.routes';
// import userRoutes from './routes/user.routes';
// import gameRoutes from './routes/game.routes';
// import tournamentRoutes from './routes/tournament.routes';
// import analyticsRoutes from './routes/analytics.routes';
// import settingsRoutes from './routes/settings.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3102;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:3101', 'http://127.0.0.1:3101'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

// --- Essential Middleware ---
app.use(express.json());

// Helmet configuration (more comprehensive)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          // For production, avoid 'unsafe-inline' and 'unsafe-eval'.
          // These might be needed for development HMR or specific libraries.
          // Consider conditional inclusion or using nonces/hashes.
          // e.g. process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : undefined,
        ].filter(Boolean) as string[], // Filter out undefined values
        styleSrc: ["'self'", "'unsafe-inline'"], // Try to avoid 'unsafe-inline'
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:3101"], // Allow frontend dev server for Socket.IO
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        // upgradeInsecureRequests: [], // Enable if served over HTTPS
      },
    },
    // referrerPolicy: { policy: "strict-origin-when-cross-origin" }, // Helmet default is good
    // xXssProtection: false, // Deprecated header, CSP is preferred. Helmet sets it to 0 by default.
  })
);

// Rate limiting - apply to API routes or globally
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', apiLimiter);
}

// CORS - Uncomment and configure if your frontend is on a different origin
app.use(cors({
  origin: 'http://localhost:3101',
  credentials: true,
}));

// HTTP Request Logging (Morgan) - Optional
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// } else {
//   // Log to file or a logging service in production
//   app.use(morgan('combined', { stream: { write: (message) => logger.http(message.trim()) } }));
// }


// --- Input validation middleware (Reusable) ---
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    res.status(400).json({ errors: errors.array() });
  };
};


// --- API Routes ---
// Replace these inline routes with modular router setup:
// e.g., app.use('/api/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('DojoPool Platform Backend API');
});

// Example of using validateRequest with an array of validations
app.post(
  '/api/auth/login',
  validateRequest([ // Pass validations as an array
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ]),
  (req: Request, res: Response) => {
    // const { email, password } = req.body; // Access validated and sanitized data
    // Actual login logic (e.g., in a controller)
    res.json({ message: 'Login endpoint processed (mock)' });
  }
);

// /api/v1/users/me route must be above SPA fallback and 404 handler
app.get('/api/v1/users/me', (req, res) => {
  res.json({
    data: {
      user: {
        id: 1,
        username: 'demo_user',
        email: 'demo_user@example.com',
        avatar: '',
        joinDate: new Date().toISOString(),
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        achievements: [],
        recentGames: [],
        rank: 1,
        dojoCoins: 0
      }
    }
  });
});

app.get('/api/v1/venues', (req, res) => res.json([]));
app.get('/api/v1/tournaments', (req, res) => res.json([]));
app.get('/api/v1/wallet', (req, res) => res.json({}));
app.get('/api/v1/profile', (req, res) => res.json({
  username: 'demo_user',
  avatar: '',
  joinDate: new Date().toISOString(),
  totalGames: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  achievements: [],
  recentGames: [],
  rank: 1,
  dojoCoins: 0
}));
app.get('/api/v1/feed', (req, res) => res.json([]));
app.get('/api/v1/games', (req, res) => res.json([]));

// --- Flask API Proxy for Wallet ---
// app.use(
//   ['/api/v1/wallet', '/api/v1/wallet/*', '/api/v1/wallet/stats'],
//   createProxyMiddleware({
//     target: 'http://localhost:3102',
//     changeOrigin: true,
//     onProxyReq: (proxyReq: any, req: any, res: any) => {
//       if (req.headers.cookie) {
//         proxyReq.setHeader('cookie', req.headers.cookie);
//       }
//       if (req.headers.authorization) {
//         proxyReq.setHeader('authorization', req.headers.authorization);
//       }
//     },
//   } as any)
// );

app.get('/api/v1/wallet/stats', (req, res) => {
  res.json({
    balance: 100,
    transactions: [],
    lastUpdated: new Date().toISOString(),
  });
});

// --- Static Files (if serving frontend assets from this server) ---
const publicPath = path.join(__dirname, '..', 'public'); // Adjust if your structure is different
// app.use(express.static(publicPath));

// --- SPA Fallback Route (Handles client-side routing for non-API GET requests) ---
// app.get(/^\/(?!api).*/, (req: Request, res: Response) => {
//   const indexPath = path.join(__dirname, '..', 'index.html'); // Adjust to your SPA's entry point
//   res.sendFile(indexPath, (err) => {
//     if (err) {
//       logger.error('Error sending SPA fallback file:', err);
//       res.status(500).send('Error serving application.');
//     }
//   });
// });

// --- Not Found Handler for API (Optional, if you want specific API 404s) ---
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/v1', (req, res) => res.json({ status: 'ok' }));
app.get('/api/v1/', (req, res) => res.json({ status: 'ok' }));

// --- Global Error Handling Middleware (Must be the last app.use call) ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`[${req.method}] ${req.originalUrl} - Unhandled Error: ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Only show stack in dev
    // You might want to add more context like req.ip, req.headers for debugging
  });

  // Avoid sending detailed error messages or stack traces in production
  if (process.env.NODE_ENV === 'production' && !res.headersSent) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  // For development or if headers already sent
  if (!res.headersSent) {
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message, // Consider if this is safe to send
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  } else {
    next(err); // If headers sent, delegate to Express default error handler
  }
});

// Example Socket.IO event
io.on('connection', (socket: Socket) => {
  console.log('Socket.IO client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Socket.IO client disconnected:', socket.id);
  });
});

// --- Start Server ---
server.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
  logger.info(`Current environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('Socket.IO server started.');
});