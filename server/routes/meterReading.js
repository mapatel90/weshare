import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadToS3, isS3Enabled } from '../services/s3Service.js';
import { t } from '../utils/i18n.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Multer storage for local fallback (if S3 disabled)
const meterImagesDir = path.join(PUBLIC_DIR, 'images', 'meter-readings');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(meterImagesDir, { recursive: true });
    cb(null, meterImagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    const ts = Date.now();
    cb(null, `meter_${base}_${ts}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// List meter readings (with search + pagination)
// When project_id is provided (e.g. admin view), list all readings for that project.
// Otherwise offtaker_id is required and list is filtered by offtaker.
router.get('/', authenticateToken, async (req, res) => {
  try {
    const language = req.currentLanguage;
    const offtakerId = req.query.offtaker_id || req.user?.id;
    const projectId = req.query.project_id;
    const search = (req.query.search || '').toString().trim();
    const page = Number.parseInt(req.query.page, 10) > 0 ? Number.parseInt(req.query.page, 10) : 1;
    const limitRaw = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 10;

    const where = {
      is_deleted: 0,
    };

    if (projectId) {
      where.project_id = parseInt(projectId, 10);
    } else {
      if (!offtakerId) {
        return res.status(400).json({
          success: false,
          message: t(language, 'response_messages.offtaker_id_required', 'Offtaker id is required'),
        });
      }
      where.offtaker_id = parseInt(offtakerId, 10);
    }

    if (search) {
      where.projects = {
        project_name: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    const [readings, total] = await Promise.all([
      prisma.meter_reading.findMany({
        where,
        orderBy: {
          meter_reading_date: 'desc',
        },
        include: {
          projects: true,
          users: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.meter_reading.count({ where }),
    ]);

    res.json({
      success: true,
      data: readings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('List meter readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// Create meter reading
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const language = req.currentLanguage;
    const { project_id, meter_reading_date, offtaker_id } = req.body;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: t(language, 'response_messages.project_id_required_parameters', 'Project id is required'),
      });
    }

    if (!offtaker_id) {
      return res.status(400).json({
        success: false,
        message: t(language, 'response_messages.offtaker_id_required', 'Offtaker id is required'),
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: t(language, 'response_messages.file_required', 'Meter image is required'),
      });
    }

    // Check duplicate: same project_id and same date (day-level)
    const readingDateForCheck = meter_reading_date ? new Date(meter_reading_date) : new Date();
    const startOfDay = new Date(readingDateForCheck);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(readingDateForCheck);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.meter_reading.findFirst({
      where: {
        project_id: parseInt(project_id),
        is_deleted: 0,
        meter_reading_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: t(language, 'response_messages.meter_reading_already_exists_for_this_date', 'A meter reading already exists for this project on the selected date'),
      });
    }

    // Upload image - prefer S3
    let imagePath = null;
    const s3Enabled = await isS3Enabled();

    if (s3Enabled) {
      try {
        const buffer = fs.readFileSync(req.file.path);
        const s3Result = await uploadToS3(buffer, req.file.originalname, req.file.mimetype, {
          folder: 'meter-readings',
          metadata: {
            uploadedBy: String(req.user?.id || ''),
            originalName: req.file.originalname,
          },
        });

        if (s3Result && s3Result.success) {
          imagePath = s3Result.data.fileKey;
        } else {
          console.error('S3 upload failed for meter reading:', s3Result);
        }
      } catch (err) {
        console.error('S3 upload error for meter reading:', err?.message || err);
      }
    }

    // Fallback to local path if S3 disabled or failed
    // if (!imagePath) {
    //   imagePath = `/images/meter-readings/${req.file.filename}`;
    // }

    const readingDate = meter_reading_date
      ? new Date(meter_reading_date)
      : new Date();

    const created = await prisma.meter_reading.create({
      data: {
        project_id: parseInt(project_id),
        offtaker_id: parseInt(offtaker_id),
        image: imagePath,
        meter_reading_date: readingDate,
        is_deleted: 0,
      },
    });

    res.json({
      success: true,
      data: created,
    });
  } catch (error) {
    console.error('Create meter reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// Update meter reading
router.put('/:id', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const language = req.currentLanguage;
    const id = parseInt(req.params.id);

    const existing = await prisma.meter_reading.findFirst({
      where: {
        id,
        is_deleted: 0,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: t(language, 'response_messages.record_not_found', 'Meter reading not found'),
      });
    }

    const { project_id, meter_reading_date, offtaker_id } = req.body;

    let imagePath = existing.image;
    const s3Enabled = await isS3Enabled();

    if (req.file && s3Enabled) {
      try {
        const buffer = fs.readFileSync(req.file.path);
        const s3Result = await uploadToS3(buffer, req.file.originalname, req.file.mimetype, {
          folder: 'meter-readings',
          metadata: {
            uploadedBy: String(req.user?.id || ''),
            originalName: req.file.originalname,
          },
        });

        if (s3Result && s3Result.success) {
          imagePath = s3Result.data.fileKey;
        } else {
          console.error('S3 upload failed for meter reading update:', s3Result);
        }
      } catch (err) {
        console.error('S3 upload error for meter reading update:', err?.message || err);
      }
    }

    const readingDate = meter_reading_date
      ? new Date(meter_reading_date)
      : existing.meter_reading_date || new Date();

    const updated = await prisma.meter_reading.update({
      where: { id },
      data: {
        project_id: project_id ? parseInt(project_id) : existing.project_id,
        offtaker_id: offtaker_id ? parseInt(offtaker_id) : existing.offtaker_id,
        image: imagePath,
        meter_reading_date: readingDate,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update meter reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// Soft delete meter reading
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const language = req.currentLanguage;
    const id = parseInt(req.params.id);

    const existing = await prisma.meter_reading.findFirst({
      where: {
        id,
        is_deleted: 0,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: t(language, 'response_messages.record_not_found', 'Meter reading not found'),
      });
    }

    await prisma.meter_reading.update({
      where: { id },
      data: {
        is_deleted: 1,
      },
    });

    res.json({
      success: true,
      message: t(language, 'response_messages.deleted_successfully', 'Meter reading deleted successfully'),
    });
  } catch (error) {
    console.error('Delete meter reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

export default router;

