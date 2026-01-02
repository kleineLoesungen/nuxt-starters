/**
 * Permission Registry
 * Central registry of all capabilities/features in the application
 * 
 * HOW IT WORKS:
 * 1. Developer registers ONE permission (capability) here
 * 2. Developer uses the same permission key to protect:
 *    - Pages (in middleware)
 *    - API endpoints (with requirePermission)
 *    - UI sections (with v-can directive)
 * 3. Admin assigns this permission to groups in the UI
 * 
 * These are automatically synced to the database on startup
 */

export interface RegisteredPermission {
  key: string;  // Unique permission key (e.g., 'admin.manage')
  description: string;  // Human-readable description
  includesAccess?: string[];  // Optional: List resources this grants access to (for documentation)
  requiresAdminByDefault?: boolean; // Auto-assign to Admins group
}

/**
 * All registered permissions in the application
 * Add new entries here when creating protected features
 */
export const PERMISSION_REGISTRY: RegisteredPermission[] = [
  // ============================================
  // ADMIN MANAGEMENT CAPABILITY
  // ============================================
  {
    key: 'admin.manage',
    description: 'Manage Page (Admin)',
    includesAccess: [
      'Page: /users/admin',
      'API: /api/users/admin/* (all user management)',
      'API: /api/groups/* (all group management)',
      'API: /api/settings/update (app settings)',
      'API: /api/permissions/* (permission management)',
    ],
    requiresAdminByDefault: true,
  },

  // ============================================
  // EXAMPLE CAPABILITY
  // ============================================
  {
    key: 'permissions.list',
    description: 'View Permissions Page',
    includesAccess: [
      'Page: /permissions',
      'Section: Permission list view',
    ],
    requiresAdminByDefault: false,
  },

  // ============================================
  // ============================================
  // EXAMPLE: Custom Feature/Capability
  // ============================================
  // {
  //   key: 'reports.view',
  //   description: 'View Reports',
  //   includesAccess: [
  //     'Page: /reports',
  //     'API: /api/reports/list',
  //     'Section: reports-dashboard',
  //   ],
  //   requiresAdminByDefault: false,
  // },
  // {
  //   key: 'reports.export',
  //   description: 'Export Reports',
  //   includesAccess: [
  //     'API: /api/reports/export',
  //     'Section: export-button',
  //   ],
  //   requiresAdminByDefault: false,
  // },
];

/**
 * Get all permissions that should be auto-assigned to Admins group
 */
export function getDefaultAdminPermissions(): RegisteredPermission[] {
  return PERMISSION_REGISTRY.filter(p => p.requiresAdminByDefault === true);
}

/**
 * Check if a permission key is registered
 */
export function isPermissionRegistered(key: string): boolean {
  return PERMISSION_REGISTRY.some(p => p.key === key);
}

/**
 * Get permission by key
 */
export function getPermissionByKey(key: string): RegisteredPermission | undefined {
  return PERMISSION_REGISTRY.find(p => p.key === key);
}
