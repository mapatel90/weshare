import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// List project_inverters for a specific projectId, except soft-deleted
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ success: false, message: 'project_id is required' });
    }
    const inverters = await prisma.project_inverters.findMany({
      where: {
        project_id: parseInt(project_id),
        is_deleted: 0
      },
      include: {
        inverter: true,
      },
      orderBy: { id: 'desc' }
    });
    res.json({ success: true, data: inverters });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Add a new project_inverter link
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { project_id, inverter_id, kilowatt, status, inverter_serial_number } = req.body;
    if (!project_id || !inverter_id || !kilowatt || status === undefined) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    const added = await prisma.project_inverters.create({
      data: {
        project_id: parseInt(project_id),
        inverter_id: parseInt(inverter_id),
        kilowatt: String(kilowatt),
        inverter_serial_number: inverter_serial_number || null,
        status: parseInt(status),
      }
    });
    res.status(201).json({ success: true, data: added });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update existing project_inverter
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { inverter_id, kilowatt, status, inverter_serial_number } = req.body;
    if (!inverter_id || !kilowatt || status === undefined) {
      return res.status(400).json({ success: false, message: 'Fields missing' });
    }
    const updated = await prisma.project_inverters.update({
      where: { id: parseInt(id) },
      data: {
        inverter_id: parseInt(inverter_id),
        kilowatt: String(kilowatt),
        inverter_serial_number: inverter_serial_number || null,
        status: parseInt(status),
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Soft-delete project_inverter
router.patch('/:id/soft-delete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project_inverters.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
