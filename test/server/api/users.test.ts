import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('User API', async () => {
  await setup({
    server: true,
  });

  let testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'testPassword123',
  };

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const response = await $fetch('/api/users/register', {
        method: 'POST',
        body: testUser,
      }) as any;

      expect(response.success).toBe(true);
      expect(response.user).toBeDefined();
      expect(response.user.username).toBe(testUser.username);
      expect(response.user.email).toBe(testUser.email);
    });

    it('should reject duplicate username', async () => {
      try {
        await $fetch('/api/users/register', {
          method: 'POST',
          body: {
            username: testUser.username,
            email: `different_${Date.now()}@example.com`,
            password: 'password123',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(409);
      }
    });

    it('should reject duplicate email', async () => {
      try {
        await $fetch('/api/users/register', {
          method: 'POST',
          body: {
            username: `different_${Date.now()}`,
            email: testUser.email,
            password: 'password123',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(409);
      }
    });

    it('should reject invalid email', async () => {
      try {
        await $fetch('/api/users/register', {
          method: 'POST',
          body: {
            username: `user_${Date.now()}`,
            email: 'invalid-email',
            password: 'password123',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('should reject short password', async () => {
      try {
        await $fetch('/api/users/register', {
          method: 'POST',
          body: {
            username: `user_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'short',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('should allow registration without email', async () => {
      const response = await $fetch('/api/users/register', {
        method: 'POST',
        body: {
          username: `noemail_${Date.now()}`,
          password: 'password123',
        },
      }) as any;

      expect(response.success).toBe(true);
      expect(response.user).toBeDefined();
      expect(response.user.email).toBeNull();
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      const response = await $fetch('/api/users/login', {
        method: 'POST',
        body: {
          username: testUser.username,
          password: testUser.password,
        },
      }) as any;

      expect(response.success).toBe(true);
      expect(response.user).toBeDefined();
      expect(response.user.username).toBe(testUser.username);
    });

    it('should reject invalid password', async () => {
      try {
        await $fetch('/api/users/login', {
          method: 'POST',
          body: {
            username: testUser.username,
            password: 'wrongPassword',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });

    it('should reject non-existent user', async () => {
      try {
        await $fetch('/api/users/login', {
          method: 'POST',
          body: {
            username: 'nonexistentuser',
            password: 'password123',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('GET /api/users/me', () => {
    it('should return 401 for unauthenticated request', async () => {
      try {
        await $fetch('/api/users/me');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('Admin Functions', () => {
    let memberUser = {
      username: `member_${Date.now()}`,
      email: `member_${Date.now()}@example.com`,
      password: 'memberPassword123',
    };

    describe('POST /api/users/admin/add', () => {
      it('should require authentication', async () => {
        try {
          await $fetch('/api/users/admin/add', {
            method: 'POST',
            body: {
              username: memberUser.username,
              email: memberUser.email,
              password: memberUser.password,
            },
          });
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.statusCode).toBe(401);
        }
      });
    });

    describe('POST /api/users/admin/reset-password', () => {
      it('should require authentication', async () => {
        try {
          await $fetch('/api/users/admin/reset-password', {
            method: 'POST',
            body: {
              userId: 1,
            },
          });
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.statusCode).toBe(401);
        }
      });
    });

    describe('POST /api/users/admin/delete', () => {
      it('should require authentication', async () => {
        try {
          await $fetch('/api/users/admin/delete', {
            method: 'POST',
            body: {
              userId: 1,
            },
          });
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.statusCode).toBe(401);
        }
      });
    });

    describe('GET /api/users/admin/list', () => {
      it('should require authentication', async () => {
        try {
          await $fetch('/api/users/admin/list');
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.statusCode).toBe(401);
        }
      });
    });
  });
});
