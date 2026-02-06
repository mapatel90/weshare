import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { validateS3Credentials, S3_KEYS } from '../services/s3Service.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/s3-settings
 * @desc    Get current S3 settings
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: Object.values(S3_KEYS),
        },
      },
    });

    if (settings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'S3 settings not configured',
      });
    }

    // Convert to key-value object and mask secret key
    const settingsObj = {};
    settings.forEach((setting) => {
      if (setting.key === S3_KEYS.SECRET_ACCESS_KEY) {
        // Decrypt first to verify it's valid, then mask for display
        try {
          if (setting.value) {
            decrypt(setting.value); // Verify it can be decrypted
          }
          settingsObj[setting.key] = '***********'; // Masked
        } catch (error) {
          console.error('Error decrypting S3 secret key:', error);
          settingsObj[setting.key] = '***********'; // Still mask even if decryption fails
        }
      } else {
        settingsObj[setting.key] = setting.value;
      }
    });

    res.json({
      success: true,
      data: settingsObj,
    });
  } catch (error) {
    console.error('Error fetching S3 settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch S3 settings',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/s3-settings
 * @desc    Create or update S3 settings
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      aws_access_key_id,
      aws_secret_access_key,
      aws_region,
      s3_bucket_name,
      s3_folder_path,
      s3_public_url,
      file_visibility,
      signed_url_expiry,
    } = req.body;

    // Get existing secret key if not provided in request
    let secretKeyToUse = aws_secret_access_key;
    let encryptedSecretKey;

    if (!aws_secret_access_key || aws_secret_access_key === '***********') {
      // Try to get existing secret key
      const existingSecret = await prisma.settings.findFirst({
        where: { key: S3_KEYS.SECRET_ACCESS_KEY },
      });

      if (existingSecret) {
        // Use existing encrypted key (don't decrypt/re-encrypt)
        encryptedSecretKey = existingSecret.value;
        secretKeyToUse = decrypt(existingSecret.value);
      } else {
        // No existing secret and none provided
        return res.status(400).json({
          success: false,
          message: 'AWS Secret Access Key is required',
        });
      }
    } else {
      // New secret key provided, encrypt it
      encryptedSecretKey = encrypt(aws_secret_access_key);
    }

    // Validation
    if (!aws_access_key_id || !aws_region || !s3_bucket_name) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: aws_access_key_id, aws_region, s3_bucket_name',
      });
    }

    // Validate AWS credentials
    const validation = await validateS3Credentials(
      aws_access_key_id,
      secretKeyToUse,
      aws_region,
      s3_bucket_name
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `AWS validation failed: ${validation.message}`,
      });
    }

    // Prepare settings to upsert
    const settingsToSave = [
      { key: S3_KEYS.ACCESS_KEY_ID, value: aws_access_key_id },
      { key: S3_KEYS.SECRET_ACCESS_KEY, value: encryptedSecretKey },
      { key: S3_KEYS.REGION, value: aws_region },
      { key: S3_KEYS.BUCKET_NAME, value: s3_bucket_name },
      { key: S3_KEYS.FOLDER_PATH, value: s3_folder_path || '' },
      { key: S3_KEYS.PUBLIC_URL, value: s3_public_url || '' },
      { key: S3_KEYS.FILE_VISIBILITY, value: file_visibility || 'private' },
      {
        key: S3_KEYS.SIGNED_URL_EXPIRY,
        value: String(signed_url_expiry || 3600),
      },
      { key: S3_KEYS.ENABLED, value: '1' },
    ];

    // Upsert each setting
    for (const setting of settingsToSave) {
      // Find existing setting by key
      const existingSetting = await prisma.settings.findFirst({
        where: { key: setting.key },
      });

      if (existingSetting) {
        // Update existing setting
        await prisma.settings.update({
          where: { id: existingSetting.id },
          data: {
            value: setting.value,
            updated_at: new Date(),
          },
        });
      } else {
        // Create new setting
        await prisma.settings.create({
          data: {
            key: setting.key,
            value: setting.value,
            created_by: req.user.id,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'S3 settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving S3 settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save S3 settings',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/s3-settings
 * @desc    Update existing S3 settings
 * @access  Private (Admin only)
 */
router.put('/', authenticateToken, async (req, res) => {
  try {
    const {
      aws_access_key_id,
      aws_secret_access_key,
      aws_region,
      s3_bucket_name,
      s3_folder_path,
      s3_public_url,
      file_visibility,
      signed_url_expiry,
    } = req.body;

    // Get existing secret key if not provided or masked
    let secretKeyToUse = aws_secret_access_key;

    if (!aws_secret_access_key || aws_secret_access_key === '***********') {
      const existingSecret = await prisma.settings.findUnique({
        where: { key: S3_KEYS.SECRET_ACCESS_KEY },
      });

      if (!existingSecret) {
        return res.status(400).json({
          success: false,
          message: 'Secret key is required',
        });
      }

      secretKeyToUse = decrypt(existingSecret.value);
    }

    // Validate credentials if provided
    if (aws_access_key_id && aws_region && s3_bucket_name) {
      const validation = await validateS3Credentials(
        aws_access_key_id,
        secretKeyToUse,
        aws_region,
        s3_bucket_name
      );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: `AWS validation failed: ${validation.message}`,
        });
      }
    }

    // Prepare settings to update
    const settingsToUpdate = {};

    if (aws_access_key_id)
      settingsToUpdate[S3_KEYS.ACCESS_KEY_ID] = aws_access_key_id;
    if (secretKeyToUse !== aws_secret_access_key)
      settingsToUpdate[S3_KEYS.SECRET_ACCESS_KEY] = encrypt(secretKeyToUse);
    if (aws_region) settingsToUpdate[S3_KEYS.REGION] = aws_region;
    if (s3_bucket_name) settingsToUpdate[S3_KEYS.BUCKET_NAME] = s3_bucket_name;
    if (s3_folder_path !== undefined)
      settingsToUpdate[S3_KEYS.FOLDER_PATH] = s3_folder_path;
    if (s3_public_url !== undefined)
      settingsToUpdate[S3_KEYS.PUBLIC_URL] = s3_public_url;
    if (file_visibility)
      settingsToUpdate[S3_KEYS.FILE_VISIBILITY] = file_visibility;
    if (signed_url_expiry)
      settingsToUpdate[S3_KEYS.SIGNED_URL_EXPIRY] = String(signed_url_expiry);

    // Update each setting
    for (const [key, value] of Object.entries(settingsToUpdate)) {
      await prisma.settings.upsert({
        where: { key },
        update: {
          value,
          updated_at: new Date(),
        },
        create: {
          key,
          value,
          created_by: req.user.id,
        },
      });
    }

    res.json({
      success: true,
      message: 'S3 settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating S3 settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update S3 settings',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/s3-settings
 * @desc    Delete/disable S3 settings
 * @access  Private (Admin only)
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await prisma.settings.updateMany({
      where: { key: S3_KEYS.ENABLED },
      data: { value: '0' },
    });

    res.json({
      success: true,
      message: 'S3 settings disabled successfully',
    });
  } catch (error) {
    console.error('Error deleting S3 settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete S3 settings',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/s3-settings/validate
 * @desc    Validate AWS credentials without saving
 * @access  Private
 */
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const {
      aws_access_key_id,
      aws_secret_access_key,
      aws_region,
      s3_bucket_name,
    } = req.body;

    // Get secret key - use provided one or fetch existing
    let secretKeyToUse = aws_secret_access_key;

    if (!aws_secret_access_key || aws_secret_access_key === '***********') {
      // Try to get existing secret key
      const existingSecret = await prisma.settings.findFirst({
        where: { key: S3_KEYS.SECRET_ACCESS_KEY },
      });

      if (existingSecret) {
        secretKeyToUse = decrypt(existingSecret.value);
      } else {
        return res.status(400).json({
          success: false,
          message: 'AWS Secret Access Key is required for validation',
        });
      }
    }

    if (!aws_access_key_id || !aws_region || !s3_bucket_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for validation',
      });
    }

    const validation = await validateS3Credentials(
      aws_access_key_id,
      secretKeyToUse,
      aws_region,
      s3_bucket_name
    );

    res.json({
      success: validation.valid,
      message: validation.message,
    });
  } catch (error) {
    console.error('Error validating S3 credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/s3-settings/enable
 * @desc    Enable S3 integration
 * @access  Private (Admin only)
 */
router.post('/enable', authenticateToken, async (req, res) => {
  try {
    await prisma.settings.upsert({
      where: { key: S3_KEYS.ENABLED },
      update: { value: '1' },
      create: {
        key: S3_KEYS.ENABLED,
        value: '1',
        created_by: req.user.id,
      },
    });

    res.json({
      success: true,
      message: 'S3 enabled successfully',
    });
  } catch (error) {
    console.error('Error enabling S3:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable S3',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/s3-settings/disable
 * @desc    Disable S3 integration
 * @access  Private (Admin only)
 */
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    await prisma.settings.upsert({
      where: { key: S3_KEYS.ENABLED },
      update: { value: '0' },
      create: {
        key: S3_KEYS.ENABLED,
        value: '0',
        created_by: req.user.id,
      },
    });

    res.json({
      success: true,
      message: 'S3 disabled successfully',
    });
  } catch (error) {
    console.error('Error disabling S3:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable S3',
      error: error.message,
    });
  }
});

export default router;
