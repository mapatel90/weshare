import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { getUserLanguage, t } from '../utils/i18n.js';
import { getUserFullName } from "../utils/common.js";
import { createNotification } from "../utils/notifications.js";
import { ROLES } from '../../src/constants/roles.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToS3, isS3Enabled, buildUploadUrl } from '../services/s3Service.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sendEmailUsingTemplate } from '../utils/email.js';


const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Multer storage for payment screenshots
const paymentScreenshotsDir = path.join(PUBLIC_DIR, 'images', 'payments');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(paymentScreenshotsDir, { recursive: true });
    cb(null, paymentScreenshotsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    const ts = Date.now();
    cb(null, `payment_${base}_${ts}${ext}`);
  },
});
const upload = multer({ storage });

// List payments (exclude soft-deleted) with search and date filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search = '', paymentDate = '', projectId = '', status = '', page = 1, pageSize = 10 } = req.query;
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const skip = (pageNum - 1) * limit;

    // Build search condition
    const searchAmount = parseFloat(search);
    const searchCondition = search
      ? {
        OR: [
          { invoices: { invoice_number: { contains: search } } },
          { invoices: { invoice_prefix: { contains: search } } },
          { invoices: { projects: { project_name: { contains: search } } } },
          ...((!isNaN(searchAmount)) ? [{ amount: searchAmount }] : [])
        ]
      }
      : {};

    // Build date condition for specific payment date
    const dateCondition = {};
    if (paymentDate) {
      const startTs = new Date(`${paymentDate}T00:00:00`).getTime();
      const endTs = new Date(`${paymentDate}T23:59:59`).getTime();
      dateCondition.created_at = {
        gte: new Date(startTs),
        lte: new Date(endTs)
      };
    }

    // Build project condition
    const projectCondition = projectId ? { invoices: { project_id: parseInt(projectId) } } : {};

    // Build status condition
    const statusCondition = status !== '' ? { status: parseInt(status) } : {};

    const whereClause = {
      is_deleted: 0,
      ...searchCondition,
      ...dateCondition,
      ...projectCondition,
      ...statusCondition
    };

    // Get total count for pagination
    const totalCount = await prisma.payments.count({ where: whereClause });

    // Get paginated items
    const items = await prisma.payments.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      include: { users: true, invoices: { include: { projects: true } } },
      skip,
      take: limit
    });

    res.json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Get single payment by ID (with relations)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.payments.findFirst({
      where: { id: parseInt(id), is_deleted: 0 },
      include: { users: true, invoices: { include: { projects: true } } }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Create payment
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { invoice_id, offtaker_id, amount, ss_url, status, created_by } = req.body;
    if (!offtaker_id && invoice_id != "") {
      return res.status(400).json({ success: false, message: 'offtaker_id is required' });
    }

    // Handle screenshot upload - prefer uploaded file, upload to S3 if enabled
    let uploadedPath = ss_url || null;
    if (req.file) {
      const s3Enabled = await isS3Enabled();
      if (s3Enabled) {
        try {
          const buffer = fs.readFileSync(req.file.path);
          const s3Result = await uploadToS3(buffer, req.file.originalname, req.file.mimetype, {
            folder: 'payments',
            metadata: {
              uploadedBy: String(req.user?.id || ''),
              originalName: req.file.originalname,
            },
          });
          if (s3Result && s3Result.success) {
            uploadedPath = s3Result.data.fileKey;
          } else {
            console.error('S3 upload failed:', s3Result);
            return res.status(500).json({ success: false, message: 'S3 upload failed' });
          }
        } catch (err) {
          console.error('S3 upload error for payment screenshot:', err?.message || err);
          return res.status(500).json({ success: false, message: 'S3 upload failed' });
        }
      } else {
        // S3 is disabled, use local path
        uploadedPath = `/images/payments/${req.file.filename}`;
      }
    }

    const paymentStatus = parseInt(created_by) === ROLES.SUPER_ADMIN ? 1 : parseInt(status ?? 0);

    const created = await prisma.payments.create({
      data: {
        invoice_id: parseInt(invoice_id ?? 0),
        offtaker_id: parseInt(offtaker_id),
        ss_url: uploadedPath || '',
        amount: parseFloat(amount) || 0,
        status: paymentStatus,
        created_by: parseInt(created_by)
      }
    });

    if (created && parseInt(created_by) == ROLES.SUPER_ADMIN) {
      await prisma.invoices.update({
        where: { id: created.invoice_id },
        data: {
          status: 1,
        },
      });
    }

    if (created && parseInt(created_by) !== ROLES.SUPER_ADMIN) {

      const newInvoice = await prisma.invoices.findUnique({
        where: { id: created.invoice_id },
        include: { users: true }
      });

      const AdminUser = await prisma.users.findUnique({
        where: { id: parseInt(created_by) },
      });

      const lang = await getUserLanguage(created.offtaker_id);
      const creatorName = await getUserFullName(created_by);

      const notification_message = t(lang, 'notification_msg.payment_made', {
        invoice_number: newInvoice?.invoice_prefix + "-" + newInvoice?.invoice_number,
        created_by: creatorName,
        amount: created?.amount,
      });

      const title = t(lang, 'notification_msg.payment_title');

      await createNotification({
        userId: '1',
        title: title,
        message: notification_message,
        moduleType: "Payment",
        moduleId: created?.id,
        actionUrl: `/admin/finance/payments`,
        created_by: parseInt(created_by),
      });

      if(AdminUser?.email) {
        const templateData = { 
          full_name: newInvoice?.users?.full_name || '',
          user_email: newInvoice?.users?.email || '',
          user_phone: newInvoice?.users?.phone_number || '',
          invoice_number: newInvoice?.invoice_prefix + "-" + newInvoice?.invoice_number,
          total_amount: created?.amount || '',
          current_date: new Date().toLocaleDateString(),
        }

        const attachments = [];
        if (created.ss_url) {
          const fileUrl = buildUploadUrl(created.ss_url);
          if (fileUrl) {
            attachments.push({
              filename: path.basename(fileUrl),
              path: fileUrl,
            });
          }
        }
        if (newInvoice?.invoice_pdf) {
          const fileUrl = buildUploadUrl(newInvoice.invoice_pdf);
          if (fileUrl) {
            attachments.push({
              filename: path.basename(fileUrl),
              path: fileUrl,
            });
          }
        }

        // Send email to admin
        sendEmailUsingTemplate({
          to: AdminUser.email,
          templateSlug: 'payment_issued_by_offtaker_to_admin',
          templateData,
          language: lang || 'en',
          attachments,
        })
        .then((result) => {
          if (result.success) {
            console.log(`Payment notification email sent to ${AdminUser.email}`);
          } else {
            console.warn(`Could not send payment notification email: ${result.error}`);
          }
        })
        .catch((error) => {
          console.error('Failed to send payment notification email:', error.message);
        });
      }

    } else {
      // For admin created payments,

      const newInvoice = await prisma.invoices.findUnique({
        where: { id: created.invoice_id },
        include: { users: true }
      });

      const lang = await getUserLanguage(created.offtaker_id);
      const creatorName = await getUserFullName(created_by);

      const notification_message = t(lang, 'notification_msg.payment_made', {
        invoice_number: newInvoice.invoice_prefix + "-" + newInvoice.invoice_number,
        created_by: creatorName,
        amount: created?.amount,
      });

      const title = t(lang, 'notification_msg.payment_title');

      await createNotification({
        userId: newInvoice?.offtaker_id,
        title: title,
        message: notification_message,
        moduleType: "Payment",
        moduleId: created?.id,
        actionUrl: `/offtaker/payments`,
        created_by: parseInt(created_by),
      });

      if (newInvoice?.users?.email) {
        const templateData = {
          full_name: newInvoice?.users?.full_name || '',
          invoice_number: newInvoice?.invoice_prefix + "-" + newInvoice?.invoice_number,
          total_amount: created?.amount || '',
          current_date: new Date().toLocaleDateString(),
          company_name: "WeShare Energy",
        }

        const attachments = [];
        if (created.ss_url) {
          const fileUrl = buildUploadUrl(created.ss_url);
          if (fileUrl) {
            attachments.push({
              filename: path.basename(fileUrl),
              path: fileUrl,
            });
          }
        }
        if (newInvoice?.invoice_pdf) {
          const fileUrl = buildUploadUrl(newInvoice.invoice_pdf);
          if (fileUrl) {
            attachments.push({
              filename: path.basename(fileUrl),
              path: fileUrl,
            });
          }
        }

        // Send email to offtaker
        sendEmailUsingTemplate({
          to: newInvoice?.users?.email,
          templateSlug: 'payment_done_for_offtaker_by_admin',
          templateData,
          language: lang || 'en',
          attachments,
        })
        .then((result) => {
          if (result.success) {
            console.log(`Contract email sent to ${newInvoice?.users?.email}`);
          } else {
            console.warn(`Could not send contract email: ${result.error}`);
          }
        })
        .catch((error) => {
          console.error('Failed to send contract email:', error.message);
        });
      }
    }

    res.json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Update payment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { invoice_id, offtaker_id, amount, status } = req.body;
    const updated = await prisma.payments.update({
      where: { id: parseInt(id) },
      data: {
        ...(invoice_id !== undefined && { invoice_id: parseInt(invoice_id) }),
        ...(offtaker_id !== undefined && { offtaker_id: parseInt(offtaker_id) }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(status !== undefined && { status: parseInt(status) })
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Soft delete payment
router.patch('/:id/soft-delete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.payments.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Mark payment as paid (new dedicated endpoint)
router.put('/:id/mark-as-paid', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Get the payment to find associated invoice
    const payment = await prisma.payments.findFirst({
      where: { id: parseInt(id) },
      include: { invoices: true, users: true}
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Update payment status to 1 (paid)
    const updated = await prisma.payments.update({
      where: { id: parseInt(id) },
      data: { status: 1 }
    });

    // Also update associated invoice status to 1 (paid) if invoice_id exists
    if (payment.invoice_id) {
      await prisma.invoices.update({
        where: { id: parseInt(payment.invoice_id) },
        data: { status: 1 }
      });
    }

    // Send notification to offtaker
    if (payment.offtaker_id && payment.invoices) {
      const lang = await getUserLanguage(payment.offtaker_id);

      const notification_message = t(lang, 'notification_msg.payment_approved', {
        invoice_number: payment.invoices.invoice_prefix + "-" + payment.invoices.invoice_number,
        amount: payment.amount,
      });

      const title = t(lang, 'notification_msg.payment_title');

      await createNotification({
        userId: payment.offtaker_id,
        title: title,
        message: notification_message,
        moduleType: "Payment",
        moduleId: payment.id,
        actionUrl: `/offtaker/payments`,
        created_by: userId,
      });

      if(payment.users?.email) {
        const templateData = {
            full_name: payment.users?.full_name || '',
            invoice_number: payment.invoices?.invoice_prefix + "-" + payment.invoices?.invoice_number,
            total_amount: payment.amount || '',
            current_date: new Date().toLocaleDateString(),
          }

          const attachments = [];
          if (payment.invoices?.invoice_pdf) {
            const fileUrl = buildUploadUrl(payment.invoices.invoice_pdf);
            if (fileUrl) {
              attachments.push({
                filename: path.basename(fileUrl),
                path: fileUrl,
              });
            }
          }

          // Send email to offtaker
          sendEmailUsingTemplate({
            to: payment.users?.email,
            templateSlug: 'payment_approved_by_admin_for_offtaker',
            templateData,
            language: lang || 'en',
            attachments,
          })
          .then((result) => {
            if (result.success) {
              console.log(`Contract email sent to ${payment.users?.email}`);
            } else {
              console.warn(`Could not send contract email: ${result.error}`);
            }
          })
          .catch((error) => {
            console.error('Failed to send contract email:', error.message);
          });
        }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

export default router;


