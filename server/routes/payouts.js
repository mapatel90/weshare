import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { getUserLanguage, t } from '../utils/i18n.js';
import { getUserFullName } from "../utils/common.js";
import { createNotification } from "../utils/notifications.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToS3, isS3Enabled, deleteFromS3 } from '../services/s3Service.js';
import { PAYOUT_STATUS } from '../../src/constants/payout_status.js';
import { getDateTimeInTZ } from '../../src/utils/common.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search = '', projectId = '', status = '', page = 1, pageSize = 10, investorId = "" } = req.query;
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

        // Build investor condition
        const investorCondition = investorId !== "" ? { investor_id: parseInt(investorId) } : {};

        const whereClause = {
            ...searchCondition,
            ...projectCondition,
            ...statusCondition,
            ...investorCondition
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

// Multer memory storage for payout document
const payoutMemoryStorage = multer.memoryStorage();
const uploadPayoutDoc = multer({
    storage: payoutMemoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (validTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'));
        }
    }
});

router.post("/create", authenticateToken, uploadPayoutDoc.single('document'), async (req, res) => {
    try {
        const { project_id, invoice_id, transaction_id } = req.body;

        if (!project_id || !invoice_id) {
            return res.status(400).json({
                success: false,
                message: "Project and Invoice are required",
            });
        }

        // Get invoice + project data
        const invoice = await prisma.invoices.findFirst({
            where: {
                id: Number(invoice_id),
                project_id: Number(project_id),
                status: 1,
                is_deleted: 0,
            },
            include: {
                projects: {
                    select: {
                        id: true,
                        investor_id: true,
                        investor_profit: true,
                        solis_plant_id: true,
                    },
                },
            },
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Valid invoice not found",
            });
        }

        const investor_id = invoice.projects.investor_id;
        const investor_percent = Number(invoice.projects.investor_profit || 0);
        const invoice_amount = Number(invoice.total_amount || 0);

        if (!investor_id || investor_percent <= 0) {
            return res.status(400).json({
                success: false,
                message: "Investor or profit % missing",
            });
        }

        // Prevent duplicate payout
        const exists = await prisma.payouts.findFirst({
            where: {
                invoice_id: Number(invoice_id),
                project_id: Number(project_id),
                investor_id,
            },
        });

        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Payout already exists for this invoice",
            });
        }

        // Calculate payout amount (SERVER SIDE)
        const payout_amount = (invoice_amount * investor_percent) / 100;

        // Generate payout number
        const now = new Date();
        // payout_prefix logic can remain as is, or you can fetch from settings if needed
        const payout_prefix = `PYT-${now.getUTCFullYear()}`;

        // Get last payout number for this prefix
        let lastPayout = await prisma.payouts.findFirst({
            where: { payout_prefix },
            orderBy: { id: 'desc' },
            select: { payout_number: true }
        });
        let next_payout_number = "001";
        if (lastPayout && lastPayout.payout_number) {
            // Try to parse and increment
            let lastNum = parseInt(lastPayout.payout_number, 10);
            if (!isNaN(lastNum)) {
                next_payout_number = String(lastNum + 1).padStart(3, '0');
            }
        }

        // Handle document upload (image/pdf)
        let documentUrl = null;
        if (req.file) {
            const s3Enabled = await isS3Enabled();
            if (s3Enabled) {
                try {
                    const s3Result = await uploadToS3(
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype,
                        {
                            folder: 'payouts',
                            metadata: {
                                projectId: String(project_id),
                                invoiceId: String(invoice_id),
                                uploadType: 'payout_document'
                            }
                        }
                    );
                    if (s3Result.success) {
                        documentUrl = s3Result.data.fileUrl;
                    }
                } catch (err) {
                    console.error('S3 upload error:', err);
                }
            } else {
                // Local fallback
                const ext = path.extname(req.file.originalname) || '.jpg';
                const base = path.basename(req.file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
                const ts = Date.now();
                const filename = `payout_${base}_${ts}${ext}`;
                const localDir = path.join(__dirname, '../../public/uploads/payouts');
                fs.mkdirSync(localDir, { recursive: true });
                const localPath = path.join(localDir, filename);
                fs.writeFileSync(localPath, req.file.buffer);
                documentUrl = `/uploads/payouts/${filename}`;
            }
        }

        // Create payout
        const payout = await prisma.payouts.create({
            data: {
                payout_number: next_payout_number,
                payout_prefix,
                project_id: Number(project_id),
                invoice_id: Number(invoice_id),
                investor_id,
                invoice_amount,
                investor_percent,
                payout_amount,
                transaction_id,
                document: documentUrl,
                status: "pending",
                created_at: getDateTimeInTZ("Asia/Ho_Chi_Minh"),
            },
        });

        // Increment payout number
        // const newNumber = String(Number(next_payout_number) + 1).padStart(3, "0");
        // await settingsService.set("next_payout_number", newNumber);

        // // Notification
        // await prisma.notifications.create({
        //     data: {
        //         user_id: investor_id,
        //         title: "New Payout Generated",
        //         message: `Your payout ${payout.payout_prefix}-${payout.payout_number} has been created`,
        //         module_type: "payouts",
        //         module_id: payout.id,
        //         action_url: `/investor/payout/${payout.id}`,
        //         is_read: 0,
        //         created_at: new Date(),
        //     },
        // });

        return res.json({
            success: true,
            message: "Payout created successfully",
            data: payout,
        });
    } catch (error) {
        console.error("Create payout error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

// Update payout (transaction_id, document)
router.post("/update", authenticateToken, uploadPayoutDoc.single('document'), async (req, res) => {
    try {
        const { id, transaction_id, mark_as_paid } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: "Payout ID is required" });
        }

        // Find payout
        const payout = await prisma.payouts.findFirst({ where: { id: Number(id) } });
        if (!payout) {
            return res.status(404).json({ success: false, message: "Payout not found" });
        }

        // Handle document upload (image/pdf)
        let documentUrl = payout.document;
        if (req.file) {
            const s3Enabled = await isS3Enabled();
            if (s3Enabled) {
                try {
                    const s3Result = await uploadToS3(
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype,
                        {
                            folder: 'payouts',
                            metadata: {
                                payoutId: String(id),
                                uploadType: 'payout_document_update'
                            }
                        }
                    );
                    if (s3Result.success) {
                        documentUrl = s3Result.data.fileUrl;
                    }
                } catch (err) {
                    console.error('S3 upload error:', err);
                }
            } else {
                // Local fallback
                const ext = path.extname(req.file.originalname) || '.jpg';
                const base = path.basename(req.file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
                const ts = Date.now();
                const filename = `payout_${base}_${ts}${ext}`;
                const localDir = path.join(__dirname, '../../public/uploads/payouts');
                fs.mkdirSync(localDir, { recursive: true });
                const localPath = path.join(localDir, filename);
                fs.writeFileSync(localPath, req.file.buffer);
                documentUrl = `/uploads/payouts/${filename}`;
            }
        }

        // Update payout
        const updated = await prisma.payouts.update({
            where: { id: Number(id) },
            data: {
                transaction_id,
                document: documentUrl,
            },
        });

        if (mark_as_paid === "true" || mark_as_paid === true) {
            await prisma.payouts.update({
                where: { id: Number(id) },
                data: {
                    payout_date: getDateTimeInTZ("Asia/Ho_Chi_Minh"),
                    status: PAYOUT_STATUS.PAYOUT,
                },
            });
        }

        return res.json({ success: true, message: "Payout updated successfully", data: updated });
    } catch (error) {
        console.error("Update payout error:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});

router.delete("/delete/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const payoutId = parseInt(id);
        if (!payoutId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        // Check exists
        const payout = await prisma.payouts.findFirst({
            where: { id: payoutId },
            select: {
                id: true,
                document: true,
            },
        });

        if (!payout) {
            return res.status(404).json({ success: false, message: "Payout not found" });
        }

        if (payout.document) {
            try {
                let fileKey = payout.document;

                // If DB stores FULL URL → extract key
                if (fileKey.startsWith("http")) {
                    const url = new URL(fileKey);
                    fileKey = decodeURIComponent(url.pathname.substring(1));
                }

                await deleteFromS3(fileKey);
                console.log("S3 file deleted:", fileKey);
            } catch (s3Err) {
                console.error("S3 delete failed:", s3Err.message);
            }
        }

        await prisma.payouts.delete({
            where: { id: payoutId },
        });

        return res.status(200)
            .json({ success: true, message: "Invoice deleted successfully" });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// mark as paid
router.post('/mark-as-paid/:id', authenticateToken, uploadPayoutDoc.single('document'), async (req, res) => {
    try {
        const { id } = req.params;
        const { transaction_id } = req.body;

        const payoutId = parseInt(id);
        if (!payoutId) {
            return res.status(400).json({ success: false, message: "Invalid payout ID" });
        }

        // Get existing payout
        const payout = await prisma.payouts.findUnique({
            where: { id: payoutId },
        });

        if (!payout) {
            return res.status(404).json({ success: false, message: "Payout not found" });
        }

        let documentUrl = payout.document;

        // If new file uploaded
        if (req.file) {
            const s3Enabled = await isS3Enabled();

            if (s3Enabled) {
                try {
                    // Upload new file
                    const s3Result = await uploadToS3(
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype,
                        {
                            folder: "payouts",
                            metadata: {
                                payoutId: String(payoutId),
                                uploadType: "payout_document_update",
                            },
                        }
                    );

                    if (s3Result.success) {
                        const newFileUrl = s3Result.data.fileUrl;
                        const newFileKey = s3Result.data.fileKey;

                        // 🔥 Delete old S3 file if exists
                        if (payout.document_key) {
                            await deleteFromS3(payout.document_key);
                        }

                        documentUrl = newFileUrl;

                        // Save key also (important for future delete)
                        await prisma.payouts.update({
                            where: { id: payoutId },
                            data: { document_key: newFileKey },
                        });
                    }
                } catch (err) {
                    console.error("S3 upload error:", err);
                }
            } else {
                //  Local storage fallback
                const ext = path.extname(req.file.originalname) || ".jpg";
                const base = path
                    .basename(req.file.originalname, ext)
                    .replace(/[^a-z0-9-_]/gi, "_");
                const ts = Date.now();
                const filename = `payout_${base}_${ts}${ext}`;
                const localDir = path.join(__dirname, "../../public/uploads/payouts");
                fs.mkdirSync(localDir, { recursive: true });
                const localPath = path.join(localDir, filename);
                fs.writeFileSync(localPath, req.file.buffer);
                documentUrl = `/uploads/payouts/${filename}`;
            }
        }

        //  Final update
        const updated = await prisma.payouts.update({
            where: { id: payoutId },
            data: {
                payout_date: getDateTimeInTZ("Asia/Ho_Chi_Minh"),
                status: PAYOUT_STATUS.PAYOUT,
                transaction_id,
                document: documentUrl,
            },
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error("Mark as paid error:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
}
);



export default router;