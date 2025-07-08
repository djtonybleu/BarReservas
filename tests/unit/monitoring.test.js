const metricsCollector = require('../../monitoring/metrics-collector');
const { createPerformanceMarker } = require('../../monitoring/performance-middleware');

describe('Monitoring Module', () => {
  beforeEach(() => {
    // Clear metrics before each test
    metricsCollector.metrics.clear();
  });

  describe('MetricsCollector', () => {
    test('should track reservation metrics', (done) => {
      const reservationData = {
        tipoMesa: 'vip',
        personas: 4
      };

      metricsCollector.on('reservation_created', (data) => {
        expect(data.type).toBe('vip');
        expect(data.people).toBe(4);
        expect(data.timestamp).toBeDefined();
        done();
      });

      metricsCollector.trackReservation(reservationData);
    });

    test('should track QR scan metrics', (done) => {
      const groupId = 'test-group-123';

      metricsCollector.on('qr_scanned', (data) => {
        expect(data.groupId).toBe(groupId);
        expect(data.success).toBe(true);
        expect(data.timestamp).toBeDefined();
        done();
      });

      metricsCollector.trackQRScan(groupId, true);
    });

    test('should track API call performance', (done) => {
      const endpoint = '/api/reservations';
      const duration = 150;
      const statusCode = 200;

      metricsCollector.trackAPICall(endpoint, duration, statusCode);

      // Should not emit slow_query event for fast queries
      setTimeout(() => {
        done();
      }, 100);
    });

    test('should emit slow query alert', (done) => {
      const endpoint = '/api/slow-endpoint';
      const duration = 1500; // > 1000ms threshold

      metricsCollector.on('slow_query', (data) => {
        expect(data.endpoint).toBe(endpoint);
        expect(data.duration).toBe(duration);
        expect(data.timestamp).toBeDefined();
        done();
      });

      metricsCollector.trackAPICall(endpoint, duration, 200);
    });

    test('should track system health', () => {
      const healthData = metricsCollector.trackSystemHealth();
      
      expect(healthData.timestamp).toBeDefined();
      expect(healthData.memory).toBeDefined();
      expect(healthData.memory.used).toBeGreaterThan(0);
      expect(healthData.memory.total).toBeGreaterThan(0);
      expect(healthData.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(healthData.uptime).toBeGreaterThanOrEqual(0);
    });

    test('should track user actions', (done) => {
      const userId = 'user-123';
      const action = 'member_registered';
      const metadata = { groupId: 'group-456' };

      metricsCollector.on('user_action', (data) => {
        expect(data.userId).toBe(userId);
        expect(data.action).toBe(action);
        expect(data.groupId).toBe(metadata.groupId);
        expect(data.timestamp).toBeDefined();
        done();
      });

      metricsCollector.trackUserAction(userId, action, metadata);
    });
  });

  describe('Performance Monitoring', () => {
    test('should create performance marker', () => {
      const marker = createPerformanceMarker('test-operation');
      
      expect(marker).toBeDefined();
      expect(typeof marker.end).toBe('function');
      
      // Simulate some work
      setTimeout(() => {
        const duration = marker.end();
        expect(duration).toBeGreaterThan(0);
      }, 10);
    });
  });
});