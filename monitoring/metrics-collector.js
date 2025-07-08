const EventEmitter = require('events');
const Redis = require('redis');

class MetricsCollector extends EventEmitter {
  constructor() {
    super();
    this.redis = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  // Real-time reservation metrics
  trackReservation(data) {
    const key = `reservations:${new Date().toISOString().split('T')[0]}`;
    this.redis.hincrby(key, 'total', 1);
    this.redis.hincrby(key, `type_${data.tipoMesa}`, 1);
    this.redis.hincrby(key, `people_${data.personas}`, 1);
    this.redis.expire(key, 86400 * 7); // 7 days

    this.emit('reservation_created', {
      timestamp: Date.now(),
      type: data.tipoMesa,
      people: data.personas,
      hour: new Date().getHours()
    });
  }

  // QR scan tracking
  trackQRScan(groupId, success = true) {
    const key = `qr_scans:${new Date().toISOString().split('T')[0]}`;
    this.redis.hincrby(key, 'total', 1);
    this.redis.hincrby(key, success ? 'successful' : 'failed', 1);
    this.redis.expire(key, 86400 * 7);

    this.emit('qr_scanned', {
      timestamp: Date.now(),
      groupId,
      success
    });
  }

  // Performance metrics
  trackAPICall(endpoint, duration, statusCode) {
    const key = `api_calls:${endpoint}:${new Date().toISOString().split('T')[0]}`;
    this.redis.hincrby(key, 'count', 1);
    this.redis.hincrby(key, `status_${statusCode}`, 1);
    this.redis.lpush(`${key}:durations`, duration);
    this.redis.ltrim(`${key}:durations`, 0, 999); // Keep last 1000
    this.redis.expire(key, 86400 * 7);

    if (duration > 1000) {
      this.emit('slow_query', {
        endpoint,
        duration,
        timestamp: Date.now()
      });
    }
  }

  // User behavior analytics
  trackUserAction(userId, action, metadata = {}) {
    const key = `user_actions:${userId}:${new Date().toISOString().split('T')[0]}`;
    const actionData = {
      action,
      timestamp: Date.now(),
      ...metadata
    };
    
    this.redis.lpush(key, JSON.stringify(actionData));
    this.redis.expire(key, 86400 * 30); // 30 days

    this.emit('user_action', { userId, ...actionData });
  }

  // System health metrics
  trackSystemHealth() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const healthData = {
      timestamp: Date.now(),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: Math.round((Date.now() - this.startTime) / 1000)
    };

    this.redis.lpush('system_health', JSON.stringify(healthData));
    this.redis.ltrim('system_health', 0, 1439); // 24 hours of minutes
    
    // Alert on high resource usage
    if (healthData.memory.percentage > 85) {
      this.emit('high_memory_usage', healthData);
    }

    return healthData;
  }

  // Get real-time metrics
  async getRealTimeMetrics() {
    const today = new Date().toISOString().split('T')[0];
    
    const [reservations, qrScans, systemHealth] = await Promise.all([
      this.redis.hgetall(`reservations:${today}`),
      this.redis.hgetall(`qr_scans:${today}`),
      this.redis.lrange('system_health', 0, 0)
    ]);

    return {
      reservations: {
        total: parseInt(reservations.total || 0),
        byType: {
          estandar: parseInt(reservations.type_estandar || 0),
          vip: parseInt(reservations.type_vip || 0),
          terraza: parseInt(reservations.type_terraza || 0)
        }
      },
      qrScans: {
        total: parseInt(qrScans.total || 0),
        successful: parseInt(qrScans.successful || 0),
        failed: parseInt(qrScans.failed || 0)
      },
      system: systemHealth[0] ? JSON.parse(systemHealth[0]) : null,
      timestamp: Date.now()
    };
  }

  // Get performance analytics
  async getPerformanceMetrics(endpoint, days = 7) {
    const metrics = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = `api_calls:${endpoint}:${date.toISOString().split('T')[0]}`;
      
      const [count, durations] = await Promise.all([
        this.redis.hget(key, 'count'),
        this.redis.lrange(`${key}:durations`, 0, -1)
      ]);

      if (count) {
        const durationNumbers = durations.map(d => parseInt(d));
        metrics.push({
          date: date.toISOString().split('T')[0],
          count: parseInt(count),
          avgDuration: durationNumbers.reduce((a, b) => a + b, 0) / durationNumbers.length,
          maxDuration: Math.max(...durationNumbers),
          minDuration: Math.min(...durationNumbers)
        });
      }
    }

    return metrics.reverse();
  }
}

module.exports = new MetricsCollector();