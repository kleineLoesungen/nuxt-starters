/**
 * List user's API tokens
 * GET /api/tokens/list
 */

import { getCurrentUser } from '../../utils/session';
import { useDatabase } from '../../composables/useDatabase';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  try {
    const db = await useDatabase();
    
    const result = await db.query(
      `SELECT id, name, last_used_at, created_at
       FROM api_tokens
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    return {
      success: true,
      tokens: result,
    };
  } catch (error: any) {
    console.error('Error listing API tokens:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to list tokens',
    });
  }
});
