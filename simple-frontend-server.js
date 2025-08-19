const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;

  // Map common routes to files
  if (req.url === '/real-react-app.html') {
    filePath = '/real-react-app.html';
  } else if (req.url === '/real-react-app-websocket.html') {
    filePath = '/real-react-app-websocket.html';
  } else if (req.url === '/dojopool-real-game.html') {
    filePath = '/dojopool-real-game.html';
  } else if (req.url === '/simple-frontend.html') {
    filePath = '/simple-frontend.html';
  } else if (req.url === '/test-app.html') {
    filePath = '/test-app.html';
  }

  const fullPath = path.join(__dirname, filePath);

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    // Set content type based on file extension
    const ext = path.extname(fullPath);
    let contentType = 'text/html';

    if (ext === '.css') contentType = 'text/css';
    else if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(
    `🚀 DojoPool World Hub Server running on http://localhost:${PORT}`
  );
  console.log(`🗺️ World Hub: http://localhost:${PORT}/index.html`);
  console.log(`🎮 Main App: http://localhost:${PORT}/`);
  console.log(`🔌 WebSocket Backend: ws://localhost:8081`);
});

console.log(`🎱 DojoPool World Hub Server starting...`);
console.log(`🗺️ Territory control system active`);
console.log(`⚔️ Clan wars system operational`);
console.log(`🏛️ Pool Gods mythology active`);
console.log(`🎯 Real pool gaming experience ready`);
console.log(`🌍 "The World is Your Pool Hall" - Map-centric design active`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down frontend server...');
  server.close(() => {
    console.log('✅ Frontend server closed');
    process.exit(0);
  });
});
