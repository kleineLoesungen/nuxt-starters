import { defineEventHandler, readBody } from 'h3';
import { requirePermission } from '../../../utils/session';
import { deleteUser, getUserById } from '../../../composables/useUsers';
import { logUserEvent } from '../../../utils/logger';

export default defineEventHandler(async (event) => {
  // Require admin authentication
  const currentUser = await requirePermission(event, 'admin.manage');

  const body = await readBody(event);
  const { userId } = body;

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required',
    });
  }

  // Prevent admin from deleting themselves
  if (userId === currentUser.id) {
    throw createError({
      statusCode: 400,
      message: 'You cannot delete your own account',
    });
  }

  // Check if user exists
  const user = await getUserById(userId);
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    });
  }

  // Delete user
  await deleteUser(userId);

  // Log the user deletion
  logUserEvent('deleted', userId, user.username, currentUser.username);

  return {
    success: true,
    message: `User ${user.username} deleted successfully`,
  };
});
