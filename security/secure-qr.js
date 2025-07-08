const QRCode = require('qrcode');
const SecurityCrypto = require('./crypto');
const crypto = require('crypto');

class SecureQRService {
  // Generate secure QR code with encrypted payload
  static async generateSecureQR(groupId, options = {}) {
    try {
      // Create secure token with expiration
      const token = SecurityCrypto.generateSecureQRToken(groupId, options.expiresIn || '24h');
      
      // Create secure URL with token
      const baseUrl = process.env.FRONTEND_URL || 'https://barreservas.vercel.app';
      const qrUrl = `${baseUrl}/member/${groupId}?token=${token}`;
      
      // Generate QR code with security options
      const qrOptions = {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: options.size || 256
      };

      const qrCodeDataURL = await QRCode.toDataURL(qrUrl, qrOptions);
      
      // Generate verification hash
      const verificationHash = SecurityCrypto.generateHMAC({
        groupId,
        token,
        timestamp: Date.now()
      });

      return {
        qrCodeDataURL,
        qrUrl,
        token,
        verificationHash,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours
      };
    } catch (error) {
      throw new Error(`QR generation failed: ${error.message}`);
    }
  }

  // Verify QR code authenticity
  static verifyQRCode(token, verificationHash, groupId) {
    try {
      // Verify JWT token
      const decoded = SecurityCrypto.verifyQRToken(token);
      
      if (decoded.groupId !== groupId) {
        throw new Error('Group ID mismatch');
      }

      // Verify HMAC
      const expectedHash = SecurityCrypto.generateHMAC({
        groupId,
        token,
        timestamp: decoded.iat * 1000
      });

      if (!SecurityCrypto.verifyHMAC({ groupId, token, timestamp: decoded.iat * 1000 }, verificationHash)) {
        throw new Error('QR code verification failed');
      }

      return {
        valid: true,
        groupId: decoded.groupId,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000)
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Generate one-time QR code for check-in
  static async generateOneTimeQR(groupId, memberId) {
    try {
      const nonce = crypto.randomBytes(16).toString('hex');
      const payload = {
        groupId,
        memberId,
        type: 'checkin',
        nonce,
        singleUse: true
      };

      const token = SecurityCrypto.generateSecureQRToken(payload, '1h');
      const baseUrl = process.env.FRONTEND_URL || 'https://barreservas.vercel.app';
      const qrUrl = `${baseUrl}/checkin?token=${token}`;

      const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H',
        width: 200,
        margin: 1
      });

      return {
        qrCodeDataURL,
        qrUrl,
        token,
        expiresAt: new Date(Date.now() + (60 * 60 * 1000)), // 1 hour
        singleUse: true
      };
    } catch (error) {
      throw new Error(`One-time QR generation failed: ${error.message}`);
    }
  }

  // Validate QR scan attempt
  static validateQRScan(req) {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    const timestamp = Date.now();

    // Check for suspicious patterns
    const suspiciousUAs = [
      /bot|crawler|spider|scraper/i,
      /curl|wget|python|java/i
    ];

    if (suspiciousUAs.some(pattern => pattern.test(userAgent))) {
      throw new Error('Suspicious user agent detected');
    }

    // Rate limiting check (handled by middleware, but double-check)
    const scanKey = `qr_scan:${ip}`;
    // This would integrate with Redis in production

    return {
      ip,
      userAgent,
      timestamp,
      valid: true
    };
  }

  // Log QR access for security monitoring
  static logQRAccess(groupId, token, req, success = true) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      groupId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success,
      token: token.substring(0, 10) + '...', // Partial token for logging
      referer: req.get('Referer'),
      method: req.method,
      url: req.url
    };

    console.log(`[QR_ACCESS] ${JSON.stringify(logEntry)}`);

    // In production, send to security monitoring system
    if (!success) {
      console.warn(`[QR_SECURITY] Failed QR access attempt: ${JSON.stringify(logEntry)}`);
    }
  }

  // Revoke QR code (for security incidents)
  static async revokeQRCode(token) {
    try {
      // In production, add to Redis blacklist
      const revokedKey = `revoked_qr:${crypto.createHash('sha256').update(token).digest('hex')}`;
      // await redisClient.setex(revokedKey, 86400, 'revoked'); // 24 hours
      
      console.log(`[QR_SECURITY] QR code revoked: ${token.substring(0, 10)}...`);
      return true;
    } catch (error) {
      console.error(`[QR_SECURITY] Failed to revoke QR code: ${error.message}`);
      return false;
    }
  }

  // Check if QR code is revoked
  static async isQRRevoked(token) {
    try {
      const revokedKey = `revoked_qr:${crypto.createHash('sha256').update(token).digest('hex')}`;
      // const isRevoked = await redisClient.exists(revokedKey);
      // return isRevoked === 1;
      return false; // Placeholder for Redis integration
    } catch (error) {
      console.error(`[QR_SECURITY] Error checking revocation: ${error.message}`);
      return false;
    }
  }
}

module.exports = SecureQRService;