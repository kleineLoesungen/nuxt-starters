import { describe, it, expect } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('Groups API', async () => {
  await setup({
    server: true,
  });

  describe('GET /api/groups/list', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/groups/list');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/groups/create', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/groups/create', {
          method: 'POST',
          body: {
            name: 'Test Group',
            description: 'Test Description',
            isPublic: false,
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });

    it('should require authentication for public group creation', async () => {
      try {
        await $fetch('/api/groups/create', {
          method: 'POST',
          body: {
            name: 'Public Test Group',
            description: 'Public Description',
            isPublic: true,
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('PATCH /api/groups/update', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/groups/update', {
          method: 'PATCH',
          body: {
            groupId: 1,
            name: 'Updated Group',
            description: 'Updated Description',
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });

    it('should require authentication when updating isPublic', async () => {
      try {
        await $fetch('/api/groups/update', {
          method: 'PATCH',
          body: {
            groupId: 1,
            isPublic: true,
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/groups/delete', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/groups/delete', {
          method: 'POST',
          body: {
            groupId: 1,
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('GET /api/groups/members', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/groups/members?groupId=1');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/groups/add-member', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/groups/add-member', {
          method: 'POST',
          body: {
            groupId: 1,
            userId: 1,
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/groups/remove-member', () => {
    it('should require authentication', async () => {
      try {
        await $fetch('/api/groups/remove-member', {
          method: 'POST',
          body: {
            groupId: 1,
            userId: 1,
          },
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
