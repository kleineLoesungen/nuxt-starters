import { useDatabase } from './useDatabase';
import { hashPassword, verifyPassword } from '../utils/auth';
import type { User } from '../utils/session';

interface CreateUserData {
  username: string;
  email?: string | null;
  password: string;
}

interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData): Promise<User> {
  const db = await useDatabase();
  const hashedPassword = hashPassword(data.password);

  const user = await db.queryOne<User>(
    `INSERT INTO users (username, email, password, updated_at) 
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
     RETURNING id, username, email, created_at, updated_at`,
    [data.username, data.email, hashedPassword]
  );

  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
  const db = await useDatabase();
  return await db.queryOne<User>(
    'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const db = await useDatabase();
  return await db.queryOne<User>(
    'SELECT id, username, email, created_at, updated_at FROM users WHERE username = $1',
    [username]
  );
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await useDatabase();
  return await db.queryOne<User>(
    'SELECT id, username, email, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
}

/**
 * Authenticate user with username/email and password
 */
export async function authenticateUser(
  usernameOrEmail: string,
  password: string
): Promise<User | null> {
  const db = await useDatabase();
  
  // Check if input is email or username
  const isEmail = usernameOrEmail.includes('@');
  const field = isEmail ? 'email' : 'username';
  
  const result = await db.queryOne<User & { password: string }>(
    `SELECT id, username, email, password, created_at, updated_at 
     FROM users WHERE ${field} = $1`,
    [usernameOrEmail]
  );

  if (!result) {
    return null;
  }

  // Verify password
  const isValidPassword = verifyPassword(password, result.password);
  if (!isValidPassword) {
    return null;
  }

  // Return user without password
  const { password: _, ...user } = result;
  return user as User;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<User[]> {
  const db = await useDatabase();
  return await db.query<User>(
    'SELECT id, username, email, created_at, updated_at FROM users ORDER BY created_at DESC'
  );
}

/**
 * Update user
 */
export async function updateUser(id: number, data: UpdateUserData): Promise<User | null> {
  const db = await useDatabase();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.username !== undefined) {
    updates.push(`username = $${paramIndex++}`);
    values.push(data.username);
  }

  if (data.email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    values.push(data.email);
  }

  if (data.password !== undefined) {
    updates.push(`password = $${paramIndex++}`);
    values.push(hashPassword(data.password));
  }

  if (updates.length === 0) {
    return await getUserById(id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const user = await db.queryOne<User>(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} 
     RETURNING id, username, email, created_at, updated_at`,
    values
  );

  return user;
}

/**
 * Delete user
 */
export async function deleteUser(id: number): Promise<boolean> {
  const db = await useDatabase();
  const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
  return true;
}

/**
 * Count total users
 */
export async function countUsers(): Promise<number> {
  const db = await useDatabase();
  const result = await db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users');
  return result ? parseInt(result.count, 10) : 0;
}

/**
 * Check if username exists
 */
export async function usernameExists(username: string): Promise<boolean> {
  const db = await useDatabase();
  const result = await db.queryOne<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) as exists',
    [username]
  );
  return result?.exists || false;
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const db = await useDatabase();
  const result = await db.queryOne<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists',
    [email]
  );
  return result?.exists || false;
}
