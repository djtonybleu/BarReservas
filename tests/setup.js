const { Pool } = require('pg');

// Test database configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-bytes-long';
process.env.DB_NAME = 'barreservas_test';

// Global test database pool
global.testDb = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 5
});

// Setup and teardown
beforeAll(async () => {
  // Create test database schema
  await global.testDb.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      organizer_contact TEXT NOT NULL,
      organizer_contact_type TEXT DEFAULT 'whatsapp',
      reservation_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS tables (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      number INTEGER NOT NULL UNIQUE,
      type TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'free',
      current_group_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS reservations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL,
      table_id UUID,
      date DATE NOT NULL,
      time TIME NOT NULL,
      people_count INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      qr_code_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL,
      gender TEXT NOT NULL,
      instagram TEXT,
      checked_in_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Insert test tables
  await global.testDb.query(`
    INSERT INTO tables (number, type, capacity) VALUES
    (1, 'estandar', 4), (2, 'vip', 6), (3, 'terraza', 8)
    ON CONFLICT (number) DO NOTHING;
  `);
});

afterAll(async () => {
  await global.testDb.end();
});

// Clean database between tests
afterEach(async () => {
  await global.testDb.query('TRUNCATE users, groups, reservations, members RESTART IDENTITY CASCADE');
  await global.testDb.query("UPDATE tables SET status = 'free', current_group_id = NULL");
});