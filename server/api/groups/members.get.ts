import { dbQuery } from '../../composables/useDatabase';
import { requirePermission } from '../../utils/session';

/**
 * GET /api/groups/members?groupId=X
 * Get all members of a group
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');

  const query = getQuery(event);
  const groupId = query.groupId;

  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: 'Group ID is required',
    });
  }

  try {
    const members = await dbQuery<{
      id: number;
      username: string;
      email: string;
    }>(
      `SELECT u.id, u.username, u.email
       FROM users u
       INNER JOIN user_groups ug ON u.id = ug.user_id
       WHERE ug.group_id = $1
       ORDER BY u.username ASC`,
      [groupId]
    );

    return {
      success: true,
      members,
    };
  } catch (error) {
    console.error('Error fetching group members:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch group members',
    });
  }
});
