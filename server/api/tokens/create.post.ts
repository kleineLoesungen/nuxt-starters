/**
 * Create a new API token
 * POST /api/tokens/create
 */

import { getCurrentUser } from '../../utils/session';
import { generateToken, hashToken } from '../../utils/tokens';
import { useDatabase } from '../../composables/useDatabase';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  const body = await readBody(event);
  const { name } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Token name is required',
    });
  }

  if (name.length > 100) {
    throw createError({
      statusCode: 400,
      message: 'Token name must be 100 characters or less',
    });
  }

  try {
    const db = await useDatabase();
    
    // Generate token and hash it
    const token = generateToken();
    const tokenHash = hashToken(token);

    // Store hashed token in database
    const result = await db.query(
      `INSERT INTO api_tokens (user_id, token_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, name, created_at`,
      [user.id, tokenHash, name.trim()]
    );

    if (!result || result.length === 0) {
      console.error('Insert query returned no rows');
      throw new Error('Failed to create token - no rows returned');
    }

    const tokenRecord = result[0];

    // Log token creation
    const { logActivity } = await import('../../utils/logger');
    logActivity('token.created', {
      tokenId: tokenRecord.id,
      tokenName: name.trim(),
      userId: user.id,
      username: user.username,
    });

    // Return the plaintext token (only time it will be shown) and metadata
    return {
      success: true,
      token, // Only shown once!
      id: tokenRecord.id,
      name: tokenRecord.name,
      created_at: tokenRecord.created_at,
    };
  } catch (error: any) {
    console.error('Error creating API token:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to create token',
    });
  }
});
