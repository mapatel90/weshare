import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * Replace placeholders in email template with actual values
 * @param {string} template - Template string with placeholders
 * @param {Object} values - Object with actual values
 * @returns {string} - Template with replaced values
 */
export const replacePlaceholders = (template, values = {}) => {
  if (!template) return "";
  
  let result = template;
  Object.entries(values).forEach(([key, value]) => {
    const placeholder = `[${key}]`;
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, value || "");
  });
  
  return result;
};

/**
 * Fetch common email settings from database and build template data
 * This centralizes fetching of common merge fields like company info, support details, etc.
 * @param {Object} customData - Custom data to merge with settings (optional)
 * @returns {Promise<Object>} Complete template data object with all merge fields
 */
export const getEmailTemplateData = async (customData = {}) => {
  try {
    // Define all settings keys needed for email templates
    const settingsKeys = [
      'site_name',
      'site_image',
      'site_email',
      'site_phone',
      'site_address',
      'site_city',
      'site_state',
      'site_country'
    ];

    // Fetch all settings from database
    const settings = await prisma.settings.findMany({
      where: { key: { in: settingsKeys } }
    });

    // Convert array to object
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    // Helper function to build full image URL
    const buildImageUrl = (imagePath) => {
      console.log('🔍 buildImageUrl - Input imagePath:', imagePath);
      console.log('🔍 buildImageUrl - UPLOAD_URL:', process.env.NEXT_PUBLIC_UPLOAD_URL);

      if (!imagePath) {
        console.log('⚠️ No imagePath, returning UPLOAD_URL');
        return process.env.NEXT_PUBLIC_UPLOAD_URL || '';
      }

      // If already a full URL (starts with http:// or https://), return as-is
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.log('✅ Full URL detected, returning as-is:', imagePath);
        return imagePath;
      }

      // Otherwise, prepend UPLOAD_URL to the S3 key
      const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_URL || '';
      // Remove leading slash from imagePath if exists to avoid double slashes
      const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      const finalUrl = baseUrl + cleanPath;

      console.log('✅ Built final URL:', finalUrl);
      return finalUrl;
    };

    // Build complete template data with common fields
    const templateData = {
      // Company information
      company_name: settingsObj.site_name || 'WeShare Energy',
      company_logo: buildImageUrl(settingsObj.site_image),

      // Support information
      support_email: settingsObj.site_email || 'support@weshare.com',
      support_phone: settingsObj.site_phone || '',
      
      // URLs
      site_url: settingsObj.site_url || process.env.FRONTEND_URL || 'http://localhost:3000',
      privacy_policy_url: settingsObj.privacy_policy_url || `${settingsObj.site_url || process.env.FRONTEND_URL}/privacy`,
      terms_of_service_url: settingsObj.terms_of_service_url || `${settingsObj.site_url || process.env.FRONTEND_URL}/terms`,

      // Dynamic fields
      current_date: new Date().getFullYear().toString(),

      // Merge with custom data (custom data takes precedence)
      ...customData
    };

    return templateData;
  } catch (error) {
    console.error('Error fetching email template data:', error);
    // Return defaults with custom data if database fetch fails
    return {
      company_name: 'WeShare Energy',
      company_logo: process.env.UPLOAD_URL || '',
      support_email: 'support@weshare.com',
      support_phone: '',
      support_hours: 'Mon–Fri, 9am–6pm GMT',
      site_url: process.env.FRONTEND_URL || 'http://localhost:3000',
      privacy_policy_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy`,
      terms_of_service_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/terms`,
      current_date: new Date().getFullYear().toString(),
      ...customData
    };
  }
};

/**
 * Send email using template from database
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.templateSlug - Template slug to fetch from database
 * @param {Object} options.templateData - Data to replace in template
 * @param {string} options.language - Language (en or vi), defaults to en
 * @param {Array} options.attachments - Array of attachments (optional)
 * @param {boolean} options.autoFetchSettings - Auto-fetch settings from database (default: true)
 * @returns {Promise<Object>} Result with success status
 */
export const sendEmailUsingTemplate = async ({ to, templateSlug, templateData = {}, language = 'en', attachments = null, autoFetchSettings = true }) => {
  try {
    // Automatically fetch settings and merge with custom templateData
    const completeTemplateData = autoFetchSettings
      ? await getEmailTemplateData(templateData)
      : templateData;

    // Fetch template from database
    const template = await prisma.email_template.findFirst({
      where: { slug: templateSlug }
    });

    if (!template) {
      console.error(`Email template not found: ${templateSlug}`);
      return { success: false, error: 'Template not found' };
    }

    // Get content based on language
    const contentField = language === 'vi' ? 'content_vi' : 'content_en';

    const rawContent = replacePlaceholders(template[contentField] || template.content_en, completeTemplateData);

    // const content = template[contentField] || template.content_en;
    const subject = replacePlaceholders(template.subject, completeTemplateData);
    // const html = replacePlaceholders(content, templateData);

    const finalHtml = await buildEmailLayout({
      bodyContent: rawContent,
      templateData: completeTemplateData,
      language
    });

    console.log("finalHtml", finalHtml);

    // Send email
    return await sendEmail({
      to,
      subject,
      html: finalHtml,
      attachments,
    });
  } catch (error) {
    console.error('Error sending templated email:', error);
    return { success: false, error: error.message };
  }
};

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

    const settings = await prisma.settings.findMany({
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

    console.log("smtpConfig", smtpConfig);

    if (customSettings) {
      // Use custom settings if provided
      smtpConfig = customSettings;
      console.log("customSettings", customSettings);
    } else {
      // Try to get settings from database first
      try {
        const dbSettings = await getSmtpSettings();

        console.log("dbSettings", dbSettings);

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
 * @param {Array} options.attachments - Array of attachments (optional)
 * @param {Object} options.customSmtp - Custom SMTP settings (optional)
 * @returns {Promise<Object>} Result object with success status
 */
export const sendEmail = async ({ to, subject, html, text, attachments = null, customSmtp = null }) => {
  try {
    const { transporter, from } = await createTransporter(customSmtp);

    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments || [],
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

export const buildEmailLayout = async ({ bodyContent, templateData, language = 'en' }) => {
  try {
    // Read header/footer template files based on language
    const templatesDir = path.join(__dirname, '../templates/email');
    const headerFile = language === 'vi' ? 'header-vi.html' : 'header-en.html';
    const footerFile = language === 'vi' ? 'footer-vi.html' : 'footer-en.html';

    let headerHtml = '';
    try {
      const headerTemplate = await fs.readFile(path.join(templatesDir, headerFile), 'utf-8');
      headerHtml = replacePlaceholders(headerTemplate, templateData);
    } catch (error) {
      console.warn(`Could not read header template: ${headerFile}`, error);
    }

    let footerHtml = '';
    try {
      const footerTemplate = await fs.readFile(path.join(templatesDir, footerFile), 'utf-8');
      footerHtml = replacePlaceholders(footerTemplate, templateData);
    } catch (error) {
      console.warn(`Could not read footer template: ${footerFile}`, error);
    }

    // If templates loaded successfully, concatenate header + body + footer
    if (headerHtml && footerHtml) {
      return headerHtml + bodyContent + footerHtml;
    } else {

      // Fallback to simple layout if template reading fails
      return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${templateData.company_name || 'Email'}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:30px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:35px 30px; color:#333333; font-size:15px; line-height:1.7;">
                    ${bodyContent}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`;
    }
  } catch (error) {
    console.error('Error building email layout:', error);
    // Fallback to simple layout if template reading fails
    return `<!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:#f4f6f8;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:30px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:35px 30px;">
            <tr><td>${bodyContent}</td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;
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
              <p style="word-break: break-all; color: #2386FF; font-size: 12px;">${resetUrl}</p>
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
 * Send email verification email
 * @param {string} email - User email
 * @param {string} fullName - User full name
 * @param {string} verificationToken - Verification token
 * @returns {Promise<Object>} Result object
 */
export const sendEmailVerificationEmail = async (email, fullName, verificationToken) => {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Verify Your Email Address</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName},</h2>
            <p>Thank you for registering with WeShare Energy! To complete your registration, please verify your email address.</p>

            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>

            <div class="warning">
              <p><strong>⏰ Important:</strong> This verification link will expire in 24 hours.</p>
            </div>

            <p>If you didn't create an account with us, please ignore this email.</p>

            <p style="margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2386FF; font-size: 12px;">${verificationUrl}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WeShare Energy. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
    Verify Your Email Address

    Hello ${fullName},

    Thank you for registering with WeShare Energy! To complete your registration, please verify your email address.

    Click the link below to verify your email:
    ${verificationUrl}

    ⏰ Important: This verification link will expire in 24 hours.

    If you didn't create an account with us, please ignore this email.

    © ${new Date().getFullYear()} WeShare Energy. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address - WeShare Energy',
    html: htmlContent,
    text: textContent,
  });
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

/**
 * Send invoice email
 * @param {Object} invoice - Invoice details
 * @param {Object} user - User details
 * @returns {Promise<Object>} Result object
 */
export const sendInvoiceEmail = async (invoice, user) => {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const viewInvoiceUrl = `${appUrl}/offtaker/invoices/${invoice.id}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoice_number}</title>
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
          .invoice-details {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .invoice-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .invoice-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
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
            <h1>🧾 New Invoice</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.full_name || user.name},</h2>
            <p>A new invoice has been generated for your account.</p>

            <div class="invoice-details">
              <div class="invoice-row">
                <span>Invoice Number:</span>
                <span><strong>${invoice.invoice_number}</strong></span>
              </div>
              <div class="invoice-row">
                <span>Invoice Date:</span>
                <span>${new Date(invoice.invoice_date).toLocaleDateString()}</span>
              </div>
              <div class="invoice-row">
                <span>Due Date:</span>
                <span>${new Date(invoice.due_date).toLocaleDateString()}</span>
              </div>
              <div class="invoice-row">
                <span>Total Amount:</span>
                <span>${invoice.currency} ${invoice.total_amount.toLocaleString()}</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${viewInvoiceUrl}" class="button">View Invoice</a>
            </div>

            <p>Please ensure payment is made by the due date to avoid any service interruption.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WeShare. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Invoice ${invoice.invoice_number} - Payment Due`,
    html: htmlContent,
  });
};

/**
 * Send payment confirmation email
 * @param {Object} payment - Payment details
 * @param {Object} invoice - Invoice details
 * @param {Object} user - User details
 * @returns {Promise<Object>} Result object
 */
export const sendPaymentConfirmationEmail = async (payment, invoice, user) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
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
          .payment-details {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .payment-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .payment-row:last-child {
            border-bottom: none;
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
            <h1>✅ Payment Confirmed</h1>
          </div>
          <div class="content">
            <div class="success-icon">✓</div>
            <h2 style="text-align: center;">Thank you for your payment!</h2>
            <p>Hello ${user.full_name || user.name},</p>
            <p>We have successfully received your payment.</p>

            <div class="payment-details">
              <div class="payment-row">
                <span>Invoice Number:</span>
                <span><strong>${invoice.invoice_number}</strong></span>
              </div>
              <div class="payment-row">
                <span>Amount Paid:</span>
                <span><strong>${invoice.currency} ${payment.amount.toLocaleString()}</strong></span>
              </div>
              <div class="payment-row">
                <span>Payment Date:</span>
                <span>${new Date(payment.created_at).toLocaleDateString()}</span>
              </div>
              <div class="payment-row">
                <span>Transaction ID:</span>
                <span>#${payment.id}</span>
              </div>
            </div>

            <p>A receipt has been generated and is available in your account.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WeShare. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Payment Confirmation - WeShare',
    html: htmlContent,
  });
};

/**
 * Send contract notification email
 * @param {Object} contract - Contract details
 * @param {Object} user - User details
 * @param {string} status - Contract status (approved/rejected)
 * @returns {Promise<Object>} Result object
 */
export const sendContractNotificationEmail = async (contract, user, status) => {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const viewContractUrl = `${appUrl}/offtaker/contracts/${contract.id}`;
  const isApproved = status === 'approved' || status === 1;
  const statusText = isApproved ? 'Approved' : 'Rejected';
  const statusColor = isApproved ? '#28a745' : '#dc3545';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contract ${statusText}</title>
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
            background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%);
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
          .contract-details {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 40px;
            margin: 25px 0;
            background: ${statusColor};
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            text-align: center;
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
            <h1>📄 Contract ${statusText}</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.full_name || user.name},</h2>
            <p>Your contract <strong>${contract.contract_title}</strong> has been ${statusText.toLowerCase()}.</p>

            ${!isApproved && contract.rejectreason ? `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Reason:</strong> ${contract.rejectreason}</p>
            </div>
            ` : ''}

            <div style="text-align: center;">
              <a href="${viewContractUrl}" class="button">View Contract</a>
            </div>

            ${isApproved ? '<p>You can now proceed with the next steps.</p>' : '<p>Please review and make necessary updates to your contract.</p>'}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WeShare. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Contract ${statusText}: ${contract.contract_title}`,
    html: htmlContent,
  });
};

/**
 * Send project notification email
 * @param {Object} project - Project details
 * @param {Object} user - User details
 * @param {string} eventType - Event type (created/updated/approved)
 * @returns {Promise<Object>} Result object
 */
export const sendProjectNotificationEmail = async (project, user, eventType) => {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const viewProjectUrl = `${appUrl}/offtaker/projects/${project.id}`;

  let title = '';
  let message = '';

  switch (eventType) {
    case 'created':
      title = 'New Project Created';
      message = `Your project <strong>${project.project_name}</strong> has been successfully created.`;
      break;
    case 'updated':
      title = 'Project Updated';
      message = `Your project <strong>${project.project_name}</strong> has been updated.`;
      break;
    case 'approved':
      title = 'Project Approved';
      message = `Congratulations! Your project <strong>${project.project_name}</strong> has been approved.`;
      break;
    default:
      title = 'Project Notification';
      message = `There's an update on your project <strong>${project.project_name}</strong>.`;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
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
            <h1>⚡ ${title}</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.full_name || user.name},</h2>
            <p>${message}</p>

            <div style="text-align: center;">
              <a href="${viewProjectUrl}" class="button">View Project</a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WeShare. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `${title}: ${project.project_name}`,
    html: htmlContent,
  });
};

export default {
  sendEmail,
  sendEmailUsingTemplate,
  getEmailTemplateData,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  sendInvoiceEmail,
  sendPaymentConfirmationEmail,
  sendContractNotificationEmail,
  sendProjectNotificationEmail,
  getSmtpSettings,
  createTransporter,
};
