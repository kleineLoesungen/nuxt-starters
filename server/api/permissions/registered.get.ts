import { defineEventHandler } from 'h3';
import { getRegisteredPermissions } from '../../utils/sync-permissions';

/**
 * GET /api/permissions/registered
 * Get all code-registered permissions
 */
export default defineEventHandler(async (event) => {
  const permissions = await getRegisteredPermissions();

  return {
    success: true,
    permissions,
  };
});
