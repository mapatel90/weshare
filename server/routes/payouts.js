import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { getUserLanguage, t } from '../utils/i18n.js';
import { getUserFullName } from "../utils/common.js";
import { createNotification } from "../utils/notifications.js";

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search = '', projectId = '', status = '', page = 1, pageSize = 10 } = req.query;
        const pageNum = parseInt(page);
        const limit = parseInt(pageSize);
        const skip = (pageNum - 1) * limit;

        // Build search condition
        const searchAmount = parseFloat(search);
        const searchCondition = search
            ? {
                OR: [
                    { invoices: { invoice_number: { contains: search } } },
                    { invoices: { invoice_prefix: { contains: search } } },
                    { invoices: { invoice_amount: { contains: search } } },
                    { invoices: { projects: { project_name: { contains: search } } } },
                    ...((!isNaN(searchAmount)) ? [{ amount: searchAmount }] : [])
                ]
            }
            : {};


        // Build project condition
        const projectCondition = projectId ? { invoices: { project_id: parseInt(projectId) } } : {};

        // Build status condition
        const statusCondition = status !== '' ? { status: parseInt(status) } : {};

        const whereClause = {
            ...searchCondition,
            ...projectCondition,
            ...statusCondition
        };

        // Get total count for pagination
        const totalCount = await prisma.payouts.count({ where: whereClause });

        // Get paginated items
        const items = await prisma.payouts.findMany({
            where: whereClause,
            orderBy: { id: 'desc' },
            include: { users: true, projects: true, invoices: { include: { projects: true } } },
            skip,
            take: limit
        });

        res.json({
            success: true,
            data: items,
            pagination: {
                page: pageNum,
                pageSize: limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const payoutId = parseInt(req.params.id);
        const payout = await prisma.payouts.findFirst({
            where: { id: payoutId },
            include: { users: true, projects: true, invoices: { include: { projects: true } } }
        });

        if (!payout) {
            return res.status(404).json({ success: false, message: 'Payout not found' });
        }

        res.json({ success: true, data: payout });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

export default router;