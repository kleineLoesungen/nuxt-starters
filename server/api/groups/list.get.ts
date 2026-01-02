import { dbQuery } from '../../composables/useDatabase';
import { requirePermission } from '../../utils/session';

/**
 * GET /api/groups/list
 * Get all groups with member counts
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');

  try {
    const groups = await dbQuery<{
      id: number;
      name: string;
      description: string;
      is_public: boolean;
      created_at: Date;
      updated_at: Date;
      member_count: number;
    }>(
      `SELECT g.id, g.name, g.description, g.is_public, g.created_at, g.updated_at,
              COUNT(ug.user_id) as member_count
       FROM groups g
       LEFT JOIN user_groups ug ON g.id = ug.group_id
       GROUP BY g.id, g.name, g.description, g.is_public, g.created_at, g.updated_at
       ORDER BY g.is_public DESC, g.name ASC`
    );

    return {
      success: true,
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        isPublic: g.is_public,
        memberCount: parseInt(String(g.member_count)),
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      })),
    };
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch groups',
    });
  }
});
