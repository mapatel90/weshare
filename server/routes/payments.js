import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// List payments (exclude soft-deleted)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.payments.findMany({
      where: { is_deleted: 0 },
      orderBy: { id: 'desc' },
      include: { users: true, invoices: { include: { projects: true } } }
    });
    res.json({ success: true, data: items });
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
        status: parseInt(status ?? 1)
      }
    });

    // Update invoice status to 1 (paid) if invoice_id is provided
    if (invoice_id) {
      await prisma.invoices.update({
        where: { id: parseInt(invoice_id) },
        data: { status: 1 }
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

export default router;


