import { dbQuery } from '../../composables/useDatabase';
import { requirePermission, getUserFromEvent } from '../../utils/session';
import { logGroupEvent } from '../../utils/logger';

/**
 * POST /api/groups/remove-member
 * Remove a user from a group
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');

  const body = await readBody(event);
  const { groupId, userId } = body;

  if (!groupId || !userId) {
    throw createError({
      statusCode: 400,
      message: 'Group ID and User ID are required',
    });
  }

  try {
    await dbQuery(
      'DELETE FROM user_groups WHERE user_id = $1 AND group_id = $2',
      [userId, groupId]
    );

    // Get group and user info for logging
    const groupInfo = await dbQuery<{ name: string }>('SELECT name FROM groups WHERE id = $1', [groupId]);
    const userInfo = await dbQuery<{ username: string }>('SELECT username FROM users WHERE id = $1', [userId]);
    const admin = await getUserFromEvent(event);
    
    logGroupEvent(
      'member_removed',
      groupId,
      groupInfo[0]?.name || 'Unknown',
      admin?.username || 'system',
      { removedUser: userInfo[0]?.username || `ID:${userId}` }
    );

    return {
      success: true,
      message: 'User removed from group successfully',
    };
  } catch (error) {
    console.error('Error removing user from group:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to remove user from group',
    });
  }
});
