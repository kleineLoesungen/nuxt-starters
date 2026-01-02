import { defineEventHandler, readBody } from 'h3';
import { 
  createUser, 
  countUsers, 
  usernameExists, 
  emailExists 
} from '../../composables/useUsers';
import { 
  isValidEmail, 
  isValidUsername, 
  isValidPassword 
} from '../../utils/auth';
import { createSession, setSessionCookie } from '../../utils/session';
import { dbQueryOne, dbQuery } from '../../composables/useDatabase';
import { sendWelcomeEmail, sendAdminNotificationEmail } from '../../composables/useEmail';

export default defineEventHandler(async (event) => {
  // Check if registration is enabled from database
  const setting = await dbQueryOne<{ value: string }>(
    'SELECT value FROM settings WHERE key = $1',
    ['registration_enabled']
  );
  const registrationEnabled = setting?.value === 'true';
  const userCount = await countUsers();
  
  // Allow first user registration even if disabled (to create admin)
  if (!registrationEnabled && userCount > 0) {
    throw createError({
      statusCode: 403,
      message: 'Registration is currently disabled. Please contact an administrator.',
    });
  }

  const body = await readBody(event);
  const { username, email, password } = body;

  // Validate input
  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required',
    });
  }

  if (!isValidUsername(username)) {
    throw createError({
      statusCode: 400,
      message: 'Username must be 3-50 characters and contain only letters, numbers, and underscores',
    });
  }

  if (email && !isValidEmail(email)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid email format',
    });
  }

  if (!isValidPassword(password)) {
    throw createError({
      statusCode: 400,
      message: 'Password must be at least 8 characters long',
    });
  }

  // Check if username already exists
  if (await usernameExists(username)) {
    throw createError({
      statusCode: 409,
      message: 'Username already exists',
    });
  }

  // Check if email already exists (only if email provided)
  if (email && await emailExists(email)) {
    throw createError({
      statusCode: 409,
      message: 'Email already exists',
    });
  }

  // Determine role: first user becomes admin
  const role = userCount === 0 ? 'admin' : 'member';

  // Create user
  const user = await createUser({
    username,
    email,
    password,
    role,
  });

  // Add first user to Admins group automatically
  if (userCount === 0) {
    try {
      const adminGroup = await dbQueryOne<{ id: number }>(
        'SELECT id FROM groups WHERE name = $1',
        ['Admins']
      );
      if (adminGroup) {
        await dbQuery(
          'INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [user.id, adminGroup.id]
        );
      }
    } catch (error) {
      console.error('Failed to add first user to Admins group:', error);
    }
  }

  // Create session and set cookie
  const sessionId = await createSession(user.id);
  setSessionCookie(event, sessionId);

  // Send email notifications based on settings
  try {
    // Check notification settings
    const notifyUserSetting = await dbQueryOne<{ value: string }>(
      'SELECT value FROM settings WHERE key = $1',
      ['notify_user_creation']
    );
    const notifyAdminSetting = await dbQueryOne<{ value: string }>(
      'SELECT value FROM settings WHERE key = $1',
      ['notify_admin_registration']
    );

    // Send welcome email to user if enabled
    if (notifyUserSetting?.value === 'true') {
      if (user.email) {
        await sendWelcomeEmail(user.email, user.username);
      } else {
        console.log('User has no email, skipping welcome email');
      }
    }

    // Send notification to admins if enabled and not first user
    if (notifyAdminSetting?.value === 'true' && userCount > 0) {
      // Get all users in the Admins group
      const admins = await dbQuery<{ email: string }>(
        `SELECT DISTINCT u.email 
         FROM users u
         INNER JOIN user_groups ug ON u.id = ug.user_id
         INNER JOIN groups g ON ug.group_id = g.id
         WHERE g.name = 'Admins' AND u.email IS NOT NULL`,
        []
      );
      const adminEmails = admins.map(admin => admin.email).filter(Boolean);
      if (adminEmails.length > 0 && user.email) {
        await sendAdminNotificationEmail(adminEmails, user.username, user.email);
      }
    }
  } catch (emailError) {
    // Log email errors but don't fail the registration
    console.error('Failed to send email notifications:', emailError);
  }

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    message: userCount === 0 ? 'Admin account created successfully' : 'Account created successfully',
  };
});
