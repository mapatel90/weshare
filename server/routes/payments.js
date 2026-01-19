import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

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
    const { invoice_id, offtaker_id, ss_url, amount, status } = req.body;
    if (!offtaker_id && invoice_id != "") {
      return res.status(400).json({ success: false, message: 'offtaker_id is required' });
    }
    const created = await prisma.payments.create({
      data: {
        invoice_id: parseInt(invoice_id ?? 0),
        offtaker_id: parseInt(offtaker_id),
        ss_url: ss_url || '',
        amount: parseFloat(amount) || 0,
        status: parseInt(status ?? 0)
      }
    });

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


