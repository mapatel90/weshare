import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { encrypt } from '../utils/encryption.js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { uploadToS3, isS3Enabled, deleteFromS3 } from '../services/s3Service.js';

const router = express.Router();
const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper: ensure directory exists
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Helper: parse base64 dataURL
const parseDataUrl = (dataUrl) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image data');
  }
  const mimeType = matches[1];
  const base64Data = matches[2];
  return { mimeType, base64Data };
};

// Helper: delete old logo or favicon from S3 or local storage
const deleteOldLogoIfSafe = async (publicPath) => {
  try {
    if (!publicPath) return;

    // If it's a full URL, attempt S3 deletion
    if (publicPath.startsWith('http')) {
      try {
        const url = new URL(publicPath);
        const key = decodeURIComponent(url.pathname.substring(1));
        await deleteFromS3(key);
      } catch (e) {
        console.warn('Failed to delete old logo from S3', e.message || e);
      }
      return;
    }

    // Only allow deletion inside /images/logo or /images/qrcodes
    if (!publicPath.startsWith('/images/logo/') && !publicPath.startsWith('/images/qrcodes/')) return;
    const relativePath = publicPath.replace(/^[/\\]+/, '');
    const absolutePath = join(__dirname, '../../public', relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (e) {
    // Swallow deletion errors to avoid blocking upload
    console.warn('Failed to delete old logo', e.message || e);
  }
};

// Get all settings
router.get("/", async (req, res) => {
  try {
    // const settings = await prisma.$queryRaw`
    //   SELECT 
    //     s.key,
    //     s.value,

    //     CASE WHEN s.key = 'site_country' THEN c.name END AS site_country_name,
    //     CASE WHEN s.key = 'site_state'   THEN st.name END AS site_state_name,
    //     CASE WHEN s.key = 'site_city'    THEN ct.name END AS site_city_name

    //   FROM settings s

    //   LEFT JOIN countries c 
    //     ON s.key = 'site_country'
    //     AND c.id = CASE WHEN s.value ~ '^[0-9]+$' THEN CAST(s.value AS INTEGER) END

    //   LEFT JOIN states st 
    //     ON s.key = 'site_state'
    //     AND st.id = CASE WHEN s.value ~ '^[0-9]+$' THEN CAST(s.value AS INTEGER) END

    //   LEFT JOIN cities ct 
    //     ON s.key = 'site_city'
    //     AND ct.id = CASE WHEN s.value ~ '^[0-9]+$' THEN CAST(s.value AS INTEGER) END
    // `;

    const settings = await prisma.$queryRaw`
      SELECT 
        s.key,
        s.value
      FROM settings s
    `;

    const settingsObj = {};

    settings.forEach(row => {
      // original value
      settingsObj[row.key] = row.value;

      // name fields (only if exist)
      if (row.site_country_name)
        settingsObj.site_country_name = row.site_country_name;

      if (row.site_state_name)
        settingsObj.site_state_name = row.site_state_name;

      if (row.site_city_name)
        settingsObj.site_city_name = row.site_city_name;
    });

    res.json({
      success: true,
      data: settingsObj
    });

  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching settings",
      error: error.message
    });
  }
});

// Get View Settings
router.get("/settings-data", async (req, res) => {
  try {
    const settings = await prisma.$queryRaw`
      WITH safe_settings AS (
        SELECT
          key,
          value,
          CASE
            WHEN value ~ '^[0-9]{1,10}$' THEN value::INT
            ELSE NULL
          END AS value_int
        FROM settings
      )
      SELECT
        s.key,
        s.value,

        c.name  AS site_country_name,
        st.name AS site_state_name,
        ct.name AS site_city_name

      FROM safe_settings s

      LEFT JOIN countries c
        ON s.key = 'site_country'
      AND c.id = s.value_int

      LEFT JOIN states st
        ON s.key = 'site_state'
      AND st.id = s.value_int

      LEFT JOIN cities ct
        ON s.key = 'site_city'
      AND ct.id = s.value_int
   `;
    // const settings = await prisma.$queryRaw`
    //   SELECT 
    //     s.key,
    //     s.value
    //   FROM settings s
    // `;

    const settingsObj = {};

    settings.forEach(row => {
      // original value
      settingsObj[row.key] = row.value;

      // name fields (only if exist)
      if (row.site_country_name)
        settingsObj.site_country_name = row.site_country_name;

      if (row.site_state_name)
        settingsObj.site_state_name = row.site_state_name;

      if (row.site_city_name)
        settingsObj.site_city_name = row.site_city_name;
    });

    res.json({
      success: true,
      data: settingsObj
    });

  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching settings",
      error: error.message
    });
  }
});


