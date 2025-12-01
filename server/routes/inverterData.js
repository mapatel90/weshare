import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        // Include related Project and Inverter records
        const inverterData = await prisma.inverter_data.findMany({
            orderBy: { date: 'asc' },
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

export default router;