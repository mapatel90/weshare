import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { getUserLanguage, t } from '../utils/i18n.js';
import { getUserFullName } from "../utils/common.js";
import { createNotification } from "../utils/notifications.js";
import { ROLES } from '../../src/constants/roles.js';

const router = express.Router();

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
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { invoice_id, offtaker_id, ss_url, amount, status, created_by } = req.body;
    if (!offtaker_id && invoice_id != "") {
      return res.status(400).json({ success: false, message: 'offtaker_id is required' });
    }
    const created = await prisma.payments.create({
      data: {
        invoice_id: parseInt(invoice_id ?? 0),
        offtaker_id: parseInt(offtaker_id),
        ss_url: ss_url || '',
        amount: parseFloat(amount) || 0,
        status: parseInt(status ?? 0),
        created_by: parseInt(created_by)
      }
    });

    if(created && parseInt(created_by) == ROLES.SUPER_ADMIN){
      await prisma.invoices.update({
        where: { id: created.invoice_id },
        data: {
          status: 1,
        },
      });
    }

    if (created && created_by !== ROLES.SUPER_ADMIN) {

      const newInvoice = await prisma.invoices.findUnique({
        where: { id: created.invoice_id },
      });

      const lang = await getUserLanguage(created.offtaker_id);
      const creatorName = await getUserFullName(created_by);

      const notification_message = t(lang, 'notification_msg.payment_made', {
        invoice_number: newInvoice.invoice_prefix + "-" + newInvoice.invoice_number,
        created_by: creatorName,
        amount: created?.amount,
      });

      await createNotification({
        userId: '1',
        title: notification_message,
        message: notification_message,
        moduleType: "Payment",
        moduleId: created?.id,
        actionUrl: `/admin/finance/payments`,
        created_by: parseInt(created_by),
      });
    } else {
      // For admin created payments,
      
      const newInvoice = await prisma.invoices.findUnique({
        where: { id: created.invoice_id },
      });

      const lang = await getUserLanguage(created.offtaker_id);
      const creatorName = await getUserFullName(created_by);

      const notification_message = t(lang, 'notification_msg.payment_made', {
        invoice_number: newInvoice.invoice_prefix + "-" + newInvoice.invoice_number,
        created_by: creatorName,
        amount: created?.amount,
      });

      await createNotification({
        userId: newInvoice?.offtaker_id,
        title: notification_message,
        message: notification_message,
        moduleType: "Payment",
        moduleId: created?.id,
        actionUrl: `/offtaker/payments`,
        created_by: parseInt(created_by),
      });
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
    
    // Get the payment to find associated invoice
    const payment = await prisma.payments.findFirst({
      where: { id: parseInt(id) }
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

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

export default router;