// get taxes data (must come before /:key route to avoid route collision)
router.get('/taxes', authenticateToken, async (req, res) => {
  try {
    const taxes = await prisma.taxes.findMany({
      where: { is_deleted: 0 },
      orderBy: { value: 'desc' },
    });

    res.json({ success: true, data: taxes });
  } catch (error) {
    console.error('Error fetching taxes:', error);
    res.status(500).json({ success: false, message: 'Error fetching taxes', error: error.message });
  }
});

// Get single setting by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await prisma.settings.findFirst({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: {
        key: setting.key,
        value: setting.value
      }
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching setting',
      error: error.message
    });
  }
});

// Update or create multiple settings
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings data provided'
      });
    }

    // Use transaction to update/create multiple settings
    const updatedSettings = await prisma.$transaction(async (prisma) => {
      const results = [];

      for (const [key, value] of Object.entries(settings)) {
        // Encrypt S3 secret key before saving
        let valueToSave = String(value);
        if (key === 's3_aws_secret_access_key' && value && value !== '***********') {
          valueToSave = encrypt(value);
        }

        const existing = await prisma.settings.findFirst({ where: { key } });
        let setting;
        if (existing) {
          setting = await prisma.settings.update({
            where: { id: existing.id },
            data: {
              value: valueToSave,
              updated_at: new Date()
            }
          });
        } else {
          setting = await prisma.settings.create({
            data: {
              key,
              value: valueToSave
            }
          });
        }
        results.push(setting);
      }

      return results;
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
});

// Update or create single setting
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Key and value are required'
      });
    }

    const existing = await prisma.settings.findFirst({ where: { key } });
    let setting;
    if (existing) {
      setting = await prisma.settings.update({
        where: { id: existing.id },
        data: {
          value: String(value),
          updated_at: new Date()
        }
      });
    } else {
      setting = await prisma.settings.create({
        data: {
          key,
          value: String(value)
        }
      });
    }

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating setting',
      error: error.message
    });
  }
});

// Delete setting
router.delete('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await prisma.settings.findFirst({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    await prisma.settings.delete({
      where: { key }
    });

    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting setting',
      error: error.message
    });
  }
});

// Upload site logo (accepts base64 data URL), saves under public/images/logo and deletes old
router.post('/upload-logo', authenticateToken, async (req, res) => {
  try {
    const { dataUrl, oldImagePath } = req.body || {};

    if (!dataUrl) {
      return res.status(400).json({
        success: false,
        message: 'dataUrl is required'
      });
    }

    const s3Enabled = await isS3Enabled();
    if (!s3Enabled) {
      return res.status(500).json({
        success: false,
        message: 'S3 is disabled'
      });
    }

    const { mimeType, base64Data } = parseDataUrl(dataUrl);
    const buffer = Buffer.from(base64Data, 'base64');

    // ✅ MIME type → file extension mapping
    const mimeToExt = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/svg+xml': 'svg'
    };

    const extension = mimeToExt[mimeType];
    if (!extension) {
      return res.status(400).json({
        success: false,
        message: `Unsupported image type: ${mimeType}`
      });
    }

    // ✅ Filename WITH extension
    const fileName = `logo_${Date.now()}.${extension}`;

    const s3Result = await uploadToS3(
      buffer,
      fileName,
      mimeType,
      {
        folder: 'logo',
        metadata: { uploadType: 'site_logo' }
      }
    );
    
    if (!s3Result || !s3Result.success) {
      console.error('S3 upload failed:', s3Result);
      return res.status(500).json({
        success: false,
        message: 'S3 upload failed'
      });
    }

    // ✅ Delete previous logo if provided
    await deleteOldLogoIfSafe(oldImagePath);

    return res.json({
      success: true,
      message: 'Logo uploaded',
      data: {
        path: s3Result.data.fileKey
      }
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading logo',
      error: error.message
    });
  }
});

// Delete site logo (remove file if under /images/logo and clear DB key site_image)
router.post('/delete-logo', authenticateToken, async (req, res) => {
  try {
    const { path } = req.body || {};

    // Remove file from S3 or disk if safe
    await deleteOldLogoIfSafe(path);

    // Clear site_image in DB
    const existing = await prisma.settings.findFirst({ where: { key: 'site_image' } });
    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: { value: '', updated_at: new Date() }
      });
    } else {
      await prisma.settings.create({
        data: { key: 'site_image', value: '' }
      });
    }

    return res.json({ success: true, message: 'Logo deleted and setting cleared' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return res.status(500).json({ success: false, message: 'Error deleting logo', error: error.message });
  }
});

