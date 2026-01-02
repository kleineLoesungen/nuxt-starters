/**
 * Health Check Endpoint
 * 
 * Standard health check endpoint for monitoring and deployment platforms
 * Compatible with Coolify, Docker health checks, Kubernetes probes, etc.
 * 
 * Returns:
 * - 200 OK: All systems operational
 * - 503 Service Unavailable: Critical systems down
 * 
 * Response format follows RFC 7231 and health check API standards
 */

import { dbQuery } from '../composables/useDatabase';
import { isEmailConfigured } from '../composables/useEmail';

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  const checks: Record<string, any> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // 1. Database health check (critical)
  try {
    const dbStart = Date.now();
    await dbQuery('SELECT 1 as health_check');
    const dbDuration = Date.now() - dbStart;
    
    checks.database = {
      status: 'up',
      responseTime: `${dbDuration}ms`,
    };
  } catch (error: any) {
    checks.database = {
      status: 'down',
      error: error.message,
    };
    overallStatus = 'unhealthy';
  }

  // 2. Email service check (non-critical)
  try {
    const emailConfigured = isEmailConfigured();
    checks.email = {
      status: emailConfigured ? 'configured' : 'disabled',
      critical: false,
    };
  } catch (error: any) {
    checks.email = {
      status: 'error',
      error: error.message,
      critical: false,
    };
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
  }

  // 3. Application info
  const config = useRuntimeConfig();
  checks.application = {
    status: 'up',
    name: config.public.appName || 'Nuxt App',
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  };

  // 4. System resources (optional)
  checks.system = {
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    },
    pid: process.pid,
  };

  const responseTime = Date.now() - startTime;

  // Determine HTTP status code
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  // Set response status
  event.node.res.statusCode = statusCode;

  // Return health check response
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    checks,
  };
});
