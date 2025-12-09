import express from 'express';
import prisma from '../utils/prisma.js';

const router = express.Router();

// GET /api/dashboard/statscount
router.get('/statscount', async (req, res) => {
    try {
        const [projects, users, inverters, contracts, lease_request, interested_investors] = await Promise.all([
            prisma.project.count({ where: { is_deleted: 0 } }),
            prisma.user.count({ where: { is_deleted: 0 } }),
            prisma.inverter.count({ where: { is_deleted: 0 } }),
            prisma.contract.count({ where: { is_deleted: 0 } }),
            prisma.leaseRequest.count({ where: { is_deleted: 0 } }),
            prisma.InterestedInvestor.count({ where: { is_deleted: 0 } }),
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
