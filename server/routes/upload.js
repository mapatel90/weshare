import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import { uploadToS3, isS3Enabled } from '../services/s3Service.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload endpoint
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const folder = req.body?.folder || 'general';

    // Try S3 first when enabled
    const s3Enabled = await isS3Enabled();
    if (s3Enabled) {
      try {
        const result = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, {
          folder,
          metadata: {
            uploadedBy: String(req.user?.id || ''),
            originalName: req.file.originalname,
          },
        });

        // Normalize response to include `data.url` for frontend compatibility
        return res.json({
          success: true,
          data: {
            url: result.data.fileUrl,
            fileKey: result.data.fileKey,
            fileName: result.data.fileName,
            mimeType: result.data.mimeType,
            size: result.data.fileSize,
          },
        });
      } catch (s3Err) {
        console.error('S3 upload failed, falling back to local:', s3Err.message || s3Err);
        // continue to local fallback
      }
    }

    // Local fallback (write to public/images/<folder>)
    const uploadDir = path.join(__dirname, `../../public/images/${folder}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname);
    const name = path.basename(req.file.originalname, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);
    const fileUrl = `/images/${folder}/${filename}`;

    res.json({
      success: true,
      data: {
        filename,
        url: fileUrl,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed',
    });
  }
});

export default router;
