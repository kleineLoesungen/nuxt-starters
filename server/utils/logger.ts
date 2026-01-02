import { createConsola } from 'consola';
import { createStream } from 'rotating-file-stream';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

/**
 * Application Logger
 * Uses consola with file rotation
 * Logs are kept for 14 days
 */

// Create logs directory if it doesn't exist
const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Create rotating file stream
// Files are rotated daily and kept for 14 days
const stream = createStream('app.log', {
  interval: '1d', // Rotate daily
  maxFiles: 14, // Keep 14 days
  path: logsDir,
  compress: 'gzip', // Compress old logs
});

// Create consola instance
const logger = createConsola({
  level: process.env.NODE_ENV === 'production' ? 3 : 4, // info in prod, debug in dev
  reporters: [
    {
      log: (logObj: any) => {
        const timestamp = new Date().toISOString();
        const level = logObj.type.toUpperCase();
        const message = typeof logObj.args[0] === 'string' 
          ? logObj.args[0] 
          : JSON.stringify(logObj.args[0]);
        
        // Additional data if provided
        const extra = logObj.args.slice(1).map((arg: any) => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        const logLine = `[${timestamp}] ${level}: ${message}${extra ? ' ' + extra : ''}\n`;
        stream.write(logLine);
      },
    },
  ],
});

/**
 * Log an activity with structured data
 * @param activity - Type of activity (e.g., 'email.sent', 'user.created')
 * @param data - Additional structured data
 */
export function logActivity(activity: string, data?: Record<string, any>) {
  const logData = {
    activity,
    timestamp: new Date().toISOString(),
    ...data,
  };
  logger.info(JSON.stringify(logData));
}

/**
 * Log email sent event
 */
export function logEmailSent(to: string | string[], subject: string, template?: string) {
  logActivity('email.sent', {
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    template,
  });
}

/**
 * Log user-related events
 */
export function logUserEvent(action: 'created' | 'deleted' | 'updated' | 'password_reset', userId: number, username: string, by?: string) {
  logActivity(`user.${action}`, {
    userId,
    username,
    by: by || 'system',
  });
}

/**
 * Log group-related events
 */
export function logGroupEvent(
  action: 'created' | 'updated' | 'deleted' | 'member_added' | 'member_removed',
  groupId: number,
  groupName: string,
  by: string,
  extra?: Record<string, any>
) {
  logActivity(`group.${action}`, {
    groupId,
    groupName,
    by,
    ...extra,
  });
}

/**
 * Log permission-related events
 */
export function logPermissionEvent(
  action: 'added' | 'removed',
  groupId: number,
  groupName: string,
  permission: string,
  by: string
) {
  logActivity(`permission.${action}`, {
    groupId,
    groupName,
    permission,
    by,
  });
}

/**
 * Log settings change events
 */
export function logSettingsEvent(setting: string, oldValue: any, newValue: any, by: string) {
  logActivity('settings.changed', {
    setting,
    oldValue,
    newValue,
    by,
  });
}

export default logger;
