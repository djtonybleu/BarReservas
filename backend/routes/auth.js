const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('../../database/connection_config');
const { InputValidator } = require('../../security/validation');
const { authLimiter } = require('../../security/rate-limiter');
const SecurityCrypto = require('../../security/crypto');

const router = express.Router();

// Admin login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!InputValidator.validateEmail(email) || !password) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check admin user
    const result = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1 AND role = $2',
      [email, 'admin']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await SecurityCrypto.verifyPassword(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Create admin user (one-time setup)
router.post('/setup-admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE role = $1',
      ['admin']
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    if (!InputValidator.validateEmail(email) || password.length < 8) {
      return res.status(400).json({ error: 'Invalid email or password too short' });
    }

    const passwordHash = await SecurityCrypto.hashPassword(password);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
      [email, passwordHash, 'admin', 'Administrator']
    );

    res.status(201).json({
      message: 'Admin user created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;