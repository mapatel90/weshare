import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        // Include related Project and Inverter records
        const inverterData = await prisma.inverter_data.findMany({
            orderBy: { date: 'desc' },
            include: {
                project: true,
                inverter: true,
            },
        });
        res.status(200).json({ success: true, data: inverterData });
    }
    catch (error) {
        console.error('Error fetching inverter data:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.get("/latest", async (req, res) => {
    try {
        const { projectId } = req.query;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: "projectId is required"
            });
        }

        const latestRecord = await prisma.inverter_data.findFirst({
            where: { projectId: Number(projectId) },
            orderBy: { date: "desc" },
            include: {
                project: true,
                inverter: true,
            }
        });

        return res.status(200).json({
            success: true,
            data: latestRecord || null
        });

    } catch (error) {
        console.error("Error fetching latest inverter data:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

router.get("/today", async (req, res) => {
    try {
        const { projectId } = req.query;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: "projectId is required"
            });
        }

        // Today start 00:00:00
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Today end 23:59:59
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayData = await prisma.inverter_data.findMany({
            where: {
                projectId: Number(projectId),
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            orderBy: { date: "desc" },
            include: {
                project: true,
                inverter: true,
            }
        });

        return res.status(200).json({
            success: true,
            data: todayData
        });

    } catch (error) {
        console.error("Error fetching today's inverter data:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


export default router;