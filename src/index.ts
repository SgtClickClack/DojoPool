import express from 'express';
import { logger } from './utils/logger';

const app = express();
const port = 3000;

app.use(express.json());

// Basic routes for testing
app.get('/', (req, res) => {
  res.send('DojoPool Platform');
});

app.get('/api/auth', (req, res) => {
  res.json({ message: 'Auth endpoint' });
});

app.get('/api/users', (req, res) => {
  res.json({ message: 'Users endpoint' });
});

app.get('/api/games', (req, res) => {
  res.json({ message: 'Games endpoint' });
});

app.get('/api/tournaments', (req, res) => {
  res.json({ message: 'Tournaments endpoint' });
});

app.get('/api/analytics', (req, res) => {
  res.json({ message: 'Analytics endpoint' });
});

app.get('/api/settings', (req, res) => {
  res.json({ message: 'Settings endpoint' });
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');
  next();
});

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
}); 