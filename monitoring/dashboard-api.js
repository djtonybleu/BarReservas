const express = require('express');
const metricsCollector = require('./metrics-collector');
const alertingSystem = require('./alerting');
const { pool } = require('../database/connection_config');

const router = express.Router();

// Real-time metrics endpoint
router.get('/metrics/realtime', async (req, res) => {
  try {
    const metrics = await metricsCollector.getRealTimeMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Performance metrics
router.get('/metrics/performance/:endpoint?', async (req, res) => {
  try {
    const endpoint = req.params.endpoint || '/api/reservations';
    const days = parseInt(req.query.days) || 7;
    
    const metrics = await metricsCollector.getPerformanceMetrics(endpoint, days);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database metrics
router.get('/metrics/database', async (req, res) => {
  try {
    const dbMetrics = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC
    `);

    const connectionStats = await pool.query(`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active,
        COUNT(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity
    `);

    res.json({
      tables: dbMetrics.rows,
      connections: connectionStats.rows[0],
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User analytics
router.get('/analytics/users', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const userStats = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        COUNT(*) FILTER (WHERE gender = 'male') as male_users,
        COUNT(*) FILTER (WHERE gender = 'female') as female_users,
        COUNT(*) FILTER (WHERE instagram IS NOT NULL) as instagram_connected
      FROM users 
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate, endDate]);

    const reservationStats = await pool.query(`
      SELECT 
        DATE(r.created_at) as date,
        COUNT(*) as total_reservations,
        AVG(r.people_count) as avg_group_size,
        COUNT(*) FILTER (WHERE r.status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE r.status = 'cancelled') as cancelled
      FROM reservations r
      WHERE r.created_at >= $1 AND r.created_at <= $2
      GROUP BY DATE(r.created_at)
      ORDER BY date
    `, [startDate, endDate]);

    res.json({
      users: userStats.rows,
      reservations: reservationStats.rows,
      period: { start: startDate, end: endDate }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Business metrics
router.get('/analytics/business', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const todayStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT r.id) as total_reservations,
        SUM(r.people_count) as total_people,
        COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'checked_in') as checked_in_groups,
        AVG(r.people_count) as avg_group_size
      FROM reservations r
      WHERE DATE(r.created_at) = $1
    `, [today]);

    const tableUtilization = await pool.query(`
      SELECT 
        type,
        COUNT(*) as total_tables,
        COUNT(*) FILTER (WHERE status = 'occupied') as occupied,
        COUNT(*) FILTER (WHERE status = 'reserved') as reserved,
        ROUND(COUNT(*) FILTER (WHERE status != 'free') * 100.0 / COUNT(*), 2) as utilization_percent
      FROM tables
      GROUP BY type
    `);

    const peakHours = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM time) as hour,
        COUNT(*) as reservation_count
      FROM reservations 
      WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY EXTRACT(HOUR FROM time)
      ORDER BY hour
    `);

    res.json({
      today: todayStats.rows[0],
      tables: tableUtilization.rows,
      peakHours: peakHours.rows,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System health status
router.get('/health', async (req, res) => {
  try {
    const status = await alertingSystem.getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket for real-time updates
const setupWebSocket = (server) => {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Dashboard client connected');

    // Send initial metrics
    metricsCollector.getRealTimeMetrics().then(metrics => {
      ws.send(JSON.stringify({ type: 'metrics', data: metrics }));
    });

    // Listen for real-time events
    const onReservation = (data) => {
      ws.send(JSON.stringify({ type: 'reservation', data }));
    };

    const onQRScan = (data) => {
      ws.send(JSON.stringify({ type: 'qr_scan', data }));
    };

    const onAlert = (data) => {
      ws.send(JSON.stringify({ type: 'alert', data }));
    };

    metricsCollector.on('reservation_created', onReservation);
    metricsCollector.on('qr_scanned', onQRScan);
    metricsCollector.on('high_memory_usage', onAlert);
    metricsCollector.on('slow_query', onAlert);

    ws.on('close', () => {
      metricsCollector.off('reservation_created', onReservation);
      metricsCollector.off('qr_scanned', onQRScan);
      metricsCollector.off('high_memory_usage', onAlert);
      metricsCollector.off('slow_query', onAlert);
    });
  });

  return wss;
};

module.exports = { router, setupWebSocket };