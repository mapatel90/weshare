import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
    try {
        const { company_id, title, inverter_type_id, status, created_by } = req.body;

        // Basic validation
        if (!company_id || !title || !inverter_type_id || status === undefined) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        // Insert into PostgreSQL via Prisma
        const newInverter = await prisma.inverters.create({
            data: {
                title,
                status,
                created_by,

                inverter_type: {
                    connect: { id: Number(inverter_type_id) }
                },

                inverter_company: {
                    connect: { id: Number(company_id) }
                }
            }
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
            // Search in company_id OR title
            where.OR = [
                // { company_name: { contains: search, mode: "insensitive" } },
                { title: { contains: search, mode: "insensitive" } },
            ];
        }
        if (status !== undefined) {
            where.status = parseInt(status);
        }

        // Fetch with pagination + related inverter type
        const [inverters, total] = await Promise.all([
            prisma.inverters.findMany({
                where,
                skip: parseInt(offset),
                take: parseInt(limit),
                orderBy: { created_at: "asc" },
                include: {
                    inverter_type: {
                        select: {
                            type: true
                        },
                    },
                    inverter_company: {
                        select: {
                            company_name: true
                        },
                    },
                },
            }),
            prisma.inverters.count({ where }),
        ]);
        // Format data to include inverter type name directly
        const formatted = inverters.map((inv) => ({
            id: inv.id,
            inverter_type_name: inv.inverter_type?.type || null,
            company_id: inv.company_id,
            company_name: inv.inverter_company?.company_name,
            inverter_type_id: inv.inverter_type_id,
            title: inv.title,
            status: inv.status,
            created_at: inv.created_at,
            updated_at: inv.updated_at,
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
        const { company_id, title, inverter_type_id, status } = req.body;

        // Basic validation
        if (!company_id || !title || !inverter_type_id || status === undefined) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        // Update inverter
        const updatedInverter = await prisma.inverters.update({
            where: { id: parseInt(id) },
            data: {
                company_id: Number(company_id),
                title: title,
                inverter_type_id,
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
        
        await prisma.inverters.update({
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