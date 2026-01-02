import { describe, it, expect, beforeAll } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('Logs API', async () => {
  await setup({
    server: true,
  });

  describe('GET /api/logs', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/logs');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
