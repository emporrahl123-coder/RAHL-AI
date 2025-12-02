const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000; // Use Render's PORT or 10000

// Serve static files
app.use(express.static(__dirname));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'RAHL AI is running' });
});

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RAHL AI Server started on port ${PORT}`);
  console.log(`📱 Open: http://localhost:${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});
