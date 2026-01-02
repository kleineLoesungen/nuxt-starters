import { defineEventHandler, readBody } from 'h3';
import { requirePermission, getUserFromEvent } from '../../utils/session';
import { addPermission } from '../../composables/usePermissions';
import { logPermissionEvent } from '../../utils/logger';
import { dbQuery } from '../../composables/useDatabase';

/**
 * POST /api/permissions/add
 * Add a permission to a group
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');

  const body = await readBody(event);
  const { groupId, permissionKey } = body;

  if (!groupId || !permissionKey) {
    throw createError({
      statusCode: 400,
      message: 'Group ID and permission key are required',
    });
  }

  const success = await addPermission(groupId, permissionKey);

  if (!success) {
    throw createError({
      statusCode: 500,
      message: 'Failed to add permission',
    });
  }

  // Get group name for logging
  const groupResult = await dbQuery<{ name: string }>(
    'SELECT name FROM groups WHERE id = $1',
    [groupId]
  );
  const groupName = groupResult[0]?.name || 'Unknown';

  // Get user for logging
  const user = await getUserFromEvent(event);
  logPermissionEvent('added', groupId, groupName, permissionKey, user?.username || 'system');

  return {
    success: true,
    message: 'Permission added successfully',
  };
});
