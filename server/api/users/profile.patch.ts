import { defineEventHandler, readBody } from 'h3';
import { requireAuth } from '../../utils/session';
import { 
  updateUser, 
  usernameExists, 
  emailExists,
  getUserById 
} from '../../composables/useUsers';
import { 
  isValidEmail, 
  isValidUsername, 
  isValidPassword,
  verifyPassword
} from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readBody(event);
  const { username, email, currentPassword, newPassword } = body;

  // Validate at least one field is being updated
  if (!username && !email && !newPassword) {
    throw createError({
      statusCode: 400,
      message: 'At least one field must be provided to update',
    });
  }

  const updates: any = {};

  // Update username
  if (username && username !== user.username) {
    if (!isValidUsername(username)) {
      throw createError({
        statusCode: 400,
        message: 'Username must be 3-50 characters and contain only letters, numbers, and underscores',
      });
    }

    if (await usernameExists(username)) {
      throw createError({
        statusCode: 409,
        message: 'Username already exists',
      });
    }

    updates.username = username;
  }

  // Update email
  if (email !== undefined && email !== user.email) {
    // Allow empty string to remove email
    if (email === '') {
      updates.email = null;
    } else {
      if (!isValidEmail(email)) {
        throw createError({
          statusCode: 400,
          message: 'Invalid email format',
        });
      }

      if (await emailExists(email)) {
        throw createError({
          statusCode: 409,
          message: 'Email already exists',
        });
      }

      updates.email = email;
    }
  }

  // Update password
  if (newPassword) {
    if (!currentPassword) {
      throw createError({
        statusCode: 400,
        message: 'Current password is required to change password',
      });
    }

    if (!isValidPassword(newPassword)) {
      throw createError({
        statusCode: 400,
        message: 'New password must be at least 8 characters long',
      });
    }

    // Verify current password
    const fullUser = await getUserById(user.id);
    if (!fullUser) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      });
    }

    // Get user with password to verify
    const { authenticateUser } = await import('../../composables/useUsers');
    const authenticated = await authenticateUser(user.username, currentPassword);
    
    if (!authenticated) {
      throw createError({
        statusCode: 401,
        message: 'Current password is incorrect',
      });
    }

    updates.password = newPassword;
  }

  // Perform update
  const updatedUser = await updateUser(user.id, updates);

  if (!updatedUser) {
    throw createError({
      statusCode: 500,
      message: 'Failed to update profile',
    });
  }

  return {
    success: true,
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,

      updatedAt: updatedUser.updated_at,
    },
    message: 'Profile updated successfully',
  };
});
