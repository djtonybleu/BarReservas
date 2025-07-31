const express = require('express');
const { pool } = require('../../database/connection_config');

const router = express.Router();

// Get all tables with status
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.number,
        t.capacity,
        t.type,
        t.status,
        g.id as group_id,
        g.name as group_name,
        r.time as reservation_time,
        r.people_count
      FROM tables t
      LEFT JOIN groups g ON t.current_group_id = g.id
      LEFT JOIN reservations r ON g.reservation_id = r.id
      ORDER BY t.number ASC
    `);

    const tables = result.rows.map(row => ({
      id: row.id,
      numero: row.number,
      capacidad: row.capacity,
      tipo: row.type,
      estado: row.status,
      grupoId: row.group_id,
      grupoNombre: row.group_name,
      horaReserva: row.reservation_time,
      personasReservadas: row.people_count
    }));

    res.json(tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Get available tables
router.get('/available', async (req, res) => {
  try {
    const { type, capacity } = req.query;
    
    let query = 'SELECT id, number, capacity, type FROM tables WHERE status = $1';
    let params = ['free'];
    
    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }
    
    if (capacity) {
      query += ` AND capacity >= $${params.length + 1}`;
      params.push(parseInt(capacity));
    }
    
    query += ' ORDER BY capacity ASC, number ASC';

    const result = await pool.query(query, params);

    const tables = result.rows.map(row => ({
      id: row.id,
      numero: row.number,
      capacidad: row.capacity,
      tipo: row.type
    }));

    res.json(tables);
  } catch (error) {
    console.error('Get available tables error:', error);
    res.status(500).json({ error: 'Failed to fetch available tables' });
  }
});

// Get table statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'free') as free,
        COUNT(*) FILTER (WHERE status = 'occupied') as occupied,
        COUNT(*) FILTER (WHERE status = 'reserved') as reserved,
        ROUND(
          COUNT(*) FILTER (WHERE status != 'free') * 100.0 / COUNT(*), 
          2
        ) as utilization_percent
      FROM tables
      GROUP BY type
      ORDER BY type
    `);

    const stats = result.rows.map(row => ({
      tipo: row.type,
      total: parseInt(row.total),
      libre: parseInt(row.free),
      ocupada: parseInt(row.occupied),
      reservada: parseInt(row.reserved),
      utilizacion: parseFloat(row.utilization_percent)
    }));

    // Overall stats
    const overallResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'free') as free,
        COUNT(*) FILTER (WHERE status = 'occupied') as occupied,
        COUNT(*) FILTER (WHERE status = 'reserved') as reserved
      FROM tables
    `);

    const overall = overallResult.rows[0];

    res.json({
      overall: {
        total: parseInt(overall.total),
        libre: parseInt(overall.free),
        ocupada: parseInt(overall.occupied),
        reservada: parseInt(overall.reserved),
        utilizacion: parseFloat(((parseInt(overall.total) - parseInt(overall.free)) / parseInt(overall.total) * 100).toFixed(2))
      },
      byType: stats
    });
  } catch (error) {
    console.error('Get table stats error:', error);
    res.status(500).json({ error: 'Failed to fetch table statistics' });
  }
});

// Update table status (admin only)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['free', 'occupied', 'reserved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE tables SET status = $1, current_group_id = CASE WHEN $1 = $2 THEN NULL ELSE current_group_id END WHERE id = $3 RETURNING *',
      [status, 'free', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const table = result.rows[0];

    res.json({
      id: table.id,
      numero: table.number,
      capacidad: table.capacity,
      tipo: table.type,
      estado: table.status
    });
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({ error: 'Failed to update table status' });
  }
});

module.exports = router;