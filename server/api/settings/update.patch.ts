import { dbQuery, dbQueryOne } from '../../composables/useDatabase';
import { requirePermission } from '../../utils/session';
import { logSettingsEvent } from '../../utils/logger';

/**
 * PATCH /api/settings/update
 * Update application settings (admin only)
 */
export default defineEventHandler(async (event) => {
  // Require admin authentication
  const user = await requirePermission(event, 'admin.manage');
  if (!user) {
    throw createError({
      statusCode: 403,
      message: 'Admin access required',
    });
  }

  const body = await readBody(event);
  const { registrationEnabled, notifyUserCreation, notifyAdminRegistration } = body;

  try {
    // Get old values for logging
    const oldValues = await dbQuery<{ key: string; value: string }>(
      'SELECT key, value FROM settings WHERE key IN ($1, $2, $3)',
      ['registration_enabled', 'notify_user_creation', 'notify_admin_registration']
    );
    const oldValuesMap = new Map(oldValues.map(row => [row.key, row.value === 'true']));

    // Update settings that were provided
    if (typeof registrationEnabled === 'boolean') {
      const oldValue = oldValuesMap.get('registration_enabled');
      await dbQuery(
        'UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
        [registrationEnabled.toString(), 'registration_enabled']
      );
      if (oldValue !== registrationEnabled) {
        logSettingsEvent('registration_enabled', oldValue, registrationEnabled, user.username);
      }
    }

    if (typeof notifyUserCreation === 'boolean') {
      const oldValue = oldValuesMap.get('notify_user_creation');
      await dbQuery(
        'UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
        [notifyUserCreation.toString(), 'notify_user_creation']
      );
      if (oldValue !== notifyUserCreation) {
        logSettingsEvent('notify_user_creation', oldValue, notifyUserCreation, user.username);
      }
    }

    if (typeof notifyAdminRegistration === 'boolean') {
      const oldValue = oldValuesMap.get('notify_admin_registration');
      await dbQuery(
        'UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
        [notifyAdminRegistration.toString(), 'notify_admin_registration']
      );
      if (oldValue !== notifyAdminRegistration) {
        logSettingsEvent('notify_admin_registration', oldValue, notifyAdminRegistration, user.username);
      }
    }

    return {
      success: true,
      message: 'Settings updated successfully',
    };
  } catch (error) {
    console.error('Error updating settings:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to update settings',
    });
  }
});
