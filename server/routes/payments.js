import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// List payments (exclude soft-deleted)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.payment.findMany({
      where: { is_deleted: 0 },
      orderBy: { id: 'desc' },
      include: { offtaker: true }
    });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Create payment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { invoice_id, offtaker_id, amount, status } = req.body;
    if (!offtaker_id || !amount) {
      return res.status(400).json({ success: false, message: 'offtaker_id and amount are required' });
    }
    const created = await prisma.payment.create({
      data: {
        invoice_id: parseInt(invoice_id ?? 0),
        offtaker_id: parseInt(offtaker_id),
        amount: parseInt(amount),
        status: parseInt(status ?? 1)
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
    const updated = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: {
        ...(invoice_id !== undefined && { invoice_id: parseInt(invoice_id) }),
        ...(offtaker_id !== undefined && { offtaker_id: parseInt(offtaker_id) }),
        ...(amount !== undefined && { amount: parseInt(amount) }),
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
    await prisma.payment.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

export default router;


