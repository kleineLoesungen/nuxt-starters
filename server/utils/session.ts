import { H3Event, getCookie, setCookie, deleteCookie, getHeader } from 'h3';
import { useDatabase } from '../composables/useDatabase';
import { generateSessionId } from '../utils/auth';
import { loadUserPermissions } from '../composables/usePermissions';
import { hashToken } from '../utils/tokens';
import { checkRateLimit } from '../utils/rate-limit';

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithPermissions extends User {
  permissions: string[];
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: Date;
  created_at: Date;
}

const SESSION_COOKIE_NAME = 'app_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Create a new session for a user
 */
export async function createSession(userId: number): Promise<string> {
  const db = await useDatabase();
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.query(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
    [sessionId, userId, expiresAt]
  );

  return sessionId;
}

/**
 * Get session from database
 */
export async function getUserSession(sessionId: string): Promise<Session | null> {
  const db = await useDatabase();
  const session = await db.queryOne<Session>(
    'SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()',
    [sessionId]
  );

  return session;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = await useDatabase();
  await db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

/**
 * Delete all expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const db = await useDatabase();
  await db.query('DELETE FROM sessions WHERE expires_at <= NOW()');
}

/**
 * Get user by session ID
 */
export async function getUserBySession(sessionId: string): Promise<User | null> {
  const db = await useDatabase();
  const user = await db.queryOne<User>(
    `SELECT u.id, u.username, u.email, u.created_at, u.updated_at 
     FROM users u 
     INNER JOIN sessions s ON u.id = s.user_id 
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId]
  );

  return user;
}

/**
 * Get user by session ID with permissions
 */
export async function getUserBySessionWithPermissions(sessionId: string): Promise<UserWithPermissions | null> {
  const user = await getUserBySession(sessionId);
  
  if (!user) {
    return null;
  }

  const permissions = await loadUserPermissions(user.id);

  return {
    ...user,
    permissions,
  };
}

/**
 * Get user by API token
 */
export async function getUserByToken(token: string): Promise<User | null> {
  const db = await useDatabase();
  const tokenHash = hashToken(token);

  // Rate limit check
  if (!checkRateLimit(`token:${tokenHash}`)) {
    throw createError({
      statusCode: 429,
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  const result = await db.query<User & { token_id: number }>(
    `SELECT u.id, u.username, u.email, u.created_at, u.updated_at, t.id as token_id
     FROM users u
     JOIN api_tokens t ON t.user_id = u.id
     WHERE t.token_hash = $1`,
    [tokenHash]
  );

  if (result.length === 0) {
    return null;
  }

  const user = result[0];
  const tokenId = user.token_id;

  // Update last_used_at timestamp (fire and forget)
  db.query(
    `UPDATE api_tokens SET last_used_at = NOW() WHERE id = $1`,
    [tokenId]
  ).catch(err => console.error('Failed to update token last_used_at:', err));

  // Remove token_id from user object
  const { token_id, ...userWithoutTokenId } = user;

  return userWithoutTokenId;
}

/**
 * Get current user from request (supports both session and token auth)
 */
export async function getCurrentUser(event: H3Event): Promise<User | null> {
  // Try token authentication first
  const authHeader = getHeader(event, 'authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = await getUserByToken(token);
    if (user) {
      return user;
    }
  }

  // Fall back to session authentication
  const sessionId = getCookie(event, SESSION_COOKIE_NAME);
  if (!sessionId) {
    return null;
  }

  return await getUserBySession(sessionId);
}

/**
 * Alias for getCurrentUser (for logging convenience)
 */
export const getUserFromEvent = getCurrentUser;

/**
 * Get current user from request with permissions cached (supports both session and token auth)
 */
export async function getCurrentUserWithPermissions(event: H3Event): Promise<UserWithPermissions | null> {
  // Try token authentication first
  const authHeader = getHeader(event, 'authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = await getUserByToken(token);
    if (user) {
      const permissions = await loadUserPermissions(user.id);
      return { ...user, permissions };
    }
  }

  // Fall back to session authentication
  const sessionId = getCookie(event, SESSION_COOKIE_NAME);
  if (!sessionId) {
    return null;
  }

  return await getUserBySessionWithPermissions(sessionId);
}

/**
 * Set session cookie
 */
export function setSessionCookie(event: H3Event, sessionId: string): void {
  setCookie(event, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE_NAME);
}

/**
 * Require authentication middleware
 */
export async function requireAuth(event: H3Event): Promise<User> {
  const user = await getCurrentUser(event);
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    });
  }

  return user;
}

/**
 * Require permission middleware
 * Checks if user has access to a specific resource
 */
export async function requirePermission(event: H3Event, resource: string): Promise<UserWithPermissions> {
  const user = await getCurrentUserWithPermissions(event);
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    });
  }

  // Import checkPermission here to avoid circular dependency
  const { checkPermission } = await import('../composables/usePermissions');
  
  if (!checkPermission(user.permissions, resource)) {
    throw createError({
      statusCode: 403,
      message: 'Permission denied',
    });
  }

  return user;
}
