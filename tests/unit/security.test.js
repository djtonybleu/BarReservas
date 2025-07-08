const SecurityCrypto = require('../../security/crypto');
const { InputValidator } = require('../../security/validation');
const SecureQRService = require('../../security/secure-qr');

describe('Security Module', () => {
  describe('SecurityCrypto', () => {
    test('should encrypt and decrypt data correctly', () => {
      const testData = 'sensitive information';
      const encrypted = SecurityCrypto.encrypt(testData);
      const decrypted = SecurityCrypto.decrypt(encrypted);
      
      expect(decrypted).toBe(testData);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
    });

    test('should generate and verify QR tokens', () => {
      const groupId = 'test-group-123';
      const token = SecurityCrypto.generateSecureQRToken(groupId);
      const verified = SecurityCrypto.verifyQRToken(token);
      
      expect(verified.groupId).toBe(groupId);
      expect(verified.type).toBe('qr_access');
    });

    test('should hash and verify passwords', async () => {
      const password = 'testPassword123';
      const hash = await SecurityCrypto.hashPassword(password);
      const isValid = await SecurityCrypto.verifyPassword(password, hash);
      const isInvalid = await SecurityCrypto.verifyPassword('wrongPassword', hash);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    test('should generate and verify HMAC', () => {
      const data = { test: 'data', number: 123 };
      const hmac = SecurityCrypto.generateHMAC(data);
      const isValid = SecurityCrypto.verifyHMAC(data, hmac);
      const isInvalid = SecurityCrypto.verifyHMAC({ modified: 'data' }, hmac);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('InputValidator', () => {
    test('should validate email correctly', () => {
      expect(InputValidator.validateEmail('test@example.com')).toBe(true);
      expect(InputValidator.validateEmail('invalid-email')).toBe(false);
      expect(InputValidator.validateEmail('')).toBe(false);
    });

    test('should validate phone numbers', () => {
      expect(InputValidator.validatePhone('+1234567890')).toBe(true);
      expect(InputValidator.validatePhone('invalid-phone')).toBe(false);
    });

    test('should validate Instagram usernames', () => {
      expect(InputValidator.validateInstagram('valid_username')).toBe(true);
      expect(InputValidator.validateInstagram('invalid@username')).toBe(false);
      expect(InputValidator.validateInstagram('')).toBe(true); // Optional field
    });

    test('should sanitize HTML input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const sanitized = InputValidator.sanitizeHTML(maliciousInput);
      expect(sanitized).toBe('Hello');
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('SecureQRService', () => {
    test('should generate secure QR code', async () => {
      const groupId = 'test-group-123';
      const qrData = await SecureQRService.generateSecureQR(groupId);
      
      expect(qrData.qrCodeDataURL).toContain('data:image/png;base64');
      expect(qrData.qrUrl).toContain(groupId);
      expect(qrData.token).toBeDefined();
      expect(qrData.verificationHash).toBeDefined();
    });

    test('should verify QR code authenticity', async () => {
      const groupId = 'test-group-123';
      const qrData = await SecureQRService.generateSecureQR(groupId);
      
      const verification = SecureQRService.verifyQRCode(
        qrData.token, 
        qrData.verificationHash, 
        groupId
      );
      
      expect(verification.valid).toBe(true);
      expect(verification.groupId).toBe(groupId);
    });

    test('should reject invalid QR codes', () => {
      const verification = SecureQRService.verifyQRCode(
        'invalid-token', 
        'invalid-hash', 
        'test-group'
      );
      
      expect(verification.valid).toBe(false);
      expect(verification.error).toBeDefined();
    });
  });
});