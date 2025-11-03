import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
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
              <p>We received a request to reset your password for your Sunshare account.</p>
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
              <p>© ${new Date().getFullYear()} Sunshare. All rights reserved.</p>
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

We received a request to reset your password for your Sunshare account.

Click the link below to reset your password:
${resetUrl}

⏰ Important: This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Sunshare. All rights reserved.
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Sunshare" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your Password - Sunshare',
      text: textContent,
      html: htmlContent,
    });

    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset confirmation email
export const sendPasswordResetConfirmationEmail = async (email) => {
  try {
    const transporter = createTransporter();
    
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
              <p>Your Sunshare account password has been successfully reset.</p>
              <p>You can now log in with your new password.</p>
              <p style="margin-top: 30px;"><strong>If you didn't make this change,</strong> please contact our support team immediately.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Sunshare. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"Sunshare" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Successful - Sunshare',
      html: htmlContent,
    });

    console.log('Password reset confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
};
