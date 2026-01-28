import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import {
  uploadToS3,
  deleteFromS3,
  generateSignedUrl,
  isS3Enabled,
} from '../services/s3Service.js';

const router = express.Router();

// Multer memory storage for S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

/**
 * @route   POST /api/s3-upload
 * @desc    Upload file to S3 (reads config from settings table)
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    try {
      // Check if S3 is enabled
      const s3Enabled = await isS3Enabled();
      if (!s3Enabled) {
        return res.status(400).json({
          success: false,
          message: 'S3 integration is not configured or enabled',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const { folder } = req.body;

      const result = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        {
          folder,
          metadata: {
            uploadedBy: String(req.user.id),
            originalName: req.file.originalname,
          },
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload file',
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/s3-upload/multiple
 * @desc    Upload multiple files to S3
 * @access  Private
 */
router.post(
  '/multiple',
  authenticateToken,
  upload.array('files', 10), // Max 10 files
  async (req, res) => {
    try {
      const s3Enabled = await isS3Enabled();
      if (!s3Enabled) {
        return res.status(400).json({
          success: false,
          message: 'S3 integration is not configured or enabled',
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
      }

      const { folder } = req.body;

      const uploadPromises = req.files.map((file) =>
        uploadToS3(file.buffer, file.originalname, file.mimetype, {
          folder,
          metadata: {
            uploadedBy: String(req.user.id),
            originalName: file.originalname,
          },
        })
      );

      const results = await Promise.all(uploadPromises);

      res.json({
        success: true,
        data: results.map((r) => r.data),
      });
    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload files',
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/s3-upload/delete
 * @desc    Delete file from S3
 * @access  Private
 */
router.post('/delete', authenticateToken, async (req, res) => {
  try {
    const { fileKey } = req.body;

    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: 'File key is required',
      });
    }

    const result = await deleteFromS3(fileKey);
    res.json(result);
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/s3-upload/signed-url
 * @desc    Generate signed URL for private file
 * @access  Private
 */
router.post('/signed-url', authenticateToken, async (req, res) => {
  try {
    const { fileKey, expiresIn } = req.body;

    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: 'File key is required',
      });
    }

    const signedUrl = await generateSignedUrl(fileKey, expiresIn);

    res.json({
      success: true,
      data: { signedUrl },
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate signed URL',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/s3-upload/status
 * @desc    Check if S3 is enabled and configured
 * @access  Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const enabled = await isS3Enabled();

    res.json({
      success: true,
      data: {
        enabled,
        message: enabled
          ? 'S3 is configured and enabled'
          : 'S3 is not configured',
      },
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        enabled: false,
        message: 'S3 is not configured',
      },
    });
  }
});

export default router;
