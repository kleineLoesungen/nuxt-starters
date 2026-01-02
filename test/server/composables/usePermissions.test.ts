import { describe, it, expect } from 'vitest';
import { checkPermission } from '../../../server/composables/usePermissions';

describe('Permission System', () => {
  describe('checkPermission', () => {
    it('should return true when permission exists', () => {
      const permissions = ['admin.manage', 'reports.view'];
      expect(checkPermission(permissions, 'admin.manage')).toBe(true);
      expect(checkPermission(permissions, 'reports.view')).toBe(true);
    });

    it('should return false when permission does not exist', () => {
      const permissions = ['admin.manage'];
      expect(checkPermission(permissions, 'reports.view')).toBe(false);
      expect(checkPermission(permissions, 'analytics.view')).toBe(false);
    });

    it('should handle empty permissions array', () => {
      const permissions: string[] = [];
      expect(checkPermission(permissions, 'admin.manage')).toBe(false);
    });

    it('should be case-sensitive', () => {
      const permissions = ['admin.manage'];
      expect(checkPermission(permissions, 'Admin.Manage')).toBe(false);
      expect(checkPermission(permissions, 'ADMIN.MANAGE')).toBe(false);
    });

    it('should use exact string matching', () => {
      const permissions = ['admin.manage'];
      expect(checkPermission(permissions, 'admin')).toBe(false);
      expect(checkPermission(permissions, 'admin.manage.extra')).toBe(false);
    });
  });

  describe('Multiple Permission Checks (OR logic)', () => {
    // Helper function for OR logic
    const hasAnyPermission = (userPermissions: string[], required: string[]): boolean => {
      return required.some(r => userPermissions.includes(r));
    };

    it('should return true when user has at least one permission', () => {
      const permissions = ['reports.view'];
      expect(hasAnyPermission(permissions, ['reports.view', 'analytics.view'])).toBe(true);
    });

    it('should return true when user has all requested permissions', () => {
      const permissions = ['reports.view', 'analytics.view'];
      expect(hasAnyPermission(permissions, ['reports.view', 'analytics.view'])).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      const permissions = ['permissions.list'];
      expect(hasAnyPermission(permissions, ['reports.view', 'analytics.view'])).toBe(false);
    });

    it('should handle empty required permissions array', () => {
      const permissions = ['admin.manage'];
      expect(hasAnyPermission(permissions, [])).toBe(false);
    });

    it('should handle empty user permissions array', () => {
      const permissions: string[] = [];
      expect(hasAnyPermission(permissions, ['admin.manage'])).toBe(false);
    });
  });
});
