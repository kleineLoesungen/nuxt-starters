import { dbQuery, dbQueryOne } from '../composables/useDatabase';
import { PERMISSION_REGISTRY, getDefaultAdminPermissions } from '../config/permissions';

/**
 * Sync registered permissions to database
 * This ensures all code-defined permissions exist in the database
 * Should be called on application startup
 */
export async function syncPermissions(): Promise<void> {
  try {
    console.log('Syncing registered permissions to database...');

    // Ensure Admins group exists
    let adminGroup = await dbQueryOne<{ id: number }>(
      'SELECT id FROM groups WHERE name = $1',
      ['Admins']
    );

    if (!adminGroup) {
      await dbQuery(
        "INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING id",
        ['Admins', 'System administrators with full access']
      );
      adminGroup = await dbQueryOne<{ id: number }>(
        'SELECT id FROM groups WHERE name = $1',
        ['Admins']
      );
    }

    if (!adminGroup) {
      console.error('Failed to create or find Admins group');
      return;
    }

    // Get default admin permissions from registry
    const defaultAdminPermissions = getDefaultAdminPermissions();

    // Sync all default admin permissions
    let addedCount = 0;
    for (const perm of defaultAdminPermissions) {
      const result = await dbQuery(
        `INSERT INTO permissions (group_id, permission_key)
         VALUES ($1, $2)
         ON CONFLICT (group_id, permission_key) DO NOTHING
         RETURNING id`,
        [adminGroup.id, perm.key]
      );

      if (result.length > 0) {
        addedCount++;
      }
    }

    console.log(`✓ Synced ${PERMISSION_REGISTRY.length} registered permissions (${addedCount} new)`);
  } catch (error) {
    console.error('Error syncing permissions:', error);
  }
}

/**
 * Get all registered permissions for display in admin UI
 */
export async function getRegisteredPermissions() {
  return PERMISSION_REGISTRY.map(p => ({
    key: p.key,
    description: p.description,
    includesAccess: p.includesAccess || [],
    defaultAdmin: p.requiresAdminByDefault || false,
  }));
}
