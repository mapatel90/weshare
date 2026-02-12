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

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { project, user, description, review_status } = req.body;
        const userId = req.user?.id; 

        if (!project || !user || !description || !review_status) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const testimonial = await prisma.testimonials.create({
            data: {
                project_id: Number(project),
                user_id: Number(user),
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
                users: { select: { id: true, full_name: true, user_image: true, role_id: true } }
            }
        });
        res.json(testimonials);
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
});

// Get user's review for a specific project
router.get('/user-review', authenticateToken, async (req, res) => {
    try {
        const { project_id } = req.query;
        const userId = req.user?.id;

        if (!project_id || !userId) {
            return res.status(400).json({ success: false, error: 'Project ID and User ID are required' });
        }

        const review = await prisma.testimonials.findFirst({
            where: {
                project_id: Number(project_id),
                user_id: Number(userId),
                is_deleted: 0
            },
            include: {
                projects: { select: { id: true, project_name: true } },
                users: { select: { id: true, full_name: true } }
            }
        });

        res.json({ success: true, data: review });
    } catch (error) {
        console.error('Error fetching user review:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user review' });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { project, user, description, review_status } = req.body;

        if (!project || !user || !description || !review_status) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const updatedTestimonial = await prisma.testimonials.update({
            where: { id: Number(id) },
            data: {
                project_id: Number(project),
                user_id: Number(user),
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