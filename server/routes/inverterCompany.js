import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ================= CREATE =================
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { companyName, apiKey, apiUrl, secretKey, status, created_by } = req.body;

    if (!companyName || !apiKey || !apiUrl || !secretKey || status === undefined) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const newCompany = await prisma.inverter_company.create({
      data: {
        company_name: companyName,
        api_key: apiKey,
        api_url: apiUrl,
        secret_key: secretKey,
        status: Number(status),
        api_status: 1,
        created_by,
      },
    });

    res.status(201).json({
      success: true,
      message: "Company added successfully",
      data: newCompany,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// ================= GET LIST =================
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { is_deleted: 0 };

    if (search) {
      where.company_name = { contains: search, mode: "insensitive" };
    }

    if (status !== undefined) {
      where.status = Number(status);
    }

    const [company, total] = await Promise.all([
      prisma.inverter_company.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: "desc" },
      }),
      prisma.inverter_company.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        company,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// ================= UPDATE =================
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, apiKey, apiUrl, secretKey, status } = req.body;

    if (!companyName || !apiKey || !apiUrl || !secretKey || status === undefined) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const updated = await prisma.inverter_company.update({
      where: { id: Number(id) },
      data: {
        company_name: companyName,
        api_key: apiKey,
        api_url: apiUrl,
        secret_key: secretKey,
        status: Number(status),
      },
    });

    res.json({ success: true, message: "Company updated successfully", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// ================= DELETE (SOFT) =================
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.inverter_company.update({
      where: { id: Number(id) },
      data: { is_deleted: 1 },
    });

    res.json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
