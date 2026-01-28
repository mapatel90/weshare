import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createBulkNotifications, createNotification } from '../utils/notifications.js';
import { getUserLanguage, t } from '../utils/i18n.js';
import { getUserFullName } from '../utils/common.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Multer storage for contract documents/images
const project_document_dir = path.join(ROOT_DIR, 'uploads', 'projects');
const project_document_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdirSync(project_document_dir, { recursive: true });
        cb(null, project_document_dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
        const ts = Date.now();
        cb(null, `${base}_${ts}${ext}`);
    },
});

const upload = multer({ storage: project_document_storage });


router.post("/", authenticateToken, upload.single('document'), async (req, res) => {
    try {
        const {
            project_id,
            title,
            notes,
            amount,
            documentUpload,
            created_by
        } = req.body;
        // prefer uploaded file path.
        const buildPublicImagePath = (filename) => `/uploads/projects/${filename}`;
        const uploadedPath = req.file ? buildPublicImagePath(req.file.filename) : (documentUpload || null);

        if (!title) {
            return res.status(400).json({ success: false, message: 'title is required' });
        }
        const created = await prisma.project_documents.create({
            data: {
                projects: project_id ? { connect: { id: Number(project_id) } } : undefined,
                title,
                notes: notes || null,
                amount: amount ? Number(amount) : null,
                document: uploadedPath || null,
                created_by: Number(created_by),
            },
        });

        return res.status(201).json({ success: true, data: created });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const {
            project_id,
            page = 1,
            limit,
            search,
            downloadAll,
        } = req.query;

        const parsedLimit = Number(limit);
        const limitNumber = !Number.isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : null;
        const fetchAll = downloadAll === "1" || downloadAll === "true" || !limitNumber;

        let where = {
            //   ...(id ? { id: Number(id) } : {}),
            ...(project_id ? { project_id: Number(project_id) } : {}),
        };

        // Search functionality
        const trimmedSearch = typeof search === "string" ? search.trim() : "";
        if (trimmedSearch) {
            const numericSearch = Number(trimmedSearch);

            const orFilters = [
                { title: { contains: trimmedSearch, mode: "insensitive" } },
                { projects: { project_name: { contains: trimmedSearch, mode: "insensitive" } } },
            ];

            if (orFilters.length) {
                where.AND = [...(where.AND || []), { OR: orFilters }];
            }
        }

        // Get total count
        let totalCount = await prisma.project_documents.count({ where });
        const skip = (Number(page) - 1) * (limitNumber || 20);

        const data = await prisma.project_documents.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip: fetchAll ? 0 : skip,
            take: fetchAll ? undefined : limitNumber,
            include: {
                projects: {
                    include: {
                        cities: true,
                        states: true,
                        countries: true,
                        project_types: true,
                    },
                },
            },
        });

        const effectiveLimit = limitNumber || totalCount;
        const returnedCount = fetchAll ? totalCount : Math.min(totalCount, effectiveLimit);
        const pageSize = 20;

        return res.json({
            success: true,
            data,
            pagination: {
                page: Number(page),
                limit: fetchAll ? totalCount : effectiveLimit,
                total: returnedCount,
                pages: Math.max(1, Math.ceil(returnedCount / pageSize)),
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
});


// Update a project document (with/without file)
router.put("/:id", authenticateToken, upload.single('document'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            project_id,
            title,
            notes,
            amount,
            created_by
        } = req.body;
        let updateData = {
            title,
            notes: notes || null,
            amount: amount ? Number(amount) : null,
            created_by: Number(created_by),
        };
        if (project_id) {
            updateData.projects = { connect: { id: Number(project_id) } };
        }
        if (req.file) {
            updateData.document = `/images/projects/${req.file.filename}`;
        }
        const updated = await prisma.project_documents.update({
            where: { id: Number(id) },
            data: updateData,
        });
        return res.json({ success: true, data: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Delete a project document
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.project_documents.delete({ where: { id: Number(id) } });
        return res.json({ success: true, message: "Document deleted successfully!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
});


export default router;
