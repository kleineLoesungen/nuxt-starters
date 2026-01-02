import { defineEventHandler, readBody } from 'h3';
import { authenticateUser } from '../../composables/useUsers';
import { createSession, setSessionCookie } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required',
    });
  }

  // Authenticate user
  const user = await authenticateUser(username, password);
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  }

  // Create session
  const sessionId = await createSession(user.id);
  
  // Set session cookie
  setSessionCookie(event, sessionId);

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  };
});
