import { defineEventHandler, readBody } from 'h3';
import { requirePermission, getUserFromEvent } from '../../utils/session';
import { dbQuery } from '../../composables/useDatabase';
import { logPermissionEvent } from '../../utils/logger';

/**
 * POST /api/permissions/remove
 * Remove a permission by ID
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');

  const body = await readBody(event);
  const { permissionId } = body;

  if (!permissionId) {
    throw createError({
      statusCode: 400,
      message: 'Permission ID is required',
    });
  }

  // Check if this is admin.manage permission in Admins group
  const permission = await dbQuery<{ permission_key: string; group_id: number }>(
    'SELECT p.permission_key, p.group_id FROM permissions p WHERE p.id = $1',
    [permissionId]
  );
  
  if (permission.length > 0) {
    const groupInfo = await dbQuery<{ name: string }>(
      'SELECT name FROM groups WHERE id = $1',
      [permission[0].group_id]
    );
    
    if (groupInfo.length > 0 && groupInfo[0].name === 'Admins' && permission[0].permission_key === 'admin.manage') {
      throw createError({
        statusCode: 403,
        message: 'The admin.manage permission cannot be removed from the Admins group',
      });
    }
  }

  await dbQuery('DELETE FROM permissions WHERE id = $1', [permissionId]);

  // Log the removal
  const user = await getUserFromEvent(event);
  const groupName = groupInfo.length > 0 ? groupInfo[0].name : 'Unknown';
  logPermissionEvent('removed', permission[0].group_id, groupName, permission[0].permission_key, user?.username || 'system');

  return {
    success: true,
    message: 'Permission removed successfully',
  };
});
