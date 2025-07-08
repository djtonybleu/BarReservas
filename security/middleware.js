const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

// OWASP compliant security middleware
const securityMiddleware = (app) => {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.VITE_REACT_APP_API_URL],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS configuration
  app.use(cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://barreservas.vercel.app',
        process.env.FRONTEND_URL
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // NoSQL injection prevention
  app.use(mongoSanitize());

  // Request size limiting
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // Request logging for security monitoring
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip} - UA: ${userAgent}`);
    
    // Log suspicious patterns
    const suspiciousPatterns = [
      /\b(union|select|insert|delete|drop|create|alter)\b/i,
      /<script|javascript:|vbscript:|onload=|onerror=/i,
      /\.\.\//,
      /\/etc\/passwd|\/proc\/|\/sys\//
    ];

    const requestData = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (suspiciousPatterns.some(pattern => pattern.test(requestData))) {
      console.warn(`[SECURITY] Suspicious request detected from ${ip}: ${req.method} ${req.url}`);
      console.warn(`[SECURITY] Request data: ${requestData}`);
    }

    next();
  });
};

// Session security
const sessionConfig = {
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  name: 'barreservas.sid' // Don't use default session name
};

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const SecurityCrypto = require('./crypto');
    const decoded = SecurityCrypto.verifyQRToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Admin role check
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Brute force protection
const bruteForceProtection = new Map();

const checkBruteForce = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!bruteForceProtection.has(ip)) {
    bruteForceProtection.set(ip, { attempts: 0, lastAttempt: now });
  }

  const record = bruteForceProtection.get(ip);

  // Reset if window expired
  if (now - record.lastAttempt > windowMs) {
    record.attempts = 0;
    record.lastAttempt = now;
  }

  if (record.attempts >= maxAttempts) {
    return res.status(429).json({
      error: 'Too many failed attempts. Try again later.',
      retryAfter: Math.ceil((windowMs - (now - record.lastAttempt)) / 1000)
    });
  }

  // Increment on failed requests (handled in error middleware)
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      record.attempts++;
      record.lastAttempt = now;
    }
  });

  next();
};

module.exports = {
  securityMiddleware,
  sessionConfig,
  authenticateJWT,
  requireAdmin,
  checkBruteForce
};