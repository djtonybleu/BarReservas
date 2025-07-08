-- OPTIMIZED SCHEMA FOR HIGH CONCURRENCY (1000+ reservations)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Users table with optimizations
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  instagram TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('organizer', 'member', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  reservation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables table with status enum
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('standard', 'vip', 'terrace')),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'reserved')),
  current_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations table with partitioning support
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

-- Consumption table
CREATE TABLE IF NOT EXISTS consumption (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics table with date partitioning
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  total_visits INTEGER DEFAULT 0,
  total_consumption NUMERIC(12,2) DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  recurring_users INTEGER DEFAULT 0,
  instagram_connected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL INDEXES FOR HIGH PERFORMANCE

-- Users indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Groups indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_organizer_id ON groups(organizer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_reservation_id ON groups(reservation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_created_at ON groups(created_at);

-- Tables indexes (critical for availability queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_type_status ON tables(type, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_capacity_status ON tables(capacity, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_current_group_id ON tables(current_group_id);

-- Reservations indexes (most critical for concurrency)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_date_time ON reservations(date, time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_group_id ON reservations(group_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_table_id ON reservations(table_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_qr_code ON reservations(qr_code_url);

-- Consumption indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumption_user_id ON consumption(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumption_group_id ON consumption(group_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumption_reservation_id ON consumption(reservation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumption_created_at ON consumption(created_at);

-- Metrics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_date ON metrics(date);

-- COMPOSITE INDEXES for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_date_status ON reservations(date, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_type_capacity_status ON tables(type, capacity, status);

-- TRIGGERS for updated_at
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