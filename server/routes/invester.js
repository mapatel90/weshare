import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { projectId, userId, fullName, email, phoneNumber, notes } = req.body;
    if (!fullName || !email) {
      return res
        .status(400)
        .json({ success: false, message: "fullName and email are required" });
    }

    const created = await prisma.interestedInvestor.create({
      data: {
        projectId: projectId ?? null,
        userId: userId ?? null,
        fullName,
        email,
        phoneNumber: phoneNumber ?? null,
        notes: notes ?? null,
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// List with optional filters + pagination
router.get('/', async (req, res) => {
  try {
    const { projectId, userId, page = 1, limit = 25 } = req.query;
    const where = { is_deleted: 0 };

    if (projectId) where.projectId = Number(projectId);
    if (userId) where.userId = Number(userId);

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [data, total] = await Promise.all([
      prisma.interestedInvestor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { project: true, user: true },
      }),
      prisma.interestedInvestor.count({ where }),
    ]);

    return res.json({ success: true, data, total, page: Number(page), limit: take });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get single by id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const record = await prisma.interestedInvestor.findFirst({
      where: { id, is_deleted: 0 },
      include: { project: true, user: true },
    });
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: record });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { projectId, fullName, email, phoneNumber, notes, status } = req.body;

    const updated = await prisma.interestedInvestor.update({
      where: { id },
      data: {
        projectId: Number(projectId) ?? undefined,
        fullName: fullName ?? undefined,
        email: email ?? undefined,
        phoneNumber: phoneNumber ?? undefined,
        notes: notes ?? undefined,
        status: status ?? undefined,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Soft delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.interestedInvestor.update({
      where: { id },
      data: { is_deleted: 1 },
    });
    return res.json({ success: true, message: 'Deleted (soft)' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
