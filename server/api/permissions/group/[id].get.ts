import { defineEventHandler } from 'h3';
import { requirePermission } from '../../../utils/session';
import { getGroupPermissions } from '../../../composables/usePermissions';

/**
 * GET /api/permissions/group/:id
 * Get all permissions for a specific group
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');

  const groupId = parseInt(event.context.params?.id || '0');

  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: 'Group ID is required',
    });
  }

  const permissions = await getGroupPermissions(groupId);

  return {
    success: true,
    permissions,
  };
});
