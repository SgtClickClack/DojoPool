const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Minimal server running\n');
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Minimal server running at http://localhost:3000');
}); 