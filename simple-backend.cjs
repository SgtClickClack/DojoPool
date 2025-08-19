const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Set content type
  res.setHeader('Content-Type', 'application/json');

  if (path === '/') {
    res.writeHead(200);
    res.end(
      JSON.stringify({ message: 'DojoPool Backend API - Simple Version' })
    );
  } else if (path === '/api/health') {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'Backend server is running',
      })
    );
  } else if (path === '/api/test') {
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Test endpoint working!' }));
  } else if (path === '/api/game-status') {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        player: {
          level: 12,
          xp: 1250,
          clan: 'Crimson Monkey Clan',
          achievements: 15,
        },
        territory: {
          owned: 3,
          total: 8,
          currentObjective: 'Defend The Jade Tiger',
        },
        game: {
          status: 'active',
          lastMatch: '2025-01-30T10:30:00Z',
          nextTournament: '2025-02-01T14:00:00Z',
        },
      })
    );
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 DojoPool Simple Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🎮 Game status: http://localhost:${PORT}/api/game-status`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
