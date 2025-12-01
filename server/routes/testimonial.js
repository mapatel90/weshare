import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Multer storage for testimonial images
const testimonialImagesDir = path.join(PUBLIC_DIR, 'images', 'testimonial');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdirSync(testimonialImagesDir, { recursive: true });
        cb(null, testimonialImagesDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
        const ts = Date.now();
        cb(null, `${base}_${ts}${ext}`);
    },
});
const upload = multer({ storage });

router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { project, offtaker, description, review_status } = req.body;

        // Prefer uploaded file path; fallback to provided string
        const uploadedPath = req.file ? `/images/testimonial/${req.file.filename}` : (req.body.image || null);

        if (!project || !offtaker || !uploadedPath || !description || !review_status) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const testimonial = await prisma.testimonial.create({
            data: {
                project_id: Number(project),
                offtaker_id: Number(offtaker),
                image: uploadedPath,
                description,
                review_status: Number(review_status),
            }
        });

        res.status(201).json(testimonial);
    } catch (error) {
        console.error('Error creating testimonial:', error);
        res.status(500).json({ error: 'Failed to create testimonial' });
    }
});

router.get('/', async (req, res) => {
    try {
        const testimonials = await prisma.testimonial.findMany({
            where: { is_deleted: 0 },
            include: {
                project: { select: { id: true, project_name: true } },
                offtaker: { select: { id: true, fullName: true } }
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

        // Determine new image path if uploaded
        let newImagePath = null;
        if (req.file) {
            newImagePath = `/images/testimonial/${req.file.filename}`;
        }

        // If a new image uploaded, best-effort delete old one
        if (newImagePath) {
            try {
                const existing = await prisma.testimonial.findUnique({ where: { id: Number(id) } });
                const oldPath = existing?.image
                    ? path.join(PUBLIC_DIR, existing.image.replace(/^\//, ''))
                    : null;
                if (oldPath && fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            } catch (e) {
                // ignore
            }
        }

        const updatedTestimonial = await prisma.testimonial.update({
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
        const existing = await prisma.testimonial.findUnique({ where: { id: Number(id) } });
        await prisma.testimonial.update({
            where: { id: Number(id) },
            data: { is_deleted: 1 }
        });
        // best-effort delete image file when soft deleting
        try {
            const oldPath = existing?.image
                ? path.join(PUBLIC_DIR, existing.image.replace(/^\//, ''))
                : null;
            if (oldPath && fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        } catch (e) {
            // ignore
        }
        res.status(200).json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({ error: 'Failed to delete testimonial' });
    }
});

export default router;