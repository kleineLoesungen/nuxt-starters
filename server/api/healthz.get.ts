/**
 * Simple Liveness Check Endpoint
 * 
 * Minimal health check for container orchestration platforms
 * Used by Coolify, Docker, Kubernetes for basic liveness probes
 * 
 * Returns:
 * - 200 OK: Application is alive
 * 
 * This endpoint is very lightweight and doesn't check external dependencies
 * For detailed health checks, use /api/health instead
 */

export default defineEventHandler(async (event) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
});
