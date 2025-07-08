const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool } = require('../database/connection_config');
const { securityMiddleware } = require('../security/middleware');
const { performanceMiddleware, errorTrackingMiddleware } = require('../monitoring/performance-middleware');
const metricsCollector = require('../monitoring/metrics-collector');

// Routes
const authRoutes = require('./routes/auth');
const reservationRoutes = require('./routes/reservations');
const groupRoutes = require('./routes/groups');
const tableRoutes = require('./routes/tables');
const memberRoutes = require('./routes/members');
const paymentRoutes = require('./routes/payments');
const { router: monitoringRoutes, setupWebSocket } = require('../monitoring/dashboard-api');
const { tenantMiddleware } = require('./middleware/tenant');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
securityMiddleware(app);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(performanceMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const healthData = metricsCollector.trackSystemHealth();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      ...healthData
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Multi-tenant middleware (optional)
// app.use('/api', tenantMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Error handling
app.use(errorTrackingMiddleware);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 BarReservas API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Setup WebSocket for monitoring
setupWebSocket(server);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

module.exports = app;