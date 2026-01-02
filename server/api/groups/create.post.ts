import { dbQueryOne } from '../../composables/useDatabase';
import { requirePermission, getUserFromEvent } from '../../utils/session';
import { logGroupEvent } from '../../utils/logger';

/**
 * POST /api/groups/create
 * Create a new group
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');

  const body = await readBody(event);
  const { name, description, isPublic } = body;

  if (!name) {
    throw createError({
      statusCode: 400,
      message: 'Group name is required',
    });
  }

  if (name.length < 2 || name.length > 100) {
    throw createError({
      statusCode: 400,
      message: 'Group name must be between 2 and 100 characters',
    });
  }

  try {
    const group = await dbQueryOne<{
      id: number;
      name: string;
      description: string;
      is_public: boolean;
      created_at: Date;
    }>(
      `INSERT INTO groups (name, description, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, name, description, is_public, created_at`,
      [name, description || null, isPublic || false]
    );

    // Log the group creation
    const user = await getUserFromEvent(event);
    logGroupEvent('created', group?.id || 0, group?.name || name, user?.username || 'system');

    return {
      success: true,
      message: 'Group created successfully',
      group: {
        id: group?.id,
        name: group?.name,
        description: group?.description,
        isPublic: group?.is_public,
        createdAt: group?.created_at,
      },
    };
  } catch (error: any) {
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'A group with this name already exists',
      });
    }
    console.error('Error creating group:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to create group',
    });
  }
});
