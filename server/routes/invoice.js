import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      id,
      project_id,
      offtaker_id,
    } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE condition
    const where = {
      is_deleted: 0,
    };

    // Optional filters
    if (status !== undefined) {
      where.status = { equals: status };
    }

    if (id !== undefined) {
      where.id = parseInt(id);
    }

    if (project_id !== undefined) {
      where.project_id = parseInt(project_id);
    }

    if (offtaker_id !== undefined) {
      where.offtaker_id = parseInt(offtaker_id);
    }

    // If you want to search by project name or user name
    if (search) {
      where.OR = [
        {
          project: { project_name: { contains: search, mode: "insensitive" } },
        },
        { offtaker: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Fetch data with relations
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { id: "asc" },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
            },
          },
          offtaker: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    // Send success response
    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { project_id, offtaker_id, amount, total_unit, status } = req.body;

    if (
      !project_id ||
      !offtaker_id ||
      !amount ||
      !total_unit ||
      status === undefined
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const newInvoice = await prisma.invoice.create({
      data: {
        project_id,
        offtaker_id,
        amount,
        total_unit,
        status,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: newInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update invoice
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id, offtaker_id, amount, total_unit, status } = req.body;

    if (
      !project_id ||
      !offtaker_id ||
      !amount ||
      !total_unit ||
      status === undefined
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const updated = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: {
        project_id: parseInt(project_id),
        offtaker_id: parseInt(offtaker_id),
        amount: parseFloat(amount),
        total_unit: parseFloat(total_unit),
        status: parseInt(status),
      },
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "Invoice updated successfully",
        data: updated,
      });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Soft delete invoice
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 },
    });
    return res
      .status(200)
      .json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
