import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { companyName, inverterName, inverter_type_id, apiKey, secretKey, status } = req.body;

    // Basic validation
    if (!companyName || !inverterName || !inverter_type_id || !apiKey || !secretKey || status === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Insert into PostgreSQL via Prisma
    const newInverter = await prisma.inverter.create({
      data: {
        companyName,
        inverterName,
        inverter_type_id,
        apiKey,
        secretKey,
        status,  
        api_status: 1,  // 👈 fixed default
      },
    });

    return res.status(201).json({
      success: true,
      message: "Inverter added successfully",
      data: newInverter,
    });
  } catch (error) {
    console.error("Error adding inverter:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    // Build dynamic filters
    const where = {
      is_deleted: 0,
    };
    if (search) {
      // 👇 Search in companyName OR inverterName
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { inverterName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status !== undefined) {
      where.status = parseInt(status);
    }

    // Fetch with pagination + related inverter type
    const [inverters, total] = await Promise.all([
      prisma.inverter.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { createdAt: "asc" },
        include: {
          inverterType: {
            select: {
              id: true,
              type: true, // 👈 include type name
            },
          },
        },
      }),
      prisma.inverter.count({ where }),
    ]);

    // ✅ Format data to include inverter type name directly
    const formatted = inverters.map((inv) => ({
      id: inv.id,
      companyName: inv.companyName,
      inverterName: inv.inverterName,
      inverter_type_id: inv.inverterType?.type || null,
      apiKey: inv.apiKey,
      secretKey: inv.secretKey,
      status: inv.status,
      api_status: inv.api_status,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        inverters: formatted,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching inverters:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, inverterName, inverter_type_id, apiKey, secretKey, status } = req.body;

    // Basic validation
    if (!companyName || !inverterName || !inverter_type_id || !apiKey || !secretKey || status === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Update inverter
    const updatedInverter = await prisma.inverter.update({
      where: { id: parseInt(id) },
      data: {
        companyName,
        inverterName,
        inverter_type_id,
        apiKey,
        secretKey,
        status,
      },
    });

    res.status(200).json({
      success: true,
      message: "Inverter updated successfully",
      data: updatedInverter,
    });
  } catch (error) {
    console.error("Error updating inverter:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    //  const inverter = await prisma.inverter.findUnique({
    //   where: { id: parseInt(id) },
    //   data: { is_deleted: 0 },
    // });

    // if (!inverter) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Inverter not found",
    //   });
    // }

    // Soft delete (set is_deleted = 1)
    await prisma.inverter.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 },
    });

    res.status(200).json({
      success: true,
      message: "Inverter deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inverter:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;