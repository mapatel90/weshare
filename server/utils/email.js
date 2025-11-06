import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch SMTP settings from database
 * @returns {Promise<Object>} SMTP configuration object
 */
const getSmtpSettings = async () => {
  try {
    const smtpKeys = [
      'smtp_email',
      'smtp_email_from_address',
      'smtp_email_from_name',
      'smtp_email_host',
      'smtp_email_user',
      'smtp_email_password',
      'smtp_email_port',
    ];

    const settings = await prisma.setting.findMany({
      where: { key: { in: smtpKeys } }
    });

    // Convert array to object
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return settingsObj;
  } catch (error) {
    console.error('Error fetching SMTP settings from database:', error);
    throw new Error('Failed to fetch SMTP settings');
  }
};

/**
 * Create email transporter using database settings or environment variables
 * @param {Object} customSettings - Optional custom SMTP settings to override database/env
 * @returns {Promise<nodemailer.Transporter>} Configured nodemailer transporter
 */
const createTransporter = async (customSettings = null) => {
  try {
    let smtpConfig;

    if (customSettings) {
      // Use custom settings if provided
      smtpConfig = customSettings;
    } else {
      // Try to get settings from database first
      try {
        const dbSettings = await getSmtpSettings();

        if (dbSettings.smtp_email_host && dbSettings.smtp_email_user && dbSettings.smtp_email_password) {
          const port = Number(dbSettings.smtp_email_port) || 587;
          const secure = port === 465 || (dbSettings.smtp_secure || '').toUpperCase() === 'SSL';

          smtpConfig = {
            host: dbSettings.smtp_email_host,
            port: port,
            secure: secure,
            auth: {
              user: dbSettings.smtp_email_user,
              pass: dbSettings.smtp_email_password,
            },
            from: dbSettings.smtp_email_from_name
              ? `${dbSettings.smtp_email_from_name} <${dbSettings.smtp_email_from_address || dbSettings.smtp_email_user}>`
              : dbSettings.smtp_email_from_address || dbSettings.smtp_email_user
          };
        }
      } catch (dbError) {
        console.warn('Could not fetch SMTP settings from database, falling back to environment variables');
      }
    }

    // Fallback to environment variables if database settings not available
    if (!smtpConfig) {
      smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: (process.env.SMTP_PORT || '587') === '465' || process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        from: process.env.SMTP_FROM_NAME
          ? `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM || process.env.SMTP_USER}>`
          : (process.env.SMTP_FROM || process.env.SMTP_USER)
      };
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    });

    return { transporter, from: smtpConfig.from };
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw new Error('Failed to create email transporter');
  }
};

/**
 * Generic email sending function
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {Object} options.customSmtp - Custom SMTP settings (optional)
 * @returns {Promise<Object>} Result object with success status
 */
export const sendEmail = async ({ to, subject, html, text, customSmtp = null }) => {
  try {
    const { transporter, from } = await createTransporter(customSmtp);

    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      html: html,
    };

    if (text) {
      mailOptions.text = text;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #F6A623 0%, #e09620 100%);
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: #ffffff;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #333;
              margin-top: 0;
            }
            .content p {
              margin: 15px 0;
              color: #666;
            }
            .button {
              display: inline-block;
              padding: 14px 40px;
              margin: 25px 0;
              background: #F6A623;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              text-align: center;
            }
            .button:hover {
              background: #e09620;
            }
            .footer {
              background: #f8f8f8;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
            }
            .warning p {
              margin: 0;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello,</h2>
              <p>We received a request to reset your password for your WeShare account.</p>
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <div class="warning">
                <p><strong>⏰ Important:</strong> This link will expire in 1 hour for security reasons.</p>
              </div>
              
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              
              <p style="margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
              // <p style="word-break: break-all; color: #2386FF; font-size: 12px;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} WeShare. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Plain text version
    const textContent = `
        Password Reset Request

        Hello,

        We received a request to reset your password for your WeShare account.

        Click the link below to reset your password:
        ${resetUrl}

        ⏰ Important: This link will expire in 1 hour for security reasons.

        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

        © ${new Date().getFullYear()} WeShare. All rights reserved.
    `;

    const result = await sendEmail({
      to: email,
      subject: 'Reset Your Password - WeShare',
      html: htmlContent,
      text: textContent,
    });

    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset confirmation email
export const sendPasswordResetConfirmationEmail = async (email) => {
  try {

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #28a745 0%, #218838 100%);
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: #ffffff;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .success-icon {
              text-align: center;
              font-size: 64px;
              margin: 20px 0;
            }
            .footer {
              background: #f8f8f8;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Reset Successful</h1>
            </div>
            <div class="content">
              <div class="success-icon">✓</div>
              <h2 style="text-align: center;">Your password has been changed!</h2>
              <p>Your WeShare account password has been successfully reset.</p>
              <p>You can now log in with your new password.</p>
              <p style="margin-top: 30px;"><strong>If you didn't make this change,</strong> please contact our support team immediately.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} WeShare. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail({
      to: email,
      subject: 'Password Reset Successful - WeShare',
      html: htmlContent,
    });

    return result;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new user
 * @param {string} email - User email
 * @param {string} fullName - User full name
 * @returns {Promise<Object>} Result object
 */
export const sendWelcomeEmail = async (email, fullName) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to WeShare</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #F6A623 0%, #e09620 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
          }
          .content {
            padding: 40px 30px;
          }
          .footer {
            background: #f8f8f8;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to WeShare!</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName},</h2>
            <p>Welcome to WeShare! We're excited to have you on board.</p>
            <p>Your account has been successfully created and you can now start using all our features.</p>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WeShare. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to WeShare',
    html: htmlContent,
    text: `Hello ${fullName},\n\nWelcome to WeShare! We're excited to have you on board.\n\nYour account has been successfully created and you can now start using all our features.`
  });
};

/**
 * Send notification email
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @returns {Promise<Object>} Result object
 */
export const sendNotificationEmail = async (email, subject, message) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #2386FF 0%, #1a6fd9 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
          }
          .content {
            padding: 40px 30px;
          }
          .footer {
            background: #f8f8f8;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 ${subject}</h1>
          </div>
          <div class="content">
            ${message}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WeShare. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: subject,
    html: htmlContent,
    text: message.replace(/<[^>]*>/g, '') // Strip HTML tags for plain text
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  getSmtpSettings,
  createTransporter,
};
