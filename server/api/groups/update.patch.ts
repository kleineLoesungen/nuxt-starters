import { dbQueryOne } from '../../composables/useDatabase';
import { requirePermission, getUserFromEvent } from '../../utils/session';
import { logGroupEvent } from '../../utils/logger';

/**
 * PATCH /api/groups/update
 * Update a group
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');

  const body = await readBody(event);
  const { groupId, name, description, isPublic } = body;

  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: 'Group ID is required',
    });
  }

  if (name && (name.length < 2 || name.length > 100)) {
    throw createError({
      statusCode: 400,
      message: 'Group name must be between 2 and 100 characters',
    });
  }

  // Protect Admins group from being renamed or made public
  const currentGroup = await dbQueryOne<{ name: string }>(
    'SELECT name FROM groups WHERE id = $1',
    [groupId]
  );
  
  if (currentGroup && currentGroup.name === 'Admins') {
    if (name && name !== 'Admins') {
      throw createError({
        statusCode: 403,
        message: 'The Admins group cannot be renamed',
      });
    }
    if (isPublic === true) {
      throw createError({
        statusCode: 403,
        message: 'The Admins group cannot be changed to public',
      });
    }
  }

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description || null);
    }

    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex++}`);
      values.push(isPublic);
    }

    updates.push(`updated_at = NOW()`);
    values.push(groupId);

    const group = await dbQueryOne<{
      id: number;
      name: string;
      description: string;
      is_public: boolean;
    }>(
      `UPDATE groups 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, name, description, is_public`,
      values
    );

    if (!group) {
      throw createError({
        statusCode: 404,
        message: 'Group not found',
      });
    }

    // Log the group update
    const user = await getUserFromEvent(event);
    const changedFields = [];
    if (name !== undefined) changedFields.push('name');
    if (description !== undefined) changedFields.push('description');
    if (isPublic !== undefined) changedFields.push('isPublic');
    logGroupEvent('updated', group.id, group.name, user?.username || 'system', { fields: changedFields });

    return {
      success: true,
      message: 'Group updated successfully',
      group,
    };
  } catch (error: any) {
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'A group with this name already exists',
      });
    }
    console.error('Error updating group:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to update group',
    });
  }
});
