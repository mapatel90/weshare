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

// Multer storage for blog images
const blogImagesDir = path.join(PUBLIC_DIR, 'images', 'blog');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(blogImagesDir, { recursive: true });
    cb(null, blogImagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    const ts = Date.now();
    cb(null, `${base}_${ts}${ext}`);
  },
});
const upload = multer({ storage });

router.post("/", authenticateToken, upload.single('blog_image'), async (req, res) => {
  try {
    const { blog_title, blog_date, blog_description, blog_slug } = req.body;
    const userId = req.user?.id; // Get user ID from authenticated token
    
    // Prefer uploaded file
    const uploadedPath = req.file ? `/images/blog/${req.file.filename}` : (req.body.blog_image || null);

    // Basic validation
    if (!blog_title || !blog_date || !uploadedPath || !blog_description || !blog_slug) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const formattedDate = new Date(blog_date);
    if (isNaN(formattedDate)) {
      return res.status(400).json({ success: false, message: "Invalid date format." });
    }

    const blog = await prisma.blogs.create({
      data: {
        title: blog_title,
        date: formattedDate,
        image: uploadedPath,
        description: blog_description,
        slug: blog_slug,
        created_by: userId,
        created_at: new Date(),
      },
    });

    return res.status(201).json({ success: true, data: blog });
  } catch (error) {
    console.error("Error creating blog:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

router.get("/", async (req, res) => {
  try {
    const blogList = await prisma.blogs.findMany({
      where: { is_deleted: 0 },
      orderBy: { date: 'asc' },
    });
    return res.status(200).json({ success: true, data: blogList });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Check slug uniqueness
router.get("/check-slug", async (req, res) => {
  try {
    const { slug, excludeId } = req.query;
    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      return res.status(400).json({ success: false, message: 'slug is required' });
    }

    const parsedExcludeId = excludeId ? parseInt(excludeId) : null;
    const existing = await prisma.blogs.findFirst({
      where: {
        slug: slug,
        is_deleted: 0,
        ...(parsedExcludeId ? { NOT: { id: parsedExcludeId } } : {}),
      },
      select: { id: true },
    });

    return res.status(200).json({ success: true, data: { exists: !!existing } });
  } catch (error) {
    console.error('Error checking blog slug:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Get a single blog by slug or ID
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const isNumeric = /^\d+$/.test(identifier);

    let blog;
    if (isNumeric) {
      blog = await prisma.blogs.findFirst({
        where: { id: parseInt(identifier), is_deleted: 0 },
      });
    } else {
      blog = await prisma.blogs.findFirst({
        where: { 
          slug: identifier,
          is_deleted: 0
        },
      });
    }

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found." });
    }

    return res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    const existing = await prisma.blogs.findFirst({ where: { id: parsedId } });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Blog not found." });
    }

    // Best-effort file cleanup on delete
    const oldPath = existing.image ? path.join(PUBLIC_DIR, existing.image.replace(/^\//, '')) : null;
    if (oldPath && fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (cleanupErr) {
        console.warn("Failed to remove blog image during delete:", cleanupErr);
      }
    }

    await prisma.blogs.update({ where: { id: parsedId }, data: { is_deleted: 1 } });
    return res.status(200).json({ success: true, message: "Blog deleted successfully." });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

router.put("/:id", authenticateToken, upload.single('blog_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { blog_title, blog_date, blog_description, blog_slug } = req.body;

    const formattedDate = new Date(blog_date);
    if (isNaN(formattedDate)) {
      return res.status(400).json({ success: false, message: "Invalid date format." });
    }

    // Determine new image path if uploaded
    let newImagePath = null;
    if (req.file) {
      newImagePath = `/images/blog/${req.file.filename}`;
    }

    // If new image uploaded, remove old file (best-effort)
    if (newImagePath) {
      try {
        const existing = await prisma.blogs.findFirst({ where: { id: parseInt(id) } });
        const oldPath = existing?.image
          ? path.join(PUBLIC_DIR, existing.image.replace(/^\//, ''))
          : null;
        if (oldPath && fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (e) {
        // best effort
      }
    }

    const updatedBlog = await prisma.blogs.update({
      where: { id: parseInt(id) },
      data: {
        title: blog_title,
        date: formattedDate,
        ...(newImagePath ? { image: newImagePath } : {}),
        description: blog_description,
        slug: blog_slug,
      },
    });

    return res.status(200).json({ success: true, data: updatedBlog });
  } catch (error) {
    console.error("Error updating blog:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

export default router;


