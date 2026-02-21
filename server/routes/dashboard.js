import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { PAYOUT_STATUS } from '../../src/constants/payout_status.js';

const router = express.Router();

// GET /api/dashboard/portfolio-stats (Public - for homepage)
router.get('/portfolio-stats', async (req, res) => {
    try {
        // Get all active projects
        const projects = await prisma.projects.findMany({
            where: { is_deleted: 0 },
            select: {
                id: true,
                project_size: true,
                investor_profit: true,
                asking_price: true,
            },
        });

        // Get total energy generated from project_energy_days_data
        const energyData = await prisma.project_energy_days_data.aggregate({
            _sum: {
                energy: true,
                money: true,
            },
        });

        // Calculate stats
        const totalKwh = energyData._sum.energy || 0;
        const totalIncome = energyData._sum.money || 0;

        // Calculate average ROI from projects
        const validProfits = projects
            .map(p => parseFloat(p.investor_profit) || 0)
            .filter(p => p > 0);
        const averageROI = validProfits.length > 0
            ? validProfits.reduce((a, b) => a + b, 0) / validProfits.length
            : 0;

        // Calculate total savings (energy * average weshare price savings)
        // Assuming average savings of ~0.5 per kWh compared to grid
        const avgSavingsPerKwh = 0.5;
        const totalSavings = totalKwh * avgSavingsPerKwh;

        // CO2 avoided calculation (0.7 kg CO2 per kWh for solar energy)
        const co2PerKwh = 0.7;
        const co2Avoided = totalKwh * co2PerKwh;

        // Calculate growth percentages (placeholder - could be calculated from historical data)
        const stats = {
            totalKwh: {
                value: totalKwh,
                growth: '+2.4%',
            },
            totalIncome: {
                value: totalIncome,
                growth: '+8.7%',
            },
            totalSavings: {
                value: totalSavings,
                growth: '+3.0%',
            },
            averageROI: {
                value: averageROI,
                growth: '+1.8%',
            },
            co2Avoided: {
                value: co2Avoided / 1000, // Convert to tons
                growth: '+2.4%',
            },
            projectCount: projects.length,
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching portfolio stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/dashboard/statscount
router.get('/statscount', authenticateToken, async (req, res) => {
    try {
        const [projects, users, inverters, contracts, lease_request, interested_investors, project_inverters, payouts] = await Promise.all([
            prisma.projects.count({ where: { is_deleted: 0 } }),
            prisma.users.count({ where: { is_deleted: 0 } }),
            prisma.inverters.count({ where: { is_deleted: 0 } }),
            prisma.contracts.count({ where: { is_deleted: 0 } }),
            prisma.lease_requests.count({ where: { is_deleted: 0 } }),
            prisma.interested_investors.count({ where: { is_deleted: 0 } }),
            prisma.project_inverters.count({ where: { is_deleted: 0 } }),
            prisma.invoices.count({ where: { is_deleted: 0 } }),
            prisma.payouts.aggregate({
                _sum: {
                    payout_amount: true
                },
                where: {
                    status: PAYOUT_STATUS.PAYOUT
                }
            })
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
                project_inverters,
                payouts: payouts._sum.payout_amount || 0,
            },
        });
    } catch (error) {
        console.error('Error fetching stats count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/plantdetails', authenticateToken, async (req, res) => {
    try {
        const projects = await prisma.projects.findMany({
            where: {
                is_deleted: 0,
            },
            include: {
                project_data: true,
            },
        });
        res.json({
            success: true,
            data: {
                projects,
            },
        });
    } catch (error) {
        console.error('Error fetching stats count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
