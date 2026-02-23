import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSignedUrl } from '../services/s3Service.js';

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
      'site_country',
      's3_public_url',
      's3_bucket_name',
      's3_aws_region',
      's3_file_visibility'
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

    // Helper function to build full image URL (async for signed URLs)
    const buildImageUrl = async (imagePath) => {
      console.log('🔍 buildImageUrl - Input imagePath:', imagePath);

      if (!imagePath) {
        console.log('⚠️ No imagePath provided');
        return '';
      }

      // If already a full URL (starts with http:// or https://), return as-is
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.log('✅ Full URL detected, returning as-is:', imagePath);
        return imagePath;
      }

      // Check if S3 files are private - need signed URL
      const fileVisibility = settingsObj.s3_file_visibility || 'private';

      if (fileVisibility === 'private') {
        try {
          console.log('🔐 Private file detected, generating signed URL...');
          const signedUrl = await generateSignedUrl(imagePath, 86400); // 24 hours expiry
          console.log('✅ Generated signed URL:', signedUrl);
          return signedUrl;
        } catch (error) {
          console.error('❌ Failed to generate signed URL:', error.message);
          // Fall through to build static URL as fallback
        }
      }

      // For public files or if signed URL fails, build static URL
      let baseUrl = '';

      // Try S3 public URL first (if custom domain/CloudFront is configured)
      if (settingsObj.s3_public_url) {
        baseUrl = settingsObj.s3_public_url;
        console.log('✅ Using S3 public URL from settings:', baseUrl);
      }
      // Otherwise, construct standard S3 URL from bucket and region
      else if (settingsObj.s3_bucket_name && settingsObj.s3_aws_region) {
        baseUrl = `https://${settingsObj.s3_bucket_name}.s3.${settingsObj.s3_aws_region}.amazonaws.com`;
        console.log('✅ Constructed S3 URL from bucket/region:', baseUrl);
      }
      // Fallback to environment variable
      else {
        baseUrl = process.env.UPLOAD_URL || process.env.NEXT_PUBLIC_UPLOAD_URL || '';
        console.log('⚠️ Using fallback UPLOAD_URL:', baseUrl);
      }

      if (!baseUrl) {
        console.error('❌ No base URL available for image. Please configure S3 settings.');
        return imagePath; // Return the path as-is
      }

      // Ensure baseUrl ends with slash and path doesn't start with slash
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
      const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      const finalUrl = cleanBaseUrl + cleanPath;

      console.log('✅ Built final URL:', finalUrl);
      return finalUrl;
    };

    // Build complete template data with common fields
    const templateData = {
      // Company information
      company_name: settingsObj.site_name || 'WeShare Energy',
      company_logo: await buildImageUrl(settingsObj.site_image),

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
      company_logo: '', // Empty string if error occurs
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

    const subjectField = language === 'vi' ? 'subject_vi' : 'subject_en';
    const subjectTemplate = template[subjectField] || template.subject_en || template.subject_vi || '';
    const subject = replacePlaceholders(subjectTemplate, completeTemplateData);
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

/**
 * Send welcome email to new user
 * @param {string} email - User email
 * @param {string} fullName - User full name
 * @returns {Promise<Object>} Result object
 */

/**
 * Send notification email
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @returns {Promise<Object>} Result object
 */

/**
 * Send invoice email
 * @param {Object} invoice - Invoice details
 * @param {Object} user - User details
 * @returns {Promise<Object>} Result object
 */

/**
 * Send payment confirmation email
 * @param {Object} payment - Payment details
 * @param {Object} invoice - Invoice details
 * @param {Object} user - User details
 * @returns {Promise<Object>} Result object
 */

/**
 * Send contract notification email
 * @param {Object} contract - Contract details
 * @param {Object} user - User details
 * @param {string} status - Contract status (approved/rejected)
 * @returns {Promise<Object>} Result object
 */

/**
 * Send project notification email
 * @param {Object} project - Project details
 * @param {Object} user - User details
 * @param {string} eventType - Event type (created/updated/approved)
 * @returns {Promise<Object>} Result object
 */

export default {
  sendEmail,
  sendEmailUsingTemplate,
  getEmailTemplateData,
  sendPasswordResetConfirmationEmail,
  getSmtpSettings,
  createTransporter,
};
