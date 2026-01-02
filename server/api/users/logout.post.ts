import { defineEventHandler, getCookie } from 'h3';
import { deleteSession, clearSessionCookie } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'app_session');
  
  if (sessionId) {
    // Delete session from database
    await deleteSession(sessionId);
  }

  // Clear session cookie
  clearSessionCookie(event);

  return {
    success: true,
    message: 'Logged out successfully',
  };
});
