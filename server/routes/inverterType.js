import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const inverterTypes = await prisma.inverterType.findMany({
      orderBy: { type: 'asc' },
    });
    res.status(200).json({ success: true, data: inverterTypes });
  } catch (error) {
     console.error('Error fetching inverter types:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Create inverter type
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, status } = req.body;

    if (!type || status === undefined) {
      return res.status(400).json({ success: false, message: 'Type and status are required.' });
    }

    const created = await prisma.inverterType.create({
      data: { type, status },
    });

    return res.status(201).json({ success: true, message: 'Inverter type added successfully', data: created });
  } catch (error) {
    // Unique constraint for type
    if (error?.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Inverter type already exists.' });
    }
    console.error('Error creating inverter type:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Paginated list, search and filter similar to inverters flow
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      is_deleted: 0,
    };
    if (search) {
      where.type = { contains: String(search), mode: 'insensitive' };
    }
    if (status !== undefined) {
      where.status = parseInt(status);
    }

    const [items, total] = await Promise.all([
      prisma.inverterType.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { type: 'asc' },
      }),
      prisma.inverterType.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        inverterTypes: items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching inverter types (data):', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Update inverter type
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, status } = req.body;

    if (!type || status === undefined) {
      return res.status(400).json({ success: false, message: 'Type and status are required.' });
    }

    const updated = await prisma.inverterType.update({
      where: { id: parseInt(id) },
      data: { type, status },
    });

    return res.status(200).json({ success: true, message: 'Inverter type updated successfully', data: updated });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Inverter type already exists.' });
    }
    console.error('Error updating inverter type:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Delete inverter type (hard delete; model has no is_deleted)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.inverterType.update({ where: { id: parseInt(id) } , data: { is_deleted: 1 } });

    return res.status(200).json({ success: true, message: 'Inverter type deleted successfully' });
  } catch (error) {
    // Handle FK constraint if any inverters reference this type
    if (error?.code === 'P2003') {
      return res.status(409).json({ success: false, message: 'Cannot delete: inverter type in use.' });
    }
    console.error('Error deleting inverter type:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

export default router;
