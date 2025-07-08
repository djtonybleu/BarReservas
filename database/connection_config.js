// CONNECTION POOLING CONFIGURATION FOR HIGH CONCURRENCY

const { Pool } = require('pg');

// Production configuration for 1000+ concurrent reservations
const productionConfig = {
  // Connection settings
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Pool settings for high concurrency
  max: 50,                    // Maximum connections in pool
  min: 10,                    // Minimum connections to maintain
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout for new connections
  
  // Performance optimizations
  statement_timeout: 10000,   // 10s query timeout
  query_timeout: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // SSL for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

// Development configuration
const developmentConfig = {
  ...productionConfig,
  max: 10,
  min: 2,
  ssl: false
};

const config = process.env.NODE_ENV === 'production' 
  ? productionConfig 
  : developmentConfig;

const pool = new Pool(config);

// Connection monitoring
pool.on('connect', (client) => {
  console.log('New client connected');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('Pool has ended');
    process.exit(0);
  });
});

module.exports = {
  pool,
  
  // Helper function for transactions
  async withTransaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  // Helper for read queries with connection reuse
  async query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn('Slow query detected:', { text, duration });
    }
    
    return res;
  }
};