import { defineEventHandler } from 'h3';
import { getCurrentUserWithPermissions } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUserWithPermissions(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    });
  }

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      permissions: user.permissions,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  };
});
