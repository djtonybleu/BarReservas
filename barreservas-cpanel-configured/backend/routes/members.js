const express = require('express');
const { pool } = require('../../database/connection_config');
const { InputValidator } = require('../../security/validation');

const router = express.Router();

// Get member by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        m.id, m.gender, m.instagram, m.checked_in_at, m.created_at,
        g.id as group_id, g.name as group_name,
        r.date, r.time
      FROM members m
      JOIN groups g ON m.group_id = g.id
      JOIN reservations r ON g.reservation_id = r.id
      WHERE m.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = result.rows[0];

    res.json({
      id: member.id,
      genero: member.gender,
      instagram: member.instagram,
      estado: member.checked_in_at ? 'ingresado' : 'registrado',
      checkedInAt: member.checked_in_at,
      createdAt: member.created_at,
      grupo: {
        id: member.group_id,
        nombre: member.group_name,
        fecha: member.date,
        hora: member.time
      }
    });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// Get members by group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const result = await pool.query(`
      SELECT 
        id, gender, instagram, checked_in_at, created_at
      FROM members
      WHERE group_id = $1
      ORDER BY created_at ASC
    `, [groupId]);

    const members = result.rows.map(member => ({
      id: member.id,
      genero: member.gender,
      instagram: member.instagram,
      estado: member.checked_in_at ? 'ingresado' : 'registrado',
      checkedInAt: member.checked_in_at,
      createdAt: member.created_at
    }));

    res.json(members);
  } catch (error) {
    console.error('Get members by group error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Update member info
router.patch('/:id', InputValidator.validateMember, async (req, res) => {
  try {
    const { id } = req.params;
    const { genero, instagram } = req.validatedData;

    const result = await pool.query(`
      UPDATE members 
      SET gender = $1, instagram = $2
      WHERE id = $3
      RETURNING id, gender, instagram, checked_in_at, created_at
    `, [genero, instagram, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = result.rows[0];

    res.json({
      id: member.id,
      genero: member.gender,
      instagram: member.instagram,
      estado: member.checked_in_at ? 'ingresado' : 'registrado',
      checkedInAt: member.checked_in_at,
      createdAt: member.created_at
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM members WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ message: 'Member deleted successfully', id });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// Get member statistics
router.get('/stats/analytics', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const result = await pool.query(`
      SELECT 
        DATE(m.created_at) as date,
        COUNT(*) as total_members,
        COUNT(*) FILTER (WHERE m.gender = 'masculino') as male,
        COUNT(*) FILTER (WHERE m.gender = 'femenino') as female,
        COUNT(*) FILTER (WHERE m.gender = 'otro') as other,
        COUNT(*) FILTER (WHERE m.instagram IS NOT NULL) as with_instagram,
        COUNT(*) FILTER (WHERE m.checked_in_at IS NOT NULL) as checked_in
      FROM members m
      WHERE m.created_at >= $1
      GROUP BY DATE(m.created_at)
      ORDER BY date DESC
    `, [startDate]);

    const stats = result.rows.map(row => ({
      fecha: row.date,
      totalMiembros: parseInt(row.total_members),
      masculino: parseInt(row.male),
      femenino: parseInt(row.female),
      otro: parseInt(row.other),
      conInstagram: parseInt(row.with_instagram),
      ingresados: parseInt(row.checked_in)
    }));

    res.json(stats);
  } catch (error) {
    console.error('Get member stats error:', error);
    res.status(500).json({ error: 'Failed to fetch member statistics' });
  }
});

module.exports = router;