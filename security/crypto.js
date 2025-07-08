const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

class SecurityCrypto {
  // Encrypt sensitive data
  static encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, SECRET_KEY);
    cipher.setAAD(Buffer.from('barreservas', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt sensitive data
  static decrypt(encryptedData) {
    const decipher = crypto.createDecipher(ALGORITHM, SECRET_KEY);
    decipher.setAAD(Buffer.from('barreservas', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Secure QR token generation
  static generateSecureQRToken(groupId, expiresIn = '24h') {
    const payload = {
      groupId,
      type: 'qr_access',
      iat: Math.floor(Date.now() / 1000),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn,
      issuer: 'barreservas',
      audience: 'qr-scanner'
    });
  }

  // Verify QR token
  static verifyQRToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'barreservas',
        audience: 'qr-scanner'
      });
    } catch (error) {
      throw new Error('Invalid or expired QR code');
    }
  }

  // Hash passwords
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify passwords
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate secure session token
  static generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // HMAC for data integrity
  static generateHMAC(data) {
    return crypto
      .createHmac('sha256', SECRET_KEY)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  // Verify HMAC
  static verifyHMAC(data, signature) {
    const expectedSignature = this.generateHMAC(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

module.exports = SecurityCrypto;