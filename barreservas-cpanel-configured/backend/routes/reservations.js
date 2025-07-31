const express = require('express');
const { pool, withTransaction } = require('../../database/connection_config');
const { InputValidator } = require('../../security/validation');
const { reservationLimiter } = require('../../security/rate-limiter');
const SecureQRService = require('../../security/secure-qr');
const metricsCollector = require('../../monitoring/metrics-collector');

const router = express.Router();

// Create reservation
router.post('/', reservationLimiter, InputValidator.validateReservation, async (req, res) => {
  try {
    const reservationData = req.validatedData;

    const result = await withTransaction(async (client) => {
      // Create group first
      const groupResult = await client.query(
        'INSERT INTO groups (name, organizer_contact, organizer_contact_type) VALUES ($1, $2, $3) RETURNING id',
        [reservationData.nombre, reservationData.contacto, req.body.contactoTipo || 'whatsapp']
      );
      
      const groupId = groupResult.rows[0].id;

      // Find available table
      const tableResult = await client.query(`
        SELECT id FROM tables 
        WHERE status = 'free' 
          AND type = $1 
          AND capacity >= $2
        ORDER BY capacity ASC, number ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `, [reservationData.tipoMesa, reservationData.personas]);

      if (tableResult.rows.length === 0) {
        throw new Error('No tables available for the requested type and capacity');
      }

      const tableId = tableResult.rows[0].id;

      // Reserve table
      await client.query(
        'UPDATE tables SET status = $1, current_group_id = $2 WHERE id = $3',
        ['reserved', groupId, tableId]
      );

      // Create reservation
      const reservationResult = await client.query(`
        INSERT INTO reservations (group_id, table_id, date, time, people_count, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `, [groupId, tableId, reservationData.fecha, reservationData.hora, reservationData.personas, 'confirmed']);

      const reservationId = reservationResult.rows[0].id;

      // Update group with reservation_id
      await client.query(
        'UPDATE groups SET reservation_id = $1 WHERE id = $2',
        [reservationId, groupId]
      );

      // Generate secure QR code
      const qrData = await SecureQRService.generateSecureQR(groupId);

      // Update reservation with QR
      await client.query(
        'UPDATE reservations SET qr_code_url = $1 WHERE id = $2',
        [qrData.qrUrl, reservationId]
      );

      return {
        id: reservationId,
        groupId,
        tableId,
        ...reservationData,
        status: 'confirmed',
        qr: qrData.qrCodeDataURL,
        qrUrl: qrData.qrUrl,
        token: qrData.token,
        createdAt: reservationResult.rows[0].created_at
      };
    });

    // Track metrics
    metricsCollector.trackReservation({
      tipoMesa: reservationData.tipoMesa,
      personas: reservationData.personas
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Reservation creation error:', error);
    metricsCollector.emit('reservation_failed', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Get reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        r.id, r.date, r.time, r.people_count, r.status, r.qr_code_url,
        g.id as group_id, g.name as group_name, g.organizer_contact,
        t.number as table_number, t.type as table_type
      FROM reservations r
      JOIN groups g ON r.group_id = g.id
      LEFT JOIN tables t ON r.table_id = t.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// Get reservations by date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const result = await pool.query(`
      SELECT 
        r.id, r.time, r.people_count, r.status,
        g.name as group_name,
        t.number as table_number, t.type as table_type
      FROM reservations r
      JOIN groups g ON r.group_id = g.id
      LEFT JOIN tables t ON r.table_id = t.id
      WHERE r.date = $1
      ORDER BY r.time ASC
    `, [date]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get reservations by date error:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Cancel reservation
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await withTransaction(async (client) => {
      // Get reservation details
      const reservationResult = await client.query(
        'SELECT group_id, table_id FROM reservations WHERE id = $1 AND status != $2',
        [id, 'cancelled']
      );

      if (reservationResult.rows.length === 0) {
        throw new Error('Reservation not found or already cancelled');
      }

      const { group_id, table_id } = reservationResult.rows[0];

      // Cancel reservation
      await client.query(
        'UPDATE reservations SET status = $1 WHERE id = $2',
        ['cancelled', id]
      );

      // Free table
      if (table_id) {
        await client.query(
          'UPDATE tables SET status = $1, current_group_id = NULL WHERE id = $2',
          ['free', table_id]
        );
      }

      return { id, status: 'cancelled' };
    });

    res.json(result);
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;