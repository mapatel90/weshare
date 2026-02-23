/**
 * Email Usage Examples
 * This file demonstrates how to use the email utility functions
 * in different scenarios and events throughout your application
 */

import {
  sendEmail,
} from './email.js';
import prisma from './prisma.js';
import { createNotification } from './notifications.js';

// ============================================================================
// EXAMPLE 8: Send Email with Custom HTML Template
// ============================================================================

export const sendCustomHtmlEmail = async (to, subject, htmlContent) => {
  try {
    const result = await sendEmail({
      to,
      subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, ''), // Plain text version
    });

    return result;
  } catch (error) {
    console.error('Error sending custom HTML email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// EXAMPLE 9: Schedule Email for Later (using background job)
// ============================================================================

export const scheduleEmail = async (emailData, scheduledTime) => {
  // This is a simplified example - in production, use a job queue like Bull or Agenda
  try {
    const delay = new Date(scheduledTime) - new Date();

    if (delay <= 0) {
      return { success: false, message: 'Scheduled time must be in the future' };
    }

    // Schedule the email
    setTimeout(async () => {
      try {
        await sendEmail(emailData);
        console.log('Scheduled email sent successfully');
      } catch (error) {
        console.error('Error sending scheduled email:', error);
      }
    }, delay);

    return { success: true, message: 'Email scheduled successfully' };
  } catch (error) {
    console.error('Error scheduling email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// EXAMPLE 10: Send Email with Attachments
// ============================================================================

export const sendEmailWithAttachment = async (to, subject, htmlContent, attachments) => {
  try {
    // attachments format:
    // [
    //   {
    //     filename: 'invoice.pdf',
    //     path: '/path/to/invoice.pdf',
    //     contentType: 'application/pdf'
    //   }
    // ]
    const result = await sendEmail({
      to,
      subject,
      html: htmlContent,
      customSmtp: null,
    });

    return result;
  } catch (error) {
    console.error('Error sending email with attachment:', error);
    return { success: false, error: error.message };
  }
};

// Export all examples
export default {
  sendCustomHtmlEmail,
  scheduleEmail,
  sendEmailWithAttachment,
};
