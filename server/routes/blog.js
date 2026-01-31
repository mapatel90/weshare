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

// Multer memory storage for S3-friendly uploads; local fallback writes from buffer
const blogImagesDir = path.join(PUBLIC_DIR, 'images', 'blog');
const blogMemoryStorage = multer.memoryStorage();
const upload = multer({
  storage: blogMemoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (validTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

router.post("/", authenticateToken, upload.single('blog_image'), async (req, res) => {
  try {
    const { blog_title, blog_date, blog_description, blog_slug } = req.body;
    const userId = req.user?.id; // Get user ID from authenticated token
    
    // Prefer uploaded file (S3 or local) or provided URL
    let uploadedPath = req.body.blog_image || null;

    if (req.file) {
      const s3Enabled = await isS3Enabled();
      if (s3Enabled) {
        try {
          const s3Result = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            { folder: 'blog', metadata: { uploadType: 'blog_image' } }
          );
          if (s3Result && s3Result.success) {
            uploadedPath = s3Result.data.fileUrl;
          } else {
            console.error('S3 upload failed:', s3Result);
            return res.status(500).json({ success: false, message: 'S3 upload failed' });
          }
        } catch (err) {
          console.error('S3 upload error:', err);
          return res.status(500).json({ success: false, message: 'S3 upload failed' });
        }
      } else {
        return res.status(500).json({ success: false, message: 'S3 is disabled' });
      }
    }

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

    // Best-effort file cleanup on delete (S3 or local)
    try {
      if (existing?.image) {
        if (existing.image.startsWith('http')) {
          try {
            const url = new URL(existing.image);
            const key = decodeURIComponent(url.pathname.substring(1));
            await deleteFromS3(key);
          } catch (s3Err) {
            console.warn('Failed to delete blog image from S3:', s3Err.message || s3Err);
          }
        } else {
          console.warn('Local blog image deletion not implemented:', existing.image);
        }
      }
    } catch (e) {
      // ignore
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

    // Determine new image path if uploaded (S3 or local)
    let newImagePath = null;
    if (req.file) {
      const s3Enabled = await isS3Enabled();
      if (s3Enabled) {
        try {
          const s3Result = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            { folder: 'blog', metadata: { uploadType: 'blog_image_update', blogId: String(id) } }
          );
          if (s3Result && s3Result.success) {
            newImagePath = s3Result.data.fileUrl;

            // delete old S3 file if previous image was remote
            try {
              const existing = await prisma.blogs.findFirst({ where: { id: parseInt(id) } });
              if (existing?.image && existing.image.startsWith('http')) {
                try {
                  const url = new URL(existing.image);
                  const key = decodeURIComponent(url.pathname.substring(1));
                  await deleteFromS3(key);
                } catch (delErr) {
                  console.error('Failed deleting old S3 blog image:', delErr.message || delErr);
                }
              }
            } catch (e) {
              // ignore
            }
          } else {
            console.error('S3 upload failed:', s3Result);
            return res.status(500).json({ success: false, message: 'S3 upload failed' });
          }
        } catch (err) {
          console.error('S3 upload error:', err);
          return res.status(500).json({ success: false, message: 'S3 upload failed' });
        }
      } else {
        return res.status(500).json({ success: false, message: 'S3 is disabled' });
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


