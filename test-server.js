const express = require('express');
const app = express();
const port = 3005;

app.get('/', (req, res) => {
  res.send('Test server running');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running at http://localhost:${port}`);
}); 