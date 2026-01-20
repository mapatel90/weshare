/**
 * Email Usage Examples
 * This file demonstrates how to use the email utility functions
 * in different scenarios and events throughout your application
 */

import {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendInvoiceEmail,
  sendPaymentConfirmationEmail,
  sendContractNotificationEmail,
  sendProjectNotificationEmail,
  sendNotificationEmail,
} from './email.js';
import prisma from './prisma.js';
import { createNotification } from './notifications.js';

// ============================================================================
// EXAMPLE 1: Send Welcome Email on User Registration
// ============================================================================

export const handleUserRegistration = async (userData) => {
  try {
    // Create user in database
    const user = await prisma.users.create({
      data: userData,
    });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.full_name);

    // Also create in-app notification
    await createNotification({
      userId: user.id,
      title: 'Welcome to WeShare!',
      message: 'Your account has been successfully created.',
      moduleType: 'user',
      actionUrl: '/offtaker/myprofile',
    });

    return { success: true, user };
  } catch (error) {
    console.error('Error in user registration:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// EXAMPLE 2: Send Invoice Email When Invoice is Created
// ============================================================================

export const handleInvoiceCreation = async (invoiceId) => {
  try {
    // Fetch invoice with user details
    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        users: true,
        projects: true,
      },
    });

    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // Send invoice email
    await sendInvoiceEmail(invoice, invoice.users);

    // Create in-app notification
    await createNotification({
      userId: invoice.offtaker_id,
      title: `New Invoice: ${invoice.invoice_number}`,
      message: `Invoice for ${invoice.currency} ${invoice.total_amount.toLocaleString()} is due by ${new Date(invoice.due_date).toLocaleDateString()}.`,
      moduleType: 'invoice',
      moduleId: invoice.id,
      actionUrl: `/offtaker/invoices/${invoice.id}`,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// EXAMPLE 3: Send Payment Confirmation Email
// ============================================================================

export const handlePaymentConfirmation = async (paymentId) => {
  try {
    // Fetch payment with invoice and user details
    const payment = await prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        invoices: true,
        users: true,
      },
    });

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    // Send payment confirmation email
    await sendPaymentConfirmationEmail(payment, payment.invoices, payment.users);

    // Create in-app notification
    await createNotification({
      userId: payment.offtaker_id,
      title: 'Payment Confirmed',
      message: `Your payment of ${payment.amount} has been successfully processed.`,
      moduleType: 'payment',
      moduleId: payment.id,
      actionUrl: `/offtaker/payments/${payment.id}`,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// EXAMPLE 4: Send Contract Status Email (Approved/Rejected)
// ============================================================================

export const handleContractStatusUpdate = async (contractId, newStatus) => {
  try {
    // Fetch contract with user details
    const contract = await prisma.contracts.findUnique({
      where: { id: contractId },
      include: {
        users: true,
      },
    });

    if (!contract) {
      return { success: false, message: 'Contract not found' };
    }

    const status = newStatus === 1 ? 'approved' : 'rejected';

    // Send contract notification email
    await sendContractNotificationEmail(contract, contract.users, status);

    // Create in-app notification
    await createNotification({
      userId: contract.offtaker_id,
      title: `Contract ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your contract "${contract.contract_title}" has been ${status}.`,
      moduleType: 'contract',
      moduleId: contract.id,
      actionUrl: `/offtaker/contracts/${contract.id}`,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending contract notification:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// EXAMPLE 5: Send Project Notification Email (Created/Updated/Approved)
// ============================================================================

export const handleProjectEvent = async (projectId, eventType) => {
  try {
    // Fetch project with user details
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        offtaker: true,
      },
    });

    if (!project || !project.offtaker) {
      return { success: false, message: 'Project or user not found' };
    }

    // Send project notification email
    await sendProjectNotificationEmail(project, project.offtaker, eventType);

    // Create in-app notification
    let notificationTitle = '';
    let notificationMessage = '';

    switch (eventType) {
      case 'created':
        notificationTitle = 'Project Created';
        notificationMessage = `Your project "${project.project_name}" has been successfully created.`;
        break;
      case 'updated':
        notificationTitle = 'Project Updated';
        notificationMessage = `Your project "${project.project_name}" has been updated.`;
        break;
      case 'approved':
        notificationTitle = 'Project Approved';
        notificationMessage = `Congratulations! Your project "${project.project_name}" has been approved.`;
        break;
      default:
        notificationTitle = 'Project Notification';
        notificationMessage = `There's an update on your project "${project.project_name}".`;
    }

    await createNotification({
      userId: project.offtaker_id,
      title: notificationTitle,
      message: notificationMessage,
      moduleType: 'project',
      moduleId: project.id,
      actionUrl: `/offtaker/projects/${project.id}`,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending project notification:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// EXAMPLE 6: Send Custom Notification Email
// ============================================================================

export const sendCustomNotification = async (userId, subject, message) => {
  try {
    // Fetch user details
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Send custom notification email
    await sendNotificationEmail(user.email, subject, message);

    // Create in-app notification
    await createNotification({
      userId: user.id,
      title: subject,
      message: message.replace(/<[^>]*>/g, ''), // Strip HTML tags
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending custom notification:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// EXAMPLE 7: Send Bulk Emails to Multiple Users
// ============================================================================

export const sendBulkNotifications = async (userIds, subject, message) => {
  try {
    const results = {
      total: userIds.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    for (const userId of userIds) {
      try {
        const result = await sendCustomNotification(userId, subject, message);
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ userId, error: result.message });
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        results.errors.push({ userId, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return { success: false, error: error.message };
  }
};

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
  handleUserRegistration,
  handleInvoiceCreation,
  handlePaymentConfirmation,
  handleContractStatusUpdate,
  handleProjectEvent,
  sendCustomNotification,
  sendBulkNotifications,
  sendCustomHtmlEmail,
  scheduleEmail,
  sendEmailWithAttachment,
};
