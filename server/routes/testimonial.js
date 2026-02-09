import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToS3, isS3Enabled, deleteFromS3 } from '../services/s3Service.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Multer memory storage for S3-friendly uploads; local fallback will write files from buffer
const testimonialImagesDir = path.join(PUBLIC_DIR, 'images', 'testimonial');
const testimonialMemoryStorage = multer.memoryStorage();
const upload = multer({
    storage: testimonialMemoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (validTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'));
        }
    }
});

router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { project, offtaker, description, review_status } = req.body;
        const userId = req.user?.id; // Get user ID from authenticated token

        let uploadedPath = req.body.image || null;

        if (req.file) {
            const s3Enabled = await isS3Enabled();
            if (s3Enabled) {
                try {
                    const s3Result = await uploadToS3(
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype,
                        {
                            folder: 'testimonial',
                            metadata: {
                                projectId: String(project || ''),
                                offtakerId: String(offtaker || ''),
                                uploadType: 'testimonial_image'
                            }
                        }
                    );
                    if (s3Result && s3Result.success) {
                        uploadedPath = s3Result.data.fileKey;
                    } else {
                        console.error('S3 upload failed:', s3Result);
                        return res.status(500).json({ error: 'S3 upload failed' });
                    }
                } catch (err) {
                    console.error('S3 upload error:', err);
                    return res.status(500).json({ error: 'S3 upload failed' });
                }
            } else {
                return res.status(500).json({ error: 'S3 is disabled' });
            }
        }

        if (!project || !offtaker || !uploadedPath || !description || !review_status) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const testimonial = await prisma.testimonials.create({
            data: {
                project_id: Number(project),
                offtaker_id: Number(offtaker),
                image: uploadedPath,
                description,
                review_status: Number(review_status),
                created_by: userId,
                created_at: new Date(),
            }
        });

        res.status(200).json(testimonial);
    } catch (error) {
        console.error('Error creating testimonial:', error);
        res.status(500).json({ error: 'Failed to create testimonial' });
    }
});

router.get('/', async (req, res) => {
    try {
        const testimonials = await prisma.testimonials.findMany({
            where: { is_deleted: 0 },
            include: {
                projects: { select: { id: true, project_name: true } },
                users: { select: { id: true, full_name: true } }
            }
        });
        res.json(testimonials);
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
});

router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { project, offtaker, description, review_status } = req.body;

        if (!project || !offtaker || !description || !review_status) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let newImagePath = null;

        if (req.file) {
            const s3Enabled = await isS3Enabled();
            if (s3Enabled) {
                try {
                    const s3Result = await uploadToS3(
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype,
                        {
                            folder: 'testimonial',
                            metadata: {
                                testimonialId: String(id),
                                uploadType: 'testimonial_image_update'
                            }
                        }
                    );
                    if (s3Result && s3Result.success) {
                        newImagePath = s3Result.data.fileKey;

                        // Attempt to delete old S3 file if previous image was a remote URL
                        try {
                            const existing = await prisma.testimonials.findFirst({ where: { id: Number(id) } });
                            if (existing?.image && existing.image.startsWith('http')) {
                                try {
                                    const url = new URL(existing.image);
                                    const key = decodeURIComponent(url.pathname.substring(1));
                                    await deleteFromS3(key);
                                } catch (delErr) {
                                    console.error('Failed deleting old S3 testimonial image:', delErr.message || delErr);
                                }
                            }
                        } catch (e) {
                            // ignore
                        }
                    } else {
                        console.error('S3 upload failed:', s3Result);
                        return res.status(500).json({ error: 'S3 upload failed' });
                    }
                } catch (err) {
                    console.error('S3 upload error:', err);
                    return res.status(500).json({ error: 'S3 upload failed' });
                }
            } else {
                return res.status(500).json({ error: 'S3 is disabled' });
            }
        }

        const updatedTestimonial = await prisma.testimonials.update({
            where: { id: Number(id) },
            data: {
                project_id: Number(project),
                offtaker_id: Number(offtaker),
                ...(newImagePath ? { image: newImagePath } : {}),
                description,
                review_status: Number(review_status),
            }
        });

        res.status(200).json(updatedTestimonial);
    } catch (error) {
        console.error('Error updating testimonial:', error);
        res.status(500).json({ error: 'Failed to update testimonial' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.testimonials.findFirst({ where: { id: Number(id) } });

        // best-effort delete remote S3 or local image when soft deleting
        try {
            if (existing?.image) {
                if (existing.image.startsWith('http')) {
                    try {
                        const url = new URL(existing.image);
                        const key = decodeURIComponent(url.pathname.substring(1));
                        await deleteFromS3(key);
                    } catch (s3Err) {
                        console.error('S3 delete failed:', s3Err.message || s3Err);
                    }
                } else {
                    const oldPath = path.join(PUBLIC_DIR, existing.image.replace(/^\//, ''));
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
            }
        } catch (e) {
            // ignore
        }

        await prisma.testimonials.update({
            where: { id: Number(id) },
            data: { is_deleted: 1 }
        });

        res.status(200).json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({ error: 'Failed to delete testimonial' });
    }
});

export default router;