import { dbQuery } from '../composables/useDatabase';
import { isEmailConfigured } from '../composables/useEmail';

/**
 * GET /api/settings
 * Get public application settings
 */
export default defineEventHandler(async (event) => {
  try {
    // Get all settings
    const settings = await dbQuery<{ key: string; value: string }>(
      'SELECT key, value FROM settings WHERE key IN ($1, $2, $3)',
      ['registration_enabled', 'notify_user_creation', 'notify_admin_registration']
    );

    // Convert to object
    const settingsObj: any = {};
    settings.forEach(setting => {
      if (setting.key === 'registration_enabled') {
        settingsObj.registrationEnabled = setting.value === 'true';
      } else if (setting.key === 'notify_user_creation') {
        settingsObj.notifyUserCreation = setting.value === 'true';
      } else if (setting.key === 'notify_admin_registration') {
        settingsObj.notifyAdminRegistration = setting.value === 'true';
      }
    });

    // Add email configuration status
    settingsObj.emailConfigured = isEmailConfigured();

    return {
      success: true,
      settings: settingsObj,
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      success: false,
      error: 'Failed to fetch settings',
    };
  }
});
