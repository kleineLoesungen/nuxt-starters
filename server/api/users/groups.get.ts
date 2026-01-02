import { dbQuery } from '../../composables/useDatabase';
import { requirePermission } from '../../utils/session';

/**
 * GET /api/users/groups?userId=X
 * Get all groups a user belongs to
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');

  const query = getQuery(event);
  const userId = query.userId;

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required',
    });
  }

  try {
    const groups = await dbQuery<{
      id: number;
      name: string;
      description: string;
    }>(
      `SELECT g.id, g.name, g.description
       FROM groups g
       INNER JOIN user_groups ug ON g.id = ug.group_id
       WHERE ug.user_id = $1
       ORDER BY g.name ASC`,
      [userId]
    );

    return {
      success: true,
      groups,
    };
  } catch (error) {
    console.error('Error fetching user groups:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch user groups',
    });
  }
});
