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

// Multer storage for news images
const newsImagesDir = path.join(PUBLIC_DIR, 'images', 'news');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(newsImagesDir, { recursive: true });
    cb(null, newsImagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    const ts = Date.now();
    cb(null, `${base}_${ts}${ext}`);
  },
});
const upload = multer({ storage });

router.post("/", authenticateToken, upload.single('news_image'), async (req, res) => {
  try {
    const { news_title, news_date, news_description, news_slug } = req.body;
    const userId = req.user?.id; // Get user ID from authenticated token
    
    // Prefer uploaded file. If S3 enabled, try uploading file to S3 and use returned URL.
    let uploadedPath = req.body.news_image || null;
    if (req.file) {
      const s3Enabled = await isS3Enabled();
      if (s3Enabled) {
        try {
          const buffer = fs.readFileSync(req.file.path);
          const s3Result = await uploadToS3(buffer, req.file.originalname, req.file.mimetype, {
            folder: 'news',
            metadata: { uploadedBy: String(req.user?.id || '') },
          });
          if (s3Result && s3Result.success) {
            uploadedPath = s3Result.data.fileUrl;
          } else {
            console.error('S3 upload failed:', s3Result);
            return res.status(500).json({ success: false, message: 'S3 upload failed' });
          }
        } catch (err) {
          console.error('S3 upload error for news image:', err?.message || err);
          return res.status(500).json({ success: false, message: 'S3 upload failed' });
        }
      } else {
        return res.status(500).json({ success: false, message: 'S3 is disabled' });
      }

    }

    // Basic validation
    if (!news_title || !news_date || !uploadedPath || !news_description || !news_slug) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

     const formattedDate = new Date(news_date); // "2025-11-11" → Date object

    if (isNaN(formattedDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format.",
      });
    }

    const news = await prisma.news.create({
      data: {
        title: news_title,
        date: formattedDate,
        image: uploadedPath,
        description: news_description,
        slug: news_slug,
        created_by: userId,
        created_at: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error("Error creating news:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const newsList = await prisma.news.findMany({
      where: { is_deleted: 0 }, 
      orderBy: { date: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: newsList,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
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
    const existing = await prisma.news.findFirst({
      where: {
        slug: slug,
        is_deleted: 0,
        ...(parsedExcludeId ? { NOT: { id: parsedExcludeId } } : {}),
      },
      select: { id: true },
    });

    return res.status(200).json({
      success: true,
      data: { exists: !!existing },
    });
  } catch (error) {
    console.error('Error checking slug:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Get a single news item by slug or ID
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is a number (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);
    
    let news;
    if (isNumeric) {
      // Try to find by ID
      news = await prisma.news.findFirst({
        where: { 
          id: parseInt(identifier),
          is_deleted: 0 
        },
      });
    } else {
      // Try to find by slug
      news = await prisma.news.findFirst({
        where: { 
          slug: identifier,
          is_deleted: 0 
        },
      });
    }

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);

    const existing = await prisma.news.findFirst({ where: { id: parsedId } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "News not found.",
      });
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
            console.warn('Failed to delete news image from S3:', s3Err.message || s3Err);
          }
        } else {
          console.warn('Local news image deletion not implemented:', existing.image);
        }
      }
    } catch (e) {
      // ignore cleanup errors
    }

    await prisma.news.update({
      where: { id: parsedId },
      data: { is_deleted: 1 },
    });

    return res.status(200).json({
      success: true,
      message: "News deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting news:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

router.put("/:id", authenticateToken, upload.single('news_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { news_title, news_date, news_description, news_slug } = req.body;    

    const formattedDate = new Date(news_date);
    if (isNaN(formattedDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format.",
      });
    }

    // Determine new image path if uploaded (attempt S3 then fallback local)
    let newImagePath = null;
    if (req.file) {
      const s3Enabled = await isS3Enabled();
      if (s3Enabled) {
        try {
          const buffer = fs.readFileSync(req.file.path);
          const s3Result = await uploadToS3(buffer, req.file.originalname, req.file.mimetype, {
            folder: 'news',
            metadata: { uploadType: 'news_image', newsId: String(id) },
          });
          if (s3Result && s3Result.success) {
            newImagePath = s3Result.data.fileUrl;
            // try to remove local temp
            try { if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch(_){}
          } else {
            console.error('S3 upload failed:', s3Result);
            return res.status(500).json({ success: false, message: 'S3 upload failed' });
          }
        } catch (err) {
          console.error('S3 upload error for news image (update):', err?.message || err);
          return res.status(500).json({ success: false, message: 'S3 upload failed' });
        }
      } else {
        return res.status(500).json({ success: false, message: 'S3 is disabled' });
      }
      try {
        const existing = await prisma.news.findFirst({ where: { id: parseInt(id) } });
        if (existing?.image) {
          let old = existing.image;
          if (old.startsWith('http')) {
            try {
              const url = new URL(old);
              const key = decodeURIComponent(url.pathname.substring(1));
              await deleteFromS3(key).catch(() => {});
            } catch (e) {
              console.warn('Failed to delete old news image from S3:', e?.message || e);
            }
          } else {
            try {
              const oldPath = path.join(PUBLIC_DIR, old.replace(/^\//, ''));
              if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            } catch (e) {
              console.warn('Failed to delete old local news image:', e?.message || e);
            }
          }
        }
      } catch (e) {
        // ignore cleanup errors
      }
    }

    const updatedNews = await prisma.news.update({
      where: { id: parseInt(id) },
      data: {
        title: news_title,
        date: formattedDate,
        ...(newImagePath ? { image: newImagePath } : {}),
        description: news_description,
        slug: news_slug,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedNews,
    });
  } catch (error) {
    console.error("Error updating news:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

export default router;
