import { defineEventHandler } from 'h3';
import { requirePermission } from '../../../utils/session';
import { getAllUsers } from '../../../composables/useUsers';

export default defineEventHandler(async (event) => {
  // Require permission to access admin user list
  await requirePermission(event, 'admin.manage');

  // Get all users
  const users = await getAllUsers();

  return {
    success: true,
    users: users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    })),
  };
});
