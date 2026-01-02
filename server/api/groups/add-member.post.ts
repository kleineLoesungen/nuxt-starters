import { dbQuery } from '../../composables/useDatabase';
import { requirePermission, getUserFromEvent } from '../../utils/session';
import { logGroupEvent } from '../../utils/logger';

/**
 * POST /api/groups/add-member
 * Add a user to a group
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
      `INSERT INTO user_groups (user_id, group_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, group_id) DO NOTHING`,
      [userId, groupId]
    );

    // Get group and user info for logging
    const groupInfo = await dbQuery<{ name: string }>('SELECT name FROM groups WHERE id = $1', [groupId]);
    const userInfo = await dbQuery<{ username: string }>('SELECT username FROM users WHERE id = $1', [userId]);
    const admin = await getUserFromEvent(event);
    
    logGroupEvent(
      'member_added',
      groupId,
      groupInfo[0]?.name || 'Unknown',
      admin?.username || 'system',
      { addedUser: userInfo[0]?.username || `ID:${userId}` }
    );

    return {
      success: true,
      message: 'User added to group successfully',
    };
  } catch (error) {
    console.error('Error adding user to group:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to add user to group',
    });
  }
});
