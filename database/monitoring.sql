-- MONITORING QUERIES FOR PERFORMANCE ANALYSIS

-- 1. Active connections and queries
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  NOW() - query_start AS duration,
  query
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;

-- 2. Slow queries (requires pg_stat_statements)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 3. Index usage analysis
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- 4. Table statistics
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;

-- 5. Lock monitoring
SELECT 
  t.relname,
  l.locktype,
  l.mode,
  l.granted,
  a.usename,
  a.query,
  a.query_start
FROM pg_locks l
JOIN pg_stat_all_tables t ON l.relation = t.relid
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted
ORDER BY a.query_start;

-- 6. Connection pool status
SELECT 
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE state = 'active') as active,
  COUNT(*) FILTER (WHERE state = 'idle') as idle,
  COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity;