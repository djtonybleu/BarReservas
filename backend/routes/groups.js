const express = require('express');
const { pool } = require('../../database/connection_config');
const SecureQRService = require('../../security/secure-qr');
const { qrScanLimiter } = require('../../security/rate-limiter');
const metricsCollector = require('../../monitoring/metrics-collector');

const router = express.Router();

// Get group by ID (for QR scan)
router.get('/:id', qrScanLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    // Verify QR token if provided
    if (token) {
      const verification = SecureQRService.verifyQRCode(token, '', id);
      if (!verification.valid) {
        metricsCollector.trackQRScan(id, false);
        return res.status(401).json({ error: verification.error });
      }
    }

    const result = await pool.query(`
      SELECT 
        g.id, g.name, g.organizer_contact,
        r.date, r.time, r.people_count, r.status,
        t.type as tipo_mesa,
        r.qr_code_url,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'genero', m.gender,
              'instagram', m.instagram,
              'estado', CASE WHEN m.checked_in_at IS NOT NULL THEN 'ingresado' ELSE 'registrado' END,
              'checked_in_at', m.checked_in_at
            )
          ) FILTER (WHERE m.id IS NOT NULL), 
          '[]'
        ) as miembros
      FROM groups g
      JOIN reservations r ON g.reservation_id = r.id
      LEFT JOIN tables t ON r.table_id = t.id
      LEFT JOIN members m ON g.id = m.group_id
      WHERE g.id = $1
      GROUP BY g.id, g.name, g.organizer_contact, r.date, r.time, r.people_count, r.status, t.type, r.qr_code_url
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = result.rows[0];
    
    // Log QR access
    SecureQRService.logQRAccess(id, token || 'direct', req, true);
    metricsCollector.trackQRScan(id, true);

    res.json({
      id: group.id,
      nombre: group.name,
      contacto: group.organizer_contact,
      fecha: group.date,
      hora: group.time,
      personas: group.people_count,
      tipoMesa: group.tipo_mesa,
      estado: group.status,
      miembros: group.miembros,
      qr: group.qr_code_url
    });
  } catch (error) {
    console.error('Get group error:', error);
    metricsCollector.trackQRScan(req.params.id, false);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Add member to group
router.post('/:id/miembro', async (req, res) => {
  try {
    const { id } = req.params;
    const { genero, instagram } = req.body;

    // Validate input
    if (!genero || !['masculino', 'femenino', 'otro', 'prefiero-no-decir'].includes(genero)) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }

    // Check if group exists and has capacity
    const groupCheck = await pool.query(`
      SELECT r.people_count, COUNT(m.id) as current_members
      FROM groups g
      JOIN reservations r ON g.reservation_id = r.id
      LEFT JOIN members m ON g.id = m.group_id
      WHERE g.id = $1 AND r.status IN ('confirmed', 'checked_in')
      GROUP BY r.people_count
    `, [id]);

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found or reservation not active' });
    }

    const { people_count, current_members } = groupCheck.rows[0];
    
    if (current_members >= people_count) {
      return res.status(400).json({ error: 'Group is at full capacity' });
    }

    // Add member
    const result = await pool.query(`
      INSERT INTO members (group_id, gender, instagram)
      VALUES ($1, $2, $3)
      RETURNING id, gender, instagram, created_at
    `, [id, genero, instagram || null]);

    const member = result.rows[0];

    // Track user action
    metricsCollector.trackUserAction(member.id, 'member_registered', {
      groupId: id,
      gender: genero,
      hasInstagram: !!instagram
    });

    res.status(201).json({
      id: member.id,
      genero: member.gender,
      instagram: member.instagram,
      estado: 'registrado',
      createdAt: member.created_at
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Update member status (check-in/out)
router.patch('/:groupId/miembro/:memberId', async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { status } = req.body;

    if (!['registrado', 'ingresado'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateField = status === 'ingresado' ? 'NOW()' : 'NULL';
    
    const result = await pool.query(`
      UPDATE members 
      SET checked_in_at = ${updateField}
      WHERE id = $1 AND group_id = $2
      RETURNING id, gender, instagram, checked_in_at
    `, [memberId, groupId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = result.rows[0];

    // Track check-in action
    metricsCollector.trackUserAction(memberId, status === 'ingresado' ? 'checked_in' : 'checked_out', {
      groupId,
      timestamp: Date.now()
    });

    res.json({
      id: member.id,
      genero: member.gender,
      instagram: member.instagram,
      estado: status,
      checkedInAt: member.checked_in_at
    });
  } catch (error) {
    console.error('Update member status error:', error);
    res.status(500).json({ error: 'Failed to update member status' });
  }
});

module.exports = router;