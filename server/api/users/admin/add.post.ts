import { dbQuery, dbQueryOne } from '../../../composables/useDatabase';
import { hashPassword, isValidEmail, isValidUsername, isValidPassword } from '../../../utils/auth';
import { requirePermission, getUserFromEvent } from '../../../utils/session';
import { sendWelcomeEmail } from '../../../composables/useEmail';
import { logUserEvent } from '../../../utils/logger';

/**
 * Admin endpoint to add a new user
 * POST /api/users/admin/add
 * 
 * Body:
 * - username: string
 * - email: string
 * - password: string
 */
export default defineEventHandler(async (event) => {
  // Check if user has permission
  await requirePermission(event, 'admin.manage');

  const body = await readBody(event);
  const { username, email, password } = body;

  // Validate input
  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required',
    });
  }

  // Validate username format
  if (!isValidUsername(username)) {
    throw createError({
      statusCode: 400,
      message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
    });
  }

  // Validate email format (only if provided)
  if (email && !isValidEmail(email)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid email format',
    });
  }

  // Validate password
  if (!isValidPassword(password)) {
    throw createError({
      statusCode: 400,
      message: 'Password must be at least 8 characters long',
    });
  }

  // Check if username already exists
  const existingUsername = await dbQueryOne(
    'SELECT id FROM users WHERE username = $1',
    [username]
  );

  if (existingUsername) {
    throw createError({
      statusCode: 409,
      message: 'Username already exists',
    });
  }

  // Check if email already exists (only if email provided)
  if (email) {
    const existingEmail = await dbQueryOne(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail) {
      throw createError({
        statusCode: 409,
        message: 'Email already exists',
      });
    }
  }

  // Hash the password
  const hashedPassword = hashPassword(password);

  // Insert the new user
  const result = await dbQueryOne<{ id: number; username: string; email: string; created_at: Date }>(
    `INSERT INTO users (username, email, password, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING id, username, email, created_at`,
    [username, email, hashedPassword]
  );

  // Send welcome email if notification is enabled
  try {
    const notifyUserSetting = await dbQueryOne<{ value: string }>(
      'SELECT value FROM settings WHERE key = $1',
      ['notify_user_creation']
    );

    if (notifyUserSetting?.value === 'true') {
      if (email) {
        await sendWelcomeEmail(email, username);
      } else {
        console.log('User has no email, skipping welcome email');
      }
    }
  } catch (emailError) {
    // Log email errors but don't fail the user creation
    console.error('Failed to send welcome email:', emailError);
  }

  // Log the user creation
  const admin = await getUserFromEvent(event);
  logUserEvent('created', result?.id || 0, result?.username || username, admin?.username || 'system');

  return {
    success: true,
    message: 'User added successfully',
    user: {
      id: result?.id,
      username: result?.username,
      email: result?.email,
      createdAt: result?.created_at,
    },
  };
});
