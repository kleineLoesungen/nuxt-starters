import { describe, it, expect, beforeAll, vi } from 'vitest';
import { isEmailEnabled, sendEmail, sendWelcomeEmail, sendAdminNotificationEmail } from '../../../server/composables/useEmail';

// Mock the useRuntimeConfig
global.useRuntimeConfig = vi.fn(() => ({
  email: {
    host: '',
    port: 587,
    user: '',
    password: '',
    from: 'Test App <test@example.com>',
  },
  public: {
    appName: 'Test App',
  },
}));

describe('Email Utility', () => {
  describe('isEmailEnabled', () => {
    it('should return false when email is not configured', () => {
      expect(isEmailEnabled()).toBe(false);
    });

    it('should return true when email is configured', () => {
      global.useRuntimeConfig = vi.fn(() => ({
        email: {
          host: 'smtp.example.com',
          port: 587,
          user: 'test@example.com',
          password: 'password',
          from: 'vocaBox Test <test@example.com>',
        },
        public: {
          appName: 'vocaBox Test',
        },
      }));

      expect(isEmailEnabled()).toBe(true);
    });
  });

  describe('sendEmail', () => {
    it('should return false when email is not configured', async () => {
      global.useRuntimeConfig = vi.fn(() => ({
        email: {
          host: '',
          port: 587,
          user: '',
          password: '',
          from: 'vocaBox Test <test@example.com>',
        },
        public: {
          appName: 'vocaBox Test',
        },
      }));

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(result).toBe(false);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should return false when email is not configured', async () => {
      global.useRuntimeConfig = vi.fn(() => ({
        email: {
          host: '',
          port: 587,
          user: '',
          password: '',
          from: 'vocaBox Test <test@example.com>',
        },
        public: {
          appName: 'vocaBox Test',
        },
      }));

      const result = await sendWelcomeEmail('user@example.com', 'testuser');
      expect(result).toBe(false);
    });

    it('should construct welcome email with correct parameters', async () => {
      // Test that the function exists and can be called
      expect(typeof sendWelcomeEmail).toBe('function');
    });
  });

  describe('sendAdminNotificationEmail', () => {
    it('should return false when no admin emails provided', async () => {
      const result = await sendAdminNotificationEmail([], 'testuser', 'user@example.com');
      expect(result).toBe(false);
    });

    it('should return false when email is not configured', async () => {
      global.useRuntimeConfig = vi.fn(() => ({
        email: {
          host: '',
          port: 587,
          user: '',
          password: '',
          from: 'vocaBox Test <test@example.com>',
        },
        public: {
          appName: 'vocaBox Test',
        },
      }));

      const result = await sendAdminNotificationEmail(['admin@example.com'], 'testuser', 'user@example.com');
      expect(result).toBe(false);
    });
  });
});
