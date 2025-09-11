const express = require('express');
const app = express();
const port = process.env.PORT || 3002;

app.get('/', (req, res) => {
  res.json({ message: 'DojoPool API Test Server Running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
