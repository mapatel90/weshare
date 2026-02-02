import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { uploadToS3, isS3Enabled, deleteFromS3 } from '../services/s3Service.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Multer storage for QR code images
const qrCodeImagesDir = path.join(PUBLIC_DIR, 'images', 'qrcodes');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(qrCodeImagesDir, { recursive: true });
    cb(null, qrCodeImagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    const ts = Date.now();
    cb(null, `qr_${base}_${ts}${ext}`);
  },
});
const upload = multer({ storage });

// Multer storage for user profile images (memory storage for S3 upload)
const userAvatarDir = path.join(PUBLIC_DIR, 'images', 'avatar');
const avatarMemoryStorage = multer.memoryStorage();
const uploadAvatar = multer({
  storage: avatarMemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.'));
    }
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 10;
    const offset = (pageInt - 1) * limitInt;

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Support filtering by role id or role name
    if (role) {
      // numeric -> treat as role id on user.role_id
      const roleAsInt = parseInt(role);
      if (!isNaN(roleAsInt)) {
        where.role_id = roleAsInt;
      } else {
        // non-numeric -> search roles by name and filter users by matching role ids
        const matchedRoles = await prisma.roles.findMany({
          where: { name: { contains: role, mode: 'insensitive' } },
          select: { id: true }
        });
        const roleIds = matchedRoles.map(r => r.id);
        if (roleIds.length) {
          where.role_id = { in: roleIds };
        } else {
          // no matching role names -> ensure empty result
          where.role_id = -1;
        }
      }
    }

    if (status !== undefined) {
      where.status = parseInt(status);
    }

    where.is_deleted = 0; // Exclude deleted users

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        // select: {
        //   id: true,
        //   fullName: true,
        //   email: true,
        //   phoneNumber: true,
        //   userRole: true,
        //   status: true,
        //   createdAt: true,
        //   updatedAt: true
        // },
        include: {
          // role: true,
          cities: true,
          states: true,
          countries: true
        },
        skip: parseInt(offset),
        take: parseInt(limitInt),
        orderBy: { id: 'asc' }
      }),
      prisma.users.count({ where })
    ]);

    // Attach role name for each user (Role is a separate table and User currently stores role id in `userRole`)
    const roleIds = [...new Set(users.map(u => u.role_id).filter(Boolean))];
    let roles = [];
    if (roleIds.length) {
      roles = await prisma.roles.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, name: true }
      });
    }
    const roleMap = Object.fromEntries(roles.map(r => [r.id, r.name]));
    const usersWithRole = users.map(u => ({
      ...u,
      role: { id: u.role_id, name: roleMap[u.role_id] ?? null }
    }));

    res.json({
      success: true,
      data: {
        users: usersWithRole,
        pagination: {
          page: pageInt,
          limit: limitInt,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new user
router.post('/', authenticateToken, upload.single('qrCode'), async (req, res) => {
  try {
    const {
      username,
      fullName,
      email,
      phoneNumber,
      password,
      userRole,
      address_1,
      address_2,
      cityId,
      stateId,
      countryId,
      zipcode,
      status,
      language
    } = req.body;

    const createdBy = req.user?.id ? parseInt(req.user.id) : null;

    // Validate required fields
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    // Check if investor role and QR code is required
    const roleId = userRole ? parseInt(userRole) : 3;
    if (roleId === 4 && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'QR code is required for investor role'
      });
    }

    // Check if username already exists
    const existingByUsername = await prisma.users.findFirst({ where: { username } });
    if (existingByUsername) {
      return res.status(409).json({ success: false, message: 'Username already in use' });
    }

    // Check if email already exists
    // email is not a unique field in the schema, use findFirst instead of findFirst
    const existingUser = await prisma.users.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Get QR code path if uploaded (support S3 upload)
    let qrCodePath = null;
    if (req.file) {
      const s3Enabled = await isS3Enabled();
      if (s3Enabled) {
        try {
          const buffer = fs.readFileSync(req.file.path);
          const s3Result = await uploadToS3(buffer, req.file.originalname, req.file.mimetype, {
            folder: 'users/qrcodes',
            metadata: { createdBy: String(createdBy || '') }
          });
          if (s3Result && s3Result.success) {
            qrCodePath = s3Result.data.fileUrl;
          }
        } catch (s3Err) {
          console.error('S3 upload failed for QR code:', s3Err.message || s3Err);
        }

      }
    }

    // Create user
    const newUser = await prisma.users.create({
      data: {
        username,
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        password: hashedPassword,
        // ensure userRole is saved as integer
        role_id: roleId,
        address_1,
        address_2,
        city_id: cityId ? parseInt(cityId) : null,
        state_id: stateId ? parseInt(stateId) : null,
        country_id: countryId ? parseInt(countryId) : null,
        zipcode,
        qr_code: qrCodePath,
        status: parseInt(status),
        language: language ? language : "en",
        ...(createdBy !== null && { created_by: createdBy })
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        phone_number: true,
        role_id: true,
        address_1: true,
        address_2: true,
        city_id: true,
        state_id: true,
        country_id: true,
        zipcode: true,
        qr_code: true,
        status: true,
        language: true,
        created_at: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check username availability (no auth required)
router.get('/check-username', async (req, res) => {
  try {
    const { username, excludeId } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username query parameter is required' });
    }

    const where = {
      username, is_deleted: 0
    };

    // If excludeId provided, ensure we don't count that user
    if (excludeId) {
      const exists = await prisma.users.findFirst({
        where: {
          username,
          NOT: { id: parseInt(excludeId) },
          is_deleted: 0
        }
      });
      return res.json({ success: true, data: { exists: !!exists } });
    }

    const found = await prisma.users.findFirst({ where: { username, is_deleted: 0 } });
    return res.json({ success: true, data: { exists: !!found } });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Attach role name for each user (Role is a separate table and User currently stores role id in `userRole`)
    const parsedId = parseInt(id);
    const roleIds = Number.isInteger(parsedId) ? [parsedId] : [];
    let roles = [];
    if (roleIds.length) {
      roles = await prisma.roles.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, name: true }
      });
    }

    const user = await prisma.users.findFirst({
      where: { id: parseInt(id) },
      select: {
        id: true,
        full_name: true,
        user_image: true,
        username: true,
        email: true,
        password: true,
        phone_number: true,
        role_id: true,
        address_1: true,
        address_2: true,
        city_id: true,
        state_id: true,
        country_id: true,
        zipcode: true,
        qr_code: true,
        status: true,
        language: true,
        created_at: true,
        updated_at: true,
        cities: {
          select: {
            id: true,
            name: true
          }
        },
        states: {
          select: {
            id: true,
            name: true
          }
        },
        countries: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// (duplicate check-username route removed; single handler earlier in file is used)

// Update user
router.put('/:id', authenticateToken, upload.single('qrCode'), async (req, res) => {
  try {
    const { id } = req.params;
    // Accept both snake_case (backend) and camelCase (frontend) keys
    const {
      fullName,
      email,
      username,
      phoneNumber,
      userRole,
      address_1,
      address_2,
      cityId,
      stateId,
      countryId,
      zipcode,
      status,
      language,
      password
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.users.findFirst({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      // email is not unique in schema, use findFirst
      const emailExists = await prisma.users.findFirst({
        where: { email }
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Build update data
    const updateData = {
      // names
      ...(fullName ? { full_name: fullName } : {}),
      ...(username ? { username } : {}),
      ...(email ? { email } : {}),
      ...(phoneNumber !== undefined
        ? { phone_number: phoneNumber }
        : {}),
      // role
      ...(userRole
        ? { role_id: parseInt(userRole) }
        : {}),
      // addresses
      ...(address_1 !== undefined
        ? { address_1 }
        : {}),
      ...(address_2 !== undefined
        ? { address_2 }
        : {}),
      // location
      ...(cityId !== undefined
        ? { city_id: cityId ? parseInt(cityId) : null }
        : {}),
      ...(stateId !== undefined
        ? { state_id: stateId ? parseInt(stateId) : null }
        : {}),
      ...(countryId !== undefined
        ? { country_id: countryId ? parseInt(countryId) : null }
        : {}),
      // other
      ...(zipcode !== undefined ? { zipcode } : {}),
      ...(status !== undefined ? { status: parseInt(status) } : {}),
      ...(language !== undefined ? { language } : {})
    }

    // If password is provided (non-empty), hash it and include in update
    if (password && typeof password === 'string' && password.trim() !== '') {
      const saltRounds = 12
      const hashed = await bcrypt.hash(password, saltRounds)
      updateData.password = hashed
    }

    // Handle QR code upload (support S3)
    if (req.file) {
      let newQrPath = null;
      const s3Enabled = await isS3Enabled();
      if (s3Enabled) {
        try {
          const buffer = fs.readFileSync(req.file.path);
          const s3Result = await uploadToS3(buffer, req.file.originalname, req.file.mimetype, {
            folder: 'users/qrcodes',
            metadata: { uploadType: 'qr_code', userId: String(id) }
          });
          if (s3Result && s3Result.success) {
            newQrPath = s3Result.data.fileUrl;
          }
        } catch (s3Err) {
          console.error('S3 upload failed for QR code (update):', s3Err.message || s3Err);
        }

      }

      updateData.qr_code = newQrPath;

      // Delete old QR code file if exists (S3 or local)
      if (existingUser.qr_code) {
        try {
          let oldKey = existingUser.qr_code;
          if (oldKey.startsWith('http')) {
            const url = new URL(oldKey);
            oldKey = decodeURIComponent(url.pathname.substring(1));
            await deleteFromS3(oldKey).catch(() => {});
          } else {
            const oldFilePath = path.join(PUBLIC_DIR, existingUser.qr_code.replace(/^\//, ''));
            if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
          }
        } catch (delErr) {
          console.warn('Failed to delete previous QR code file:', delErr.message || delErr);
        }
      }
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        full_name: true,
        username: true,
        email: true,
        phone_number: true,
        role_id: true,
        address_1: true,
        address_2: true,
        city_id: true,
        state_id: true,
        country_id: true,
        zipcode: true,
        qr_code: true,
        status: true,
        language: true,
        updated_at: true,
        cities: {
          select: {
            id: true,
            name: true
          }
        },
        states: {
          select: {
            id: true,
            name: true
          }
        },
        countries: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.users.findFirst({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete QR code from S3 if it exists and is an S3 URL
    if (existingUser.qr_code && existingUser.qr_code.startsWith('http')) {
      try {
        const url = new URL(existingUser.qr_code);
        const key = decodeURIComponent(url.pathname.substring(1));
        await deleteFromS3(key);
        console.log('S3 QR code deleted:', key);
      } catch (s3Error) {
        console.error('Failed to delete QR code from S3:', s3Error);
      }
    }

    // Delete user
    await prisma.users.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.patch('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user with password
    const user = await prisma.users.findFirst({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.users.update({
      where: { id: parseInt(id) },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get users by role
router.post('/GetUserByRole', authenticateToken, async (req, res) => {
  try {
    const { user_role } = req.body

    if (!user_role) {
      return res.status(400).json({
        success: false,
        message: 'user_role is required',
      })
    }

    const users = await prisma.users.findMany({
      where: { role_id: parseInt(user_role) },
      select: {
        id: true,
        full_name: true,
        username: true,
        email: true,
        phone_number: true,
        role_id: true,
        address_1: true,
        address_2: true,
        city_id: true,
        state_id: true,
        country_id: true,
        zipcode: true,
        language: true,
        status: true,
        created_at: true,
        updated_at: true,
        cities: { select: { id: true, name: true } },
        states: { select: { id: true, name: true } },
        countries: { select: { id: true, name: true } },
      },
    })

    res.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Get users by role error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// Update user profile (with user_image support)
router.put('/profile/:id', authenticateToken, uploadAvatar.single('user_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      phone_number,
      country_id,
      state_id,
      city_id,
      address_1,
      address_2,
      zipcode,
      language
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.users.findFirst({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build update data
    const updateData = {
      ...(full_name && { full_name }),
      ...(email && { email }),
      ...(phone_number !== undefined && { phone_number }),
      ...(country_id !== undefined && { country_id: country_id ? parseInt(country_id) : null }),
      ...(state_id !== undefined && { state_id: state_id ? parseInt(state_id) : null }),
      ...(city_id !== undefined && { city_id: city_id ? parseInt(city_id) : null }),
      ...(address_1 !== undefined && { address_1: address_1 ? address_1 : null }),
      ...(address_2 !== undefined && { address_2: address_2 ? address_2 : null }),
      ...(zipcode !== undefined && { zipcode: zipcode ? zipcode : null }),
      ...(language !== undefined && { language: language ? language : "en" })
    };

    // Handle user_image upload
    if (req.file) {
      // Check if S3 is enabled
      const s3Enabled = await isS3Enabled();

      if (s3Enabled) {
        try {
          // Upload to S3
          const s3Result = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            {
              folder: 'avatars',
              metadata: {
                userId: String(id),
                uploadType: 'profile_image'
              }
            }
          );

          if (s3Result.success) {
            updateData.user_image = s3Result.data.fileUrl;
          }
        } catch (s3Error) {
          console.error('S3 upload error:', s3Error);
          // Fallback to local storage if S3 fails
          const ext = path.extname(req.file.originalname) || '.jpg';
          const base = path.basename(req.file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
          const ts = Date.now();
          const filename = `user_${base}_${ts}${ext}`;
          const localPath = path.join(userAvatarDir, filename);

          fs.mkdirSync(userAvatarDir, { recursive: true });
          fs.writeFileSync(localPath, req.file.buffer);

          updateData.user_image = `/images/avatar/${filename}`;
        }
      } else {
        // S3 not enabled, use local storage
        const ext = path.extname(req.file.originalname) || '.jpg';
        const base = path.basename(req.file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
        const ts = Date.now();
        const filename = `user_${base}_${ts}${ext}`;
        const localPath = path.join(userAvatarDir, filename);

        fs.mkdirSync(userAvatarDir, { recursive: true });
        fs.writeFileSync(localPath, req.file.buffer);

        updateData.user_image = `/images/avatar/${filename}`;

        // Delete old user image file if exists
        if (existingUser.user_image && !existingUser.user_image.startsWith('http')) {
          const oldFilePath = path.join(PUBLIC_DIR, existingUser.user_image.replace(/^\//, ''));
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        language: true,
        user_image: true,
        country_id: true,
        state_id: true,
        city_id: true,
        updated_at: true,
        cities: {
          select: {
            id: true,
            name: true
          }
        },
        states: {
          select: {
            id: true,
            name: true
          }
        },
        countries: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});



router.post("/dropdown/users", authenticateToken, async (req, res) => {
  try {
    const { status, role_id, search } = req.body;
    const where = { is_deleted: 0 };
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone_number: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (role_id) {
      where.role_id = role_id;
    }
    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        full_name: true,
        email: true,
      },
      orderBy: { full_name: "asc" },
      take: 50,
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Dropdown users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
})

export default router;