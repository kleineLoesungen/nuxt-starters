/**
 * Email Templates Registry
 * Central registry of all email types/templates in the application
 * 
 * HOW IT WORKS:
 * 1. Define email templates here with template functions
 * 2. Use sendEmailTemplate() from useEmail composable to send
 * 3. Email configuration check is handled automatically
 * 
 * BENEFITS:
 * - All email templates in one place
 * - Easy to maintain and update
 * - Type-safe email sending
 * - No need to check isEmailEnabled() manually
 */

export interface EmailTemplate {
  key: string;  // Unique identifier for the email type
  description: string;  // Human-readable description
  template: (data: any) => {
    subject: string;
    text: string;
    html: string;
  };
}

/**
 * All registered email templates in the application
 * Add new entries here when creating new email types
 */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ============================================
  // USER WELCOME EMAIL
  // ============================================
  {
    key: 'user.welcome',
    description: 'Welcome email sent to newly registered users',
    template: (data: { username: string; appName: string }) => ({
      subject: `Welcome to ${data.appName}!`,
      text: `Hi ${data.username},

Your account has been created successfully.

You can now log in with your username and password.

Best regards,
${data.appName} Team`,
      html: `
        <h2>Welcome to ${data.appName}!</h2>
        <p>Hi <strong>${data.username}</strong>,</p>
        <p>Your account has been created successfully.</p>
        <p>You can now log in with your username and password.</p>
        <p>Best regards,<br>${data.appName} Team</p>
      `,
    }),
  },

  // ============================================
  // ADMIN NOTIFICATION EMAIL
  // ============================================
  {
    key: 'admin.newUser',
    description: 'Notification to admins when a new user registers',
    template: (data: { username: string; email: string | null; appName: string }) => {
      const emailText = data.email || '(not provided)';
      return {
        subject: `New user registered on ${data.appName}`,
        text: `A new user has registered:

Username: ${data.username}
Email: ${emailText}

${data.appName} Admin`,
        html: `
          <h2>New User Registration</h2>
          <p>A new user has registered on ${data.appName}:</p>
          <ul>
            <li><strong>Username:</strong> ${data.username}</li>
            <li><strong>Email:</strong> ${emailText}</li>
          </ul>
          <p>${data.appName} Admin</p>
        `,
      };
    },
  },

  // ============================================
  // ADD MORE EMAIL TEMPLATES HERE
  // ============================================
  // Example:
  // {
  //   key: 'user.passwordReset',
  //   description: 'Password reset email with link',
  //   template: (data: { username: string; resetLink: string; appName: string }) => ({
  //     subject: `Password Reset - ${data.appName}`,
  //     text: `Hi ${data.username},\n\nClick here to reset your password: ${data.resetLink}`,
  //     html: `<p>Hi <strong>${data.username}</strong>,</p><p><a href="${data.resetLink}">Click here to reset your password</a></p>`,
  //   }),
  // },
];

/**
 * Get an email template by key
 */
export function getEmailTemplate(key: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.key === key);
}
