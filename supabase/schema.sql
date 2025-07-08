-- Users
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text,
  gender text not null,
  instagram text,
  email text unique,
  avatar_url text,
  role text not null default 'member',
  created_at timestamptz default now()
);

-- Groups
create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  organizer_id uuid references users(id),
  name text not null,
  reservation_id uuid references reservations(id),
  created_at timestamptz default now()
);

-- Tables
create table if not exists tables (
  id uuid primary key default uuid_generate_v4(),
  number int not null unique,
  type text not null,
  capacity int not null,
  status text not null default 'free',
  current_group_id uuid references groups(id)
);

-- Reservations
create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id),
  table_id uuid references tables(id),
  date date not null,
  time time not null,
  people_count int not null,
  status text not null default 'pending',
  qr_code_url text,
  created_at timestamptz default now()
);

-- Consumption
create table if not exists consumption (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  group_id uuid references groups(id),
  reservation_id uuid references reservations(id),
  item text not null,
  amount int not null,
  price numeric not null,
  created_at timestamptz default now()
);

-- Metrics
create table if not exists metrics (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  total_visits int,
  total_consumption numeric,
  unique_users int,
  recurring_users int,
  instagram_connected int
); 