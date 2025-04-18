const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle login endpoint
  if (req.url === '/api/auth/login' && req.method === 'POST') {
    console.log('Handling login request');
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        console.log('Login request body:', body);
        const { email, password } = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: 1,
            email: email,
            name: 'Test User'
          }
        }));
      } catch (error) {
        console.error('Login error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }

  // Handle register endpoint
  if (req.url === '/api/auth/register' && req.method === 'POST') {
    console.log('Handling register request');
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        console.log('Register request body:', body);
        const { name, email, password } = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: 1,
            email: email,
            name: name
          }
        }));
      } catch (error) {
        console.error('Register error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }

  // Default response for other endpoints
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Minimal server running' }));
});

server.listen(3001, '0.0.0.0', () => {
  console.log('Minimal server running at http://localhost:3001');
}); 