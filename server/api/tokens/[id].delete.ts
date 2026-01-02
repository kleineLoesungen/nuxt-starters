/**
 * Delete an API token
 * DELETE /api/tokens/[id]
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

  const tokenId = getRouterParam(event, 'id');
  if (!tokenId || isNaN(Number(tokenId))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid token ID',
    });
  }

  try {
    const db = await useDatabase();
    
    // Get token info before deleting (for logging)
    const tokenResult = await db.query(
      `SELECT id, name FROM api_tokens WHERE id = $1 AND user_id = $2`,
      [tokenId, user.id]
    );

    if (tokenResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Token not found or does not belong to you',
      });
    }

    const tokenInfo = tokenResult[0];

    // Delete the token
    await db.query(
      `DELETE FROM api_tokens WHERE id = $1 AND user_id = $2`,
      [tokenId, user.id]
    );

    // Log token deletion
    const { logActivity } = await import('../../utils/logger');
    logActivity('token.deleted', {
      tokenId: tokenInfo.id,
      tokenName: tokenInfo.name,
      userId: user.id,
      username: user.username,
    });

    return {
      success: true,
      message: 'Token deleted successfully',
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    
    console.error('Error deleting API token:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to delete token',
    });
  }
});
