import { dbQuery, dbQueryOne } from '../../../composables/useDatabase';
import { hashPassword } from '../../../utils/auth';
import { requirePermission, getUserFromEvent } from '../../../utils/session';
import { logUserEvent } from '../../../utils/logger';

/**
 * Admin endpoint to reset a user's password
 * POST /api/users/admin/reset-password
 * 
 * Body:
 * - userId: number
 * 
 * Returns the generated password (only time it's shown)
 */
export default defineEventHandler(async (event) => {
  // Check if user is admin
  await requirePermission(event, 'admin.manage');

  const body = await readBody(event);
  const { userId } = body;

  // Validate input
  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required',
    });
  }

  // Check if user exists
  const user = await dbQueryOne(
    'SELECT id, username FROM users WHERE id = $1',
    [userId]
  );

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    });
  }

  // Prevent resetting own password (use regular password change for that)
  const session = await requirePermission(event, '/api/users/admin/reset-password');
  if (session.userId === userId) {
    throw createError({
      statusCode: 403,
      message: 'You cannot reset your own password. Use the profile page instead.',
    });
  }

  // Generate a new random password
  const newPassword = generateSecurePassword();

  // Hash the password
  const hashedPassword = hashPassword(newPassword);

  // Update user password
  await dbQuery(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, userId]
  );

  // Log the password reset
  const admin = await getUserFromEvent(event);
  logUserEvent('password_reset', userId, user.username, admin?.username || 'system');

  return {
    success: true,
    message: 'Password reset successfully',
    password: newPassword, // Return the plain password so admin can give it to user
  };
});

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  const length = 16;
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to randomize character positions
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
