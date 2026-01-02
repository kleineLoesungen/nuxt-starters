import { describe, it, expect } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('Permissions API', async () => {
  await setup({
    server: true,
  });

  describe('GET /api/permissions/registered', () => {
    it('should return list of registered permissions', async () => {
      const response = await $fetch('/api/permissions/registered') as any;
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.permissions).toBeDefined();
      expect(Array.isArray(response.permissions)).toBe(true);
      expect(response.permissions.length).toBeGreaterThan(0);
      
      // Check structure of first permission
      const firstPermission = response.permissions[0];
      expect(firstPermission).toHaveProperty('key');
      expect(firstPermission).toHaveProperty('description');
      
      // Verify admin.manage permission exists
      const adminPermission = response.permissions.find(
        (p: any) => p.key === 'admin.manage'
      );
      expect(adminPermission).toBeDefined();
      expect(adminPermission.description).toContain('Admin');
    });
  });

  describe('GET /api/permissions/group/:id', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/permissions/group/1');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/permissions/add', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/permissions/add', {
          method: 'POST',
          body: {
            groupId: 1,
            permissionKey: 'permissions.list',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/permissions/remove', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/permissions/remove', {
          method: 'POST',
          body: {
            groupId: 1,
            permissionKey: 'permissions.list',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
