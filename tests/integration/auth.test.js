const request = require('supertest');
const app = require('../../backend/server');

describe('Authentication API', () => {
  describe('POST /api/auth/setup-admin', () => {
    test('should create admin user successfully', async () => {
      const adminData = {
        email: 'admin@test.com',
        password: 'admin123456'
      };

      const response = await request(app)
        .post('/api/auth/setup-admin')
        .send(adminData)
        .expect(201);

      expect(response.body.message).toBe('Admin user created successfully');
      expect(response.body.user.email).toBe(adminData.email);
      expect(response.body.user.role).toBe('admin');
    });

    test('should reject duplicate admin creation', async () => {
      const adminData = {
        email: 'admin@test.com',
        password: 'admin123456'
      };

      // Create first admin
      await request(app)
        .post('/api/auth/setup-admin')
        .send(adminData);

      // Try to create second admin
      const response = await request(app)
        .post('/api/auth/setup-admin')
        .send(adminData)
        .expect(400);

      expect(response.body.error).toBe('Admin user already exists');
    });

    test('should validate email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'admin123456'
      };

      const response = await request(app)
        .post('/api/auth/setup-admin')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('Invalid email');
    });

    test('should validate password length', async () => {
      const invalidData = {
        email: 'admin@test.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/setup-admin')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('password too short');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create admin user for login tests
      await request(app)
        .post('/api/auth/setup-admin')
        .send({
          email: 'admin@test.com',
          password: 'admin123456'
        });
    });

    test('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'admin123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.role).toBe('admin');
    });

    test('should reject invalid credentials', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/verify', () => {
    let authToken;

    beforeEach(async () => {
      // Create admin and get token
      await request(app)
        .post('/api/auth/setup-admin')
        .send({
          email: 'admin@test.com',
          password: 'admin123456'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123456'
        });

      authToken = loginResponse.body.token;
    });

    test('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user.email).toBe('admin@test.com');
    });

    test('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body.error).toBe('No token provided');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });
});