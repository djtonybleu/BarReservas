# 🗃️ Database Setup - Step by Step

## 📋 **Exact Steps**

### 1. Get DATABASE_URL
- Go to Railway dashboard
- Click on **PostgreSQL service**
- Go to **"Connect"** tab
- Copy **"Postgres Connection URL"**

### 2. Run Schema Scripts
Open terminal and run:

```bash
# Replace with your actual DATABASE_URL from Railway
export DATABASE_URL="postgresql://postgres:password@host:port/database"

# Create tables and initial data
psql $DATABASE_URL -c "
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organizer_contact TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('estandar', 'vip', 'terraza')),
  capacity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample tables
INSERT INTO tables (number, type, capacity) VALUES
(1, 'estandar', 4), (2, 'estandar', 4), (3, 'estandar', 6),
(4, 'vip', 4), (5, 'vip', 6), (6, 'terraza', 8)
ON CONFLICT (number) DO NOTHING;
"
```

### 3. Create Admin User
```bash
# Replace with your backend URL
curl -X POST https://your-railway-app.railway.app/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@barreservas.com","password":"admin123"}'
```

## ✅ **Expected Result**
- ✅ Database tables created
- ✅ Sample data inserted
- ✅ Admin user created
- ✅ System ready for use

---
**Next**: Test the complete system