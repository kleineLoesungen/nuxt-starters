/**
 * Readiness Check Endpoint
 * 
 * Checks if application is ready to accept traffic
 * Used by load balancers and orchestration platforms
 * 
 * Returns:
 * - 200 OK: Ready to accept requests
 * - 503 Service Unavailable: Not ready (dependencies down)
 */

import { dbQuery } from '../composables/useDatabase';

export default defineEventHandler(async (event) => {
  try {
    // Check critical dependencies only
    await dbQuery('SELECT 1');
    
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    event.node.res.statusCode = 503;
    return {
      status: 'not_ready',
      reason: 'Database unavailable',
      timestamp: new Date().toISOString(),
    };
  }
});
