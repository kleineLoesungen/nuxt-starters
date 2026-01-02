import { dbQuery, dbQueryOne, dbTransaction } from '../composables/useDatabase';

/**
 * Example API route demonstrating database usage
 * GET /api/users
 */
export default defineEventHandler(async (event) => {
  try {
    // Example: Fetch all users
    const users = await dbQuery('SELECT * FROM users LIMIT 10');

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: 'Failed to fetch users',
    };
  }
});
