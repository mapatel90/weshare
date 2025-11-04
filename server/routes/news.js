import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer storage for news images
const newsImagesDir = path.join(process.cwd(), 'public', 'images', 'news');
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
    // Prefer uploaded file
    const uploadedPath = req.file ? `/images/news/${req.file.filename}` : (req.body.news_image || null);

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
        news_title,
        news_date: formattedDate,
        news_image: uploadedPath,
        news_description,
        news_slug,
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

router.get("/", authenticateToken, async (req, res) => {
  try {
    const newsList = await prisma.news.findMany({
      where: { is_deleted: 0 }, 
      orderBy: { news_date: 'asc' },
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

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.news.update({
      where: { id: parseInt(id) },
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

    // Determine new image path if uploaded
    let newImagePath = null;
    if (req.file) {
      newImagePath = `/images/news/${req.file.filename}`;
    }

    // If new image uploaded, remove old file (best-effort)
    if (newImagePath) {
      try {
        const existing = await prisma.news.findUnique({ where: { id: parseInt(id) } });
        const oldPath = existing?.news_image ? path.join(process.cwd(), 'public', existing.news_image.replace(/^\//, '')) : null;
        if (oldPath && fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (e) {
        // best effort, ignore
      }
    }

    const updatedNews = await prisma.news.update({
      where: { id: parseInt(id) },
      data: {
        news_title,
        news_date: formattedDate,
        ...(newImagePath ? { news_image: newImagePath } : {}),
        news_description,
        news_slug,
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
