import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import tournamentRoutes from './routes/tournament';

// Load environment variables
dotenv.config();

console.log('🔍 Simple Backend index.ts loaded - app initialization starting');

const app = express();
const port = process.env.PORT || 8080;

// --- Essential Middleware ---
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3101'],
  credentials: true,
}));

// --- API Routes ---
app.get('/', (req: Request, res: Response) => {
  res.send('DojoPool Platform Backend API');
});

// Register tournament routes
app.use('/api', tournamentRoutes);

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

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 DojoPool Simple Backend Server running on port ${port}`);
    console.log(`📊 Health check available at http://localhost:${port}/api/health`);
    console.log(`🏆 Tournament API available at http://localhost:${port}/api/tournaments`);
  });
}

export default app; 