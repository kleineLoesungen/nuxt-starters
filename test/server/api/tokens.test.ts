import { describe, it, expect, beforeAll } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('Token API', async () => {
  await setup({
    server: true,
  });

  // Since we can't easily test with session cookies in @nuxt/test-utils,
  // we'll test the unauthenticated paths and Bearer token auth only
  const testUser = {
    username: `tokenuser_${Date.now()}`,
    email: `tokentest_${Date.now()}@example.com`,
    password: 'testPassword123',
  };

  beforeAll(async () => {
    // Register test user
    await $fetch('/api/users/register', {
      method: 'POST',
      body: testUser,
    });
  });

  describe('POST /api/tokens/create', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/tokens/create', {
          method: 'POST',
          body: {
            name: 'Test Token',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('GET /api/tokens/list', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/tokens/list');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('DELETE /api/tokens/[id]', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/tokens/999', {
          method: 'DELETE',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('Token Authentication', () => {
    it('should reject invalid token', async () => {
      try {
        await $fetch('/api/users/me', {
          headers: {
            authorization: 'Bearer invalid_token_12345678901234567890123456',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
