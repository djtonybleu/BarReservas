const request = require('supertest');
const app = require('../../backend/server');

describe('Reservations API', () => {
  describe('POST /api/reservations', () => {
    test('should create reservation successfully', async () => {
      const reservationData = {
        nombre: 'Juan Pérez',
        contacto: '+1234567890',
        contactoTipo: 'whatsapp',
        fecha: '2024-12-31',
        hora: '20:00',
        personas: 4,
        tipoMesa: 'estandar',
        observaciones: 'Mesa cerca de la ventana'
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.groupId).toBeDefined();
      expect(response.body.nombre).toBe(reservationData.nombre);
      expect(response.body.status).toBe('confirmed');
      expect(response.body.qr).toContain('data:image/png;base64');
      expect(response.body.token).toBeDefined();
    });

    test('should validate required fields', async () => {
      const incompleteData = {
        nombre: 'Juan Pérez',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    test('should validate future date requirement', async () => {
      const pastDateData = {
        nombre: 'Juan Pérez',
        contacto: '+1234567890',
        fecha: '2020-01-01', // Past date
        hora: '20:00',
        personas: 4,
        tipoMesa: 'estandar'
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(pastDateData)
        .expect(400);

      expect(response.body.error).toContain('2 hours in advance');
    });

    test('should validate person count limits', async () => {
      const invalidPersonCount = {
        nombre: 'Juan Pérez',
        contacto: '+1234567890',
        fecha: '2024-12-31',
        hora: '20:00',
        personas: 15, // Exceeds limit
        tipoMesa: 'estandar'
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(invalidPersonCount)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should handle no available tables', async () => {
      // Reserve all tables first
      await global.testDb.query("UPDATE tables SET status = 'occupied'");

      const reservationData = {
        nombre: 'Juan Pérez',
        contacto: '+1234567890',
        fecha: '2024-12-31',
        hora: '20:00',
        personas: 4,
        tipoMesa: 'estandar'
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(400);

      expect(response.body.error).toContain('No tables available');
    });
  });

  describe('GET /api/reservations/:id', () => {
    let reservationId;

    beforeEach(async () => {
      const reservationData = {
        nombre: 'Juan Pérez',
        contacto: '+1234567890',
        fecha: '2024-12-31',
        hora: '20:00',
        personas: 4,
        tipoMesa: 'estandar'
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservationData);

      reservationId = response.body.id;
    });

    test('should get reservation by ID', async () => {
      const response = await request(app)
        .get(`/api/reservations/${reservationId}`)
        .expect(200);

      expect(response.body.id).toBe(reservationId);
      expect(response.body.group_name).toBe('Juan Pérez');
      expect(response.body.table_number).toBeDefined();
    });

    test('should return 404 for non-existent reservation', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/reservations/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('Reservation not found');
    });
  });

  describe('PATCH /api/reservations/:id/cancel', () => {
    let reservationId;

    beforeEach(async () => {
      const reservationData = {
        nombre: 'Juan Pérez',
        contacto: '+1234567890',
        fecha: '2024-12-31',
        hora: '20:00',
        personas: 4,
        tipoMesa: 'estandar'
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservationData);

      reservationId = response.body.id;
    });

    test('should cancel reservation successfully', async () => {
      const response = await request(app)
        .patch(`/api/reservations/${reservationId}/cancel`)
        .expect(200);

      expect(response.body.id).toBe(reservationId);
      expect(response.body.status).toBe('cancelled');

      // Verify table is freed
      const tablesResponse = await request(app)
        .get('/api/tables')
        .expect(200);

      const freeTables = tablesResponse.body.filter(t => t.estado === 'free');
      expect(freeTables.length).toBeGreaterThan(0);
    });

    test('should handle non-existent reservation', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .patch(`/api/reservations/${fakeId}/cancel`)
        .expect(400);

      expect(response.body.error).toContain('not found');
    });
  });
});