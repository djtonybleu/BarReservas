-- OPTIMIZED QUERIES FOR HIGH CONCURRENCY

-- 1. Find available tables (most critical query)
-- BEFORE: Slow table scan
-- AFTER: Uses composite index
SELECT id, number, type, capacity 
FROM tables 
WHERE status = 'free' 
  AND type = $1 
  AND capacity >= $2
ORDER BY capacity ASC, number ASC
LIMIT 5;

-- 2. Create reservation with table assignment (atomic transaction)
BEGIN;
  -- Lock table to prevent race conditions
  SELECT id FROM tables 
  WHERE status = 'free' AND type = $1 AND capacity >= $2
  ORDER BY capacity ASC, number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  -- Update table status
  UPDATE tables 
  SET status = 'reserved', current_group_id = $3, updated_at = NOW()
  WHERE id = $4;
  
  -- Create reservation
  INSERT INTO reservations (group_id, table_id, date, time, people_count, status)
  VALUES ($3, $4, $5, $6, $2, 'confirmed')
  RETURNING id;
COMMIT;

-- 3. Get reservations by date (dashboard query)
SELECT r.id, r.date, r.time, r.people_count, r.status,
       g.name as group_name,
       t.number as table_number, t.type as table_type
FROM reservations r
JOIN groups g ON r.group_id = g.id
LEFT JOIN tables t ON r.table_id = t.id
WHERE r.date = $1
  AND r.status IN ('confirmed', 'checked_in')
ORDER BY r.time ASC;

-- 4. Get group with members (check-in query)
SELECT g.id, g.name, r.date, r.time, r.people_count,
       COALESCE(
         json_agg(
           json_build_object(
             'id', u.id,
             'gender', u.gender,
             'instagram', u.instagram,
             'status', CASE WHEN u.id IS NOT NULL THEN 'registered' ELSE 'pending' END
           )
         ) FILTER (WHERE u.id IS NOT NULL), 
         '[]'
       ) as members
FROM groups g
JOIN reservations r ON g.reservation_id = r.id
LEFT JOIN users u ON u.id = ANY(
  SELECT unnest(string_to_array(g.member_ids, ','))::uuid
)
WHERE g.id = $1
GROUP BY g.id, g.name, r.date, r.time, r.people_count;

-- 5. Real-time metrics query
WITH daily_stats AS (
  SELECT 
    COUNT(DISTINCT r.group_id) as total_groups,
    SUM(r.people_count) as total_people,
    COUNT(DISTINCT CASE WHEN r.status = 'checked_in' THEN r.group_id END) as checked_in_groups
  FROM reservations r
  WHERE r.date = CURRENT_DATE
),
consumption_stats AS (
  SELECT 
    COALESCE(SUM(c.price * c.amount), 0) as total_consumption,
    COUNT(DISTINCT c.user_id) as consuming_users
  FROM consumption c
  WHERE DATE(c.created_at) = CURRENT_DATE
)
SELECT 
  ds.total_groups,
  ds.total_people,
  ds.checked_in_groups,
  cs.total_consumption,
  cs.consuming_users
FROM daily_stats ds, consumption_stats cs;

-- 6. Table availability check (real-time)
SELECT 
  type,
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE status = 'free') as available_tables,
  COUNT(*) FILTER (WHERE status = 'occupied') as occupied_tables,
  COUNT(*) FILTER (WHERE status = 'reserved') as reserved_tables
FROM tables
GROUP BY type
ORDER BY type;

-- 7. User consumption history (for loyalty/marketing)
SELECT 
  u.id, u.name, u.instagram,
  COUNT(DISTINCT r.id) as total_visits,
  SUM(c.price * c.amount) as total_spent,
  MAX(c.created_at) as last_visit
FROM users u
JOIN consumption c ON u.id = c.user_id
JOIN reservations r ON c.reservation_id = r.id
WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.name, u.instagram
HAVING COUNT(DISTINCT r.id) > 1  -- Only returning customers
ORDER BY total_spent DESC
LIMIT 50;

-- 8. Peak hours analysis
SELECT 
  EXTRACT(HOUR FROM r.time) as hour,
  COUNT(*) as reservation_count,
  AVG(r.people_count) as avg_group_size,
  SUM(COALESCE(c.total_consumption, 0)) as total_revenue
FROM reservations r
LEFT JOIN (
  SELECT reservation_id, SUM(price * amount) as total_consumption
  FROM consumption
  GROUP BY reservation_id
) c ON r.id = c.reservation_id
WHERE r.date >= CURRENT_DATE - INTERVAL '7 days'
  AND r.status IN ('confirmed', 'checked_in')
GROUP BY EXTRACT(HOUR FROM r.time)
ORDER BY hour;