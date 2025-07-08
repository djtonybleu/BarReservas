const metricsCollector = require('./metrics-collector');
const { performance } = require('perf_hooks');

// Request performance tracking middleware
const performanceMiddleware = (req, res, next) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Track request start
  req.startTime = startTime;
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    const memoryDelta = process.memoryUsage().heapUsed - startMemory;

    // Track API call metrics
    metricsCollector.trackAPICall(
      `${req.method} ${req.route?.path || req.path}`,
      duration,
      res.statusCode
    );

    // Log performance data
    console.log(`[PERF] ${req.requestId} ${req.method} ${req.path} - ${duration}ms - ${res.statusCode} - ${Math.round(memoryDelta/1024)}KB`);

    // Call original end
    originalEnd.apply(this, args);
  };

  next();
};

// Database query performance tracking
const trackDBQuery = (query, params = []) => {
  return async (queryFunction) => {
    const startTime = performance.now();
    
    try {
      const result = await queryFunction();
      const duration = Math.round(performance.now() - startTime);
      
      // Log slow queries
      if (duration > 100) {
        console.warn(`[SLOW_DB] ${duration}ms: ${query.substring(0, 100)}...`);
      }

      metricsCollector.trackAPICall('database_query', duration, 200);
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      metricsCollector.trackAPICall('database_query', duration, 500);
      throw error;
    }
  };
};

// Memory usage monitoring
const memoryMonitor = () => {
  setInterval(() => {
    const usage = process.memoryUsage();
    const healthData = metricsCollector.trackSystemHealth();
    
    // Force garbage collection if memory usage is high
    if (healthData.memory.percentage > 80 && global.gc) {
      console.log('[GC] Forcing garbage collection due to high memory usage');
      global.gc();
    }
  }, 60000); // Every minute
};

// Error tracking middleware
const errorTrackingMiddleware = (err, req, res, next) => {
  const errorData = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: Date.now(),
    requestId: req.requestId
  };

  // Track error metrics
  metricsCollector.trackAPICall(
    `${req.method} ${req.path}`,
    Date.now() - req.startTime,
    500
  );

  // Log error
  console.error(`[ERROR] ${req.requestId}:`, errorData);

  // Send error to monitoring
  metricsCollector.emit('application_error', errorData);

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

// Custom performance markers
const createPerformanceMarker = (name) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const duration = Math.round(performance.now() - startTime);
      console.log(`[MARKER] ${name}: ${duration}ms`);
      return duration;
    }
  };
};

module.exports = {
  performanceMiddleware,
  trackDBQuery,
  memoryMonitor,
  errorTrackingMiddleware,
  createPerformanceMarker
};