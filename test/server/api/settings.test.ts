import { describe, it, expect } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('Settings API', async () => {
  await setup({
    server: true,
  });

  describe('GET /api/settings', () => {
    it('should return public settings without authentication', async () => {
      const response = await $fetch('/api/settings') as any;
      expect(response.success).toBe(true);
      expect(response.settings).toBeDefined();
      expect(response.settings.registrationEnabled).toBeDefined();
      expect(response.settings.emailConfigured).toBeDefined();
    });
  });

  describe('PATCH /api/settings/update', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/settings/update', {
          method: 'PATCH',
          body: {
            key: 'allowRegistration',
            value: true,
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
