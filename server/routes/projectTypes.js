import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all project types (exclude soft-deleted)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.project_type.findMany({
      where: { is_deleted: 0 },
      orderBy: { id: 'desc' }
    });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Create project type
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name || status === undefined) {
      return res.status(400).json({ success: false, message: 'name and status are required' });
    }
    const created = await prisma.project_type.create({
      data: {
        type_name: name,
        status: parseInt(status)
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Update project type
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const updated = await prisma.project_type.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { type_name: name }),
        ...(status !== undefined && { status: parseInt(status) })
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Soft delete project type
router.patch('/:id/soft-delete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project_type.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

export default router;