// Upload site favicon (accepts base64 data URL), saves under public/images/logo and deletes old
router.post('/upload-favicon', authenticateToken, async (req, res) => {
  try {
    const { dataUrl, oldImagePath } = req.body || {};
    if (!dataUrl) {
      return res.status(400).json({ success: false, message: 'dataUrl is required' });
    }

    const s3Enabled = await isS3Enabled();
    if (!s3Enabled) {
      return res.status(500).json({ success: false, message: 'S3 is disabled' });
    }

    const { mimeType, base64Data } = parseDataUrl(dataUrl);
    const buffer = Buffer.from(base64Data, 'base64');

    // ✅ MIME type → file extension mapping
    const mimeToExt = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/svg+xml': 'svg'
    };

    const extension = mimeToExt[mimeType];
    if (!extension) {
      return res.status(400).json({
        success: false,
        message: `Unsupported image type: ${mimeType}`
      });
    }

    // ✅ Filename WITH extension
    const fileName = `favicon_${Date.now()}.${extension}`;

    const s3Result = await uploadToS3(
      buffer,
      fileName,
      mimeType,
      { folder: 'logo', metadata: { uploadType: 'site_favicon' } }
    );

    if (!s3Result || !s3Result.success) {
      console.error('S3 upload failed:', s3Result);
      return res.status(500).json({ success: false, message: 'S3 upload failed' });
    }

    // Delete previous favicon if provided
    await deleteOldLogoIfSafe(oldImagePath);

    return res.json({ success: true, message: 'Favicon uploaded', data: { path: s3Result.data.fileKey } });
  } catch (error) {
    console.error('Error uploading favicon:', error);
    return res.status(500).json({ success: false, message: 'Error uploading favicon', error: error.message });
  }
});

// Delete site favicon (remove file if under /images/logo and clear DB key site_favicon)
router.post('/delete-favicon', authenticateToken, async (req, res) => {
  try {
    const { path } = req.body || {};

    // Remove file from S3 or disk if safe
    await deleteOldLogoIfSafe(path);

    // Clear site_favicon in DB
    const existing = await prisma.settings.findFirst({ where: { key: 'site_favicon' } });
    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: { value: '', updated_at: new Date() }
      });
    } else {
      await prisma.settings.create({
        data: { key: 'site_favicon', value: '' }
      });
    }

    return res.json({ success: true, message: 'Favicon deleted and setting cleared' });
  } catch (error) {
    console.error('Error deleting favicon:', error);
    return res.status(500).json({ success: false, message: 'Error deleting favicon', error: error.message });
  }
});

// Send test email using SMTP settings stored in DB
router.post('/test-email', authenticateToken, async (req, res) => {
  try {
    console.log('Received test email request with body:', req.body);
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient email (to) is required' });
    }

    // Fetch relevant SMTP settings (prefer smtp_* then legacy email_*)
    const smtpKeys = [
      'smtp_email',
      'smtp_email_from_address',
      'smtp_email_from_name',
      'smtp_email_host',
      'smtp_email_user',
      'smtp_email_password',
      'smtp_email_port',
      // 'smtp_email_security_type',
    ];

    const settings = await prisma.settings.findMany({ where: { key: { in: smtpKeys } } });
    // console.log('Fetched SMTP settings from DB:', settings);
    const s = settings.reduce((acc, it) => { acc[it.key] = it.value; return acc; }, {});

    const protocol = s['smtp_email'] || 'SSL';
    const fromAddress = s['smtp_email_from_address'] || '';
    const fromName = s['smtp_email_from_name'] || '';
    const host = s['smtp_email_host'] || '';
    const user = s['smtp_email_user'] || '';
    const pass = s['smtp_email_password'] || '';
    const portStr = s['smtp_email_port'] || '';

    const port = Number(portStr);
    const secure = Number(port) === 465 || (protocol || '').toUpperCase() === 'SSL';

    if (!fromAddress || !host || !user || !pass || !port) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete SMTP configuration. Please fill all required SMTP fields before testing.',
      });
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    await transporter.verify();

    const info = await transporter.sendMail({
      from: fromName ? `${fromName} <${fromAddress}>` : fromAddress,
      to,
      subject: 'SMTP Test Email',
      text: 'This is a test email to verify your SMTP settings.',
    });

    res.json({ success: true, message: 'Test email sent successfully', data: { messageId: info.messageId } });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ success: false, message: 'Failed to send test email', error: error.message });
  }
});

export default router;