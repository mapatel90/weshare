import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/statscount
router.get('/statscount',authenticateToken, async (req, res) => {
    try {
        const [projects, users, inverters, contracts, lease_request, interested_investors] = await Promise.all([
            prisma.projects.count({ where: { is_deleted: 0 } }),
            prisma.users.count({ where: { is_deleted: 0 } }),
            prisma.inverters.count({ where: { is_deleted: 0 } }),
            prisma.contracts.count({ where: { is_deleted: 0 } }),
            prisma.lease_requests.count({ where: { is_deleted: 0 } }),
            prisma.interested_investors.count({ where: { is_deleted: 0 } }),
        ]);
        res.json({
            success: true,
            data: {
                projects,
                users,
                inverters,
                contracts,
                lease_request,
                interested_investors,
            },
        });
    } catch (error) {
        console.error('Error fetching stats count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
