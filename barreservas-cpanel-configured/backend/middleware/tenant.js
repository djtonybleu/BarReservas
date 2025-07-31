const { pool } = require('../../database/connection_config');

// Tenant middleware
const tenantMiddleware = async (req, res, next) => {
  try {
    const subdomain = req.headers.host?.split('.')[0];
    const tenantId = req.headers['x-tenant-id'] || subdomain;

    if (!tenantId || tenantId === 'www') {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Get tenant info
    const tenant = await pool.query(
      'SELECT * FROM tenants WHERE subdomain = $1 AND active = true',
      [tenantId]
    );

    if (tenant.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    req.tenant = tenant.rows[0];
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ error: 'Tenant validation failed' });
  }
};

// Tenant-aware query wrapper
const tenantQuery = (req, query, params = []) => {
  const tenantId = req.tenant.id;
  
  // Add tenant_id to WHERE clause
  if (query.toLowerCase().includes('where')) {
    query = query.replace(/where/i, `WHERE tenant_id = '${tenantId}' AND`);
  } else if (query.toLowerCase().includes('from')) {
    query = query.replace(/from (\w+)/i, `FROM $1 WHERE tenant_id = '${tenantId}'`);
  }
  
  return pool.query(query, params);
};

module.exports = { tenantMiddleware, tenantQuery };