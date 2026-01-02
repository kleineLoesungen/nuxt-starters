import { defineEventHandler, getQuery } from 'h3';
import { requirePermission } from '../utils/session';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * GET /api/logs
 * Get application logs (admin only)
 * 
 * Query parameters:
 * - search: Optional text to search for in logs
 * - limit: Number of log entries to return (default: 100, max: 1000)
 * - offset: Number of entries to skip (default: 0)
 */
export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requirePermission(event, 'admin.manage');

  const query = getQuery(event);
  const searchText = (query.search as string)?.toLowerCase() || '';
  const limit = Math.min(parseInt(query.limit as string) || 100, 1000);
  const offset = parseInt(query.offset as string) || 0;

  try {
    const logsDir = join(process.cwd(), 'logs');
    
    // Check if logs directory exists
    try {
      await fs.access(logsDir);
    } catch {
      return {
        success: true,
        logs: [],
        total: 0,
        message: 'No logs available yet',
      };
    }

    // Read all log files (sorted by date, newest first)
    const files = await fs.readdir(logsDir);
    const logFiles = files
      .filter(f => f.endsWith('.log') || f.endsWith('.log.gz'))
      .sort()
      .reverse();

    const allLogs: any[] = [];

    // Read each log file
    for (const file of logFiles) {
      // Skip gzipped files for now (can add zlib support later if needed)
      if (file.endsWith('.gz')) continue;

      const filePath = join(logsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          // Parse log line format: [timestamp] LEVEL: {"activity":"type","timestamp":"ISO","data":{...}}
          const match = line.match(/\[(.*?)\] (\w+): (.+)/);
          if (!match) continue;

          const [, timestamp, level, jsonStr] = match;
          const logData = JSON.parse(jsonStr);

          // Apply search filter
          if (searchText) {
            const lineStr = JSON.stringify(logData).toLowerCase();
            if (!lineStr.includes(searchText)) continue;
          }

          // Extract data: everything except activity and timestamp
          const { activity, timestamp: logTimestamp, ...data } = logData;

          allLogs.push({
            timestamp: logTimestamp || timestamp,
            level,
            activity,
            data,
          });
        } catch (parseError) {
          // Skip invalid log lines
          console.error('Failed to parse log line:', parseError);
        }
      }
    }

    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const total = allLogs.length;
    const paginatedLogs = allLogs.slice(offset, offset + limit);

    return {
      success: true,
      logs: paginatedLogs,
      total,
      limit,
      offset,
    };
  } catch (error) {
    console.error('Error reading logs:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to read logs',
    });
  }
});
