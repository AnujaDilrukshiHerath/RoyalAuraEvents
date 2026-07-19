const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve all static files from the project root directory
app.use(express.static(path.join(__dirname, '.')));

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Royal Aura Events web server is running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
});
