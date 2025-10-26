const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const coinRoutes = require('./routes/coins');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // React dev servers
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/coins', coinRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CryptoPulse API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CryptoPulse API',
    version: '1.0.0',
    endpoints: {
      coins: '/api/coins',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database connection with fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cryptopulse';
let isMongoConnected = false;

// Set mongoose options to prevent long timeouts
mongoose.set('bufferCommands', false);

// Start server immediately, try MongoDB in background
startServer();

// Try to connect to MongoDB in background (non-blocking)
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 3000,
  socketTimeoutMS: 3000,
  maxPoolSize: 1
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  isMongoConnected = true;
})
.catch((error) => {
  console.warn('⚠️  MongoDB connection failed, running without database:', error.message);
  console.log('📝 Note: Some features may be limited. Coins will only be fetched from API.');
  isMongoConnected = false;
});

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💡 To set up MongoDB: https://www.mongodb.com/atlas`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please change the PORT in .env file or stop the other process.`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', err);
    }
  });
}

// Export MongoDB connection status for routes
app.locals.isMongoConnected = () => isMongoConnected;

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
});