// server.js
const express = require('express');
const app = express();

app.get('/health', (req, res) => res.send('Still working... on *my* machine 🧃'));

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}