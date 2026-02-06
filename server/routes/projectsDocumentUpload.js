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
import { uploadToS3, deleteFromS3, isS3Enabled } from '../services/s3Service.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Multer memory storage for project documents/images (for S3 upload)
const projectDocumentMemoryStorage = multer.memoryStorage();
const upload = multer({
    storage: projectDocumentMemoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (validTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'));
        }
    }
});


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
        
        // Handle document upload (image/pdf) with S3
        let uploadedPath = null;
        if (req.file) {
            const s3Enabled = await isS3Enabled();
            if (s3Enabled) {
                try {
                    const s3Result = await uploadToS3(
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype,
                        {
                            folder: 'project-documents',
                            metadata: {
                                projectId: String(project_id || ''),
                                uploadType: 'project_document'
                            }
                        }
                    );
                    if (s3Result.success) {
                        uploadedPath = s3Result.data.fileKey;
                    }
                } catch (err) {
                    console.error('S3 upload error:', err);
                }
            } else {
                return res.status(500).json({ success: false, message: 'S3 is disabled' });
            }
        } else if (documentUpload) {
            uploadedPath = documentUpload;
        }

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
        
        // Get existing document
        const existing = await prisma.project_documents.findFirst({ where: { id: Number(id) } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        
        let updateData = {
            title,
            notes: notes || null,
            amount: amount ? Number(amount) : null,
            created_by: Number(created_by),
        };
        if (project_id) {
            updateData.projects = { connect: { id: Number(project_id) } };
        }
        
        // Handle document upload with S3
        if (req.file) {
            const s3Enabled = await isS3Enabled();
            if (s3Enabled) {
                try {
                    // Delete old file from S3 if exists
                    if (existing.document) {
                        try {
                            let fileKey = existing.document;
                            if (fileKey.startsWith('http')) {
                                const url = new URL(fileKey);
                                fileKey = url.pathname.substring(1);
                            }
                            await deleteFromS3(fileKey);
                            console.log('Old S3 file deleted:', fileKey);
                        } catch (s3Err) {
                            console.error('S3 delete failed:', s3Err.message);
                        }
                    }
                    
                    // Upload new file to S3
                    const s3Result = await uploadToS3(
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype,
                        {
                            folder: 'project-documents',
                            metadata: {
                                projectId: String(project_id || ''),
                                uploadType: 'project_document'
                            }
                        }
                    );
                    if (s3Result.success) {
                        updateData.document = s3Result.data.fileKey;
                    }
                } catch (err) {
                    console.error('S3 upload error:', err);
                }
            } else {
                return res.status(500).json({ success: false, message: 'S3 is disabled' });
            }
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
        
        // Get existing document to delete file
        const existing = await prisma.project_documents.findFirst({ where: { id: Number(id) } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        
        // Delete the document file if it exists
        if (existing.document) {
            try {
                let fileKey = existing.document;
                if (fileKey.startsWith('http')) {
                    const url = new URL(fileKey);
                    fileKey = url.pathname.substring(1);
                }
                await deleteFromS3(fileKey);
                console.log('S3 document file deleted:', fileKey);
            } catch (fileError) {
                console.error('Failed to delete document from S3:', fileError);
            }
        }
        
        await prisma.project_documents.delete({ where: { id: Number(id) } });
        return res.json({ success: true, message: "Document deleted successfully!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
});


export default router;
