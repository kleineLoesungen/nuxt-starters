import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getEmailTemplate } from '../config/emails';
import { logEmailSent } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

let transporter: Transporter | null = null;

/**
 * Check if email is configured and enabled
 * Use this to conditionally show email-related features in UI
 */
export function isEmailConfigured(): boolean {
  const config = useRuntimeConfig();
  return !!(config.email.host && config.email.user);
}

/**
 * Alias for isEmailConfigured (for backward compatibility)
 */
export const isEmailEnabled = isEmailConfigured;

/**
 * Get or create email transporter
 * Returns null if email is not configured
 */
function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) {
    return null;
  }

  const config = useRuntimeConfig();

  // Create transporter if it doesn't exist
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  return transporter;
}

/**
 * Send an email with automatic configuration check
 * Returns true if sent successfully, false if email is not configured
 * Throws error if sending fails
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = getTransporter();
  
  // Email not configured, skip silently
  if (!transporter) {
    console.log('Email not configured, skipping email to:', options.to);
    return false;
  }

  const config = useRuntimeConfig();

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    // Log email sent
    logEmailSent(options.to, options.subject);
    console.log('Email sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send an email using a registered template
 * Automatically checks if email is configured
 * 
 * @param to - Recipient email address(es)
 * @param templateKey - Key from EMAIL_TEMPLATES registry
 * @param data - Data to pass to the template function
 * @returns true if sent, false if email not configured
 * 
 * @example
 * await sendEmailTemplate('user@example.com', 'user.welcome', { 
 *   username: 'john', 
 *   appName: config.public.appName 
 * });
 */
export async function sendEmailTemplate(
  to: string | string[],
  templateKey: string,
  data: any
): Promise<boolean> {
  const template = getEmailTemplate(templateKey);
  
  if (!template) {
    console.error(`Email template not found: ${templateKey}`);
    return false;
  }

  const { subject, text, html } = template.template(data);
  const recipient = Array.isArray(to) ? to.join(', ') : to;

  return sendEmail({
    to: recipient,
    subject,
    text,
    html,
  });
}

/**
 * Send welcome email to new user
 * @deprecated Use sendEmailTemplate('email', 'user.welcome', data) instead
 */
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  const config = useRuntimeConfig();
  return sendEmailTemplate(email, 'user.welcome', {
    username,
    appName: config.public.appName,
  });
}

/**
 * Send notification to admins about new user registration
 * @deprecated Use sendEmailTemplate(emails, 'admin.newUser', data) instead
 */
export async function sendAdminNotificationEmail(adminEmails: string[], username: string, email: string | null): Promise<boolean> {
  if (adminEmails.length === 0) {
    return false;
  }

  const config = useRuntimeConfig();
  return sendEmailTemplate(adminEmails, 'admin.newUser', {
    username,
    email,
    appName: config.public.appName,
  });
}
