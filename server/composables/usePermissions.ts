import { dbQuery } from './useDatabase';

/**
 * Permission utilities for group-based access control
 * Uses capability/feature-based permissions (e.g., 'admin.manage')
 */

interface Permission {
  id: number;
  groupId: number;
  permissionKey: string;
}

/**
 * Load all permissions for a user based on their groups
 * Returns array of permission keys the user has access to
 */
export async function loadUserPermissions(userId: number): Promise<string[]> {
  try {
    const permissions = await dbQuery<{ permission_key: string }>(
      `SELECT DISTINCT p.permission_key
       FROM permissions p
       INNER JOIN user_groups ug ON p.group_id = ug.group_id
       WHERE ug.user_id = $1`,
      [userId]
    );

    return permissions.map(p => p.permission_key);
  } catch (error) {
    console.error('Error loading user permissions:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 */
export function checkPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has permission (by userId, requires DB query)
 * Use this when permissions are not cached in session
 */
export async function hasPermission(
  userId: number,
  permissionKey: string
): Promise<boolean> {
  const permissions = await loadUserPermissions(userId);
  return checkPermission(permissions, permissionKey);
}

/**
 * Get all permissions for a specific group
 */
export async function getGroupPermissions(groupId: number): Promise<Permission[]> {
  try {
    const permissions = await dbQuery<{
      id: number;
      group_id: number;
      permission_key: string;
    }>(
      `SELECT id, group_id, permission_key
       FROM permissions
       WHERE group_id = $1
       ORDER BY permission_key`,
      [groupId]
    );

    return permissions.map(p => ({
      id: p.id,
      groupId: p.group_id,
      permissionKey: p.permission_key,
    }));
  } catch (error) {
    console.error('Error loading group permissions:', error);
    return [];
  }
}

/**
 * Add permission to a group
 */
export async function addPermission(
  groupId: number,
  permissionKey: string
): Promise<boolean> {
  try {
    await dbQuery(
      `INSERT INTO permissions (group_id, permission_key)
       VALUES ($1, $2)
       ON CONFLICT (group_id, permission_key) DO NOTHING`,
      [groupId, permissionKey]
    );
    return true;
  } catch (error) {
    console.error('Error adding permission:', error);
    return false;
  }
}

/**
 * Remove permission from a group by permission ID
 */
export async function removePermissionById(permissionId: number): Promise<boolean> {
  try {
    await dbQuery(
      `DELETE FROM permissions WHERE id = $1`,
      [permissionId]
    );
    return true;
  } catch (error) {
    console.error('Error removing permission:', error);
    return false;
  }
}
