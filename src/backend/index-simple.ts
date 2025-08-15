import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

// --- Essential Middleware ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic Helmet configuration
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Basic logging
app.use(morgan('combined'));

// --- API Routes ---
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('DojoPool Platform Backend API');
});

// Health check
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test route
app.get('/api/test', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Backend is working!' });
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
app.use('/api/*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Initialize Socket.IO
io.on('connection', (socket) => {
  console.log(`Socket.IO client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket.IO client disconnected: ${socket.id}`);
  });
});

// Start server
if (require.main === module) {
  server.listen(port, () => {
    console.log(`🚀 DojoPool Backend Server running on port ${port}`);
    console.log(`📊 Health check available at http://localhost:${port}/api/health`);
    console.log(`🧪 Test endpoint available at http://localhost:${port}/api/test`);
  });
}

export default app;


