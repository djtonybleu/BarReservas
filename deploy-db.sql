-- Production database setup for Railway PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for admin authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'organizer', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organizer_contact TEXT NOT NULL,
  organizer_contact_type TEXT DEFAULT 'whatsapp' CHECK (organizer_contact_type IN ('whatsapp', 'instagram', 'email')),
  reservation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables table
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('estandar', 'vip', 'terraza')),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'reserved')),
  current_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  people_count INTEGER NOT NULL CHECK (people_count > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'cancelled')),
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  gender TEXT NOT NULL CHECK (gender IN ('masculino', 'femenino', 'otro', 'prefiero-no-decir')),
  instagram TEXT,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to groups
ALTER TABLE groups ADD CONSTRAINT fk_groups_reservation 
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL;

-- Performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_organizer_contact ON groups(organizer_contact);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_type_status ON tables(type, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_date_time ON reservations(date, time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_members_group_id ON members(group_id);

-- Insert production tables
INSERT INTO tables (number, type, capacity) VALUES
(1, 'estandar', 4), (2, 'estandar', 4), (3, 'estandar', 6), (4, 'estandar', 6),
(5, 'estandar', 8), (6, 'estandar', 8), (7, 'vip', 4), (8, 'vip', 6),
(9, 'vip', 8), (10, 'vip', 10), (11, 'terraza', 4), (12, 'terraza', 6),
(13, 'terraza', 8), (14, 'terraza', 10), (15, 'terraza', 12)
ON CONFLICT (number) DO NOTHING;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();