import { dbQuery } from '../../composables/useDatabase';
import { requirePermission, getUserFromEvent } from '../../utils/session';
import { logGroupEvent } from '../../utils/logger';

/**
 * POST /api/groups/delete
 * Delete a group
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');

  const body = await readBody(event);
  const { groupId } = body;

  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: 'Group ID is required',
    });
  }

  // Protect Admins group
  const group = await dbQuery<{ name: string }>(
    'SELECT name FROM groups WHERE id = $1',
    [groupId]
  );
  
  if (group.length > 0 && group[0].name === 'Admins') {
    throw createError({
      statusCode: 403,
      message: 'The Admins group cannot be deleted',
    });
  }

  try {
    const result = await dbQuery(
      'DELETE FROM groups WHERE id = $1',
      [groupId]
    );

    // Log the group deletion
    const user = await getUserFromEvent(event);
    const groupName = group[0]?.name || 'Unknown';
    logGroupEvent('deleted', groupId, groupName, user?.username || 'system');

    return {
      success: true,
      message: 'Group deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting group:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to delete group',
    });
  }
});
