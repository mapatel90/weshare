import express from 'express';
import bcrypt from 'bcryptjs';
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

// Multer storage for user profile images
const userAvatarDir = path.join(PUBLIC_DIR, 'images', 'avatar');
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(userAvatarDir, { recursive: true });
    cb(null, userAvatarDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    const ts = Date.now();
    cb(null, `user_${base}_${ts}${ext}`);
  },
});
const uploadAvatar = multer({ storage: avatarStorage });

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
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Support filtering by role id or role name
    if (role) {
      // numeric -> treat as role id on user.userRole
      const roleAsInt = parseInt(role);
      if (!isNaN(roleAsInt)) {
        where.userRole = roleAsInt;
      } else {
        // non-numeric -> search roles by name and filter users by matching role ids
        const matchedRoles = await prisma.role.findMany({
          where: { name: { contains: role, mode: 'insensitive' } },
          select: { id: true }
        });
        const roleIds = matchedRoles.map(r => r.id);
        if (roleIds.length) {
          where.userRole = { in: roleIds };
        } else {
          // no matching role names -> ensure empty result
          where.userRole = -1;
        }
      }
    }

    if (status !== undefined) {
      where.status = parseInt(status);
    }

    where.is_deleted = 0; // Exclude deleted users

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
          city: true,
          state: true,
          country: true
        },
        skip: parseInt(offset),
        take: parseInt(limitInt),
        orderBy: { id: 'asc' }
      }),
      prisma.user.count({ where })
    ]);

    // Attach role name for each user (Role is a separate table and User currently stores role id in `userRole`)
    const roleIds = [...new Set(users.map(u => u.userRole).filter(Boolean))];
    let roles = [];
    if (roleIds.length) {
      roles = await prisma.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, name: true }
      });
    }
    const roleMap = Object.fromEntries(roles.map(r => [r.id, r.name]));
    const usersWithRole = users.map(u => ({
      ...u,
      role: { id: u.userRole, name: roleMap[u.userRole] ?? null }
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
      status
    } = req.body;

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
    const existingByUsername = await prisma.user.findUnique({ where: { username } });
    if (existingByUsername) {
      return res.status(409).json({ success: false, message: 'Username already in use' });
    }

    // Check if email already exists
    // email is not a unique field in the schema, use findFirst instead of findUnique
    const existingUser = await prisma.user.findFirst({
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

    // Get QR code path if uploaded
    const qrCodePath = req.file ? `/images/qrcodes/${req.file.filename}` : null;

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        fullName,
        email,
        phoneNumber,
        password: hashedPassword,
        // ensure userRole is saved as integer
        userRole: roleId,
        address_1,
        address_2,
        cityId: cityId ? parseInt(cityId) : null,
        stateId: stateId ? parseInt(stateId) : null,
        countryId: countryId ? parseInt(countryId) : null,
        zipcode,
        qrCode: qrCodePath,
        status: parseInt(status)
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userRole: true,
        address_1: true,
        address_2: true,
        cityId: true,
        stateId: true,
        countryId: true,
        zipcode: true,
        qrCode: true,
        status: true,
        createdAt: true
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
      username
    };

    // If excludeId provided, ensure we don't count that user
    if (excludeId) {
      const exists = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: parseInt(excludeId) }
        }
      });
      return res.json({ success: true, data: { exists: !!exists } });
    }

    const found = await prisma.user.findUnique({ where: { username } });
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
      roles = await prisma.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, name: true }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        fullName: true,
        user_image: true,
        username: true,
        email: true,
        password: true,
        phoneNumber: true,
        userRole: true,
        address_1: true,
        address_2: true,
        cityId: true,
        stateId: true,
        countryId: true,
        zipcode: true,
        qrCode: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        city: {
          select: {
            id: true,
            name: true
          }
        },
        state: {
          select: {
            id: true,
            name: true
          }
        },
        country: {
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
      password
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
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
      const emailExists = await prisma.user.findFirst({
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
      ...(fullName && { fullName }),
      ...(username && { username }),
      ...(email && { email }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(userRole && { userRole: parseInt(userRole) }),
      ...(address_1 !== undefined && { address_1 }),
      ...(address_2 !== undefined && { address_2 }),
      ...(cityId !== undefined && { cityId: cityId ? parseInt(cityId) : null }),
      ...(stateId !== undefined && { stateId: stateId ? parseInt(stateId) : null }),
      ...(countryId !== undefined && { countryId: countryId ? parseInt(countryId) : null }),
      ...(zipcode !== undefined && { zipcode }),
      ...(status !== undefined && { status: parseInt(status) })
    }

    // If password is provided (non-empty), hash it and include in update
    if (password && typeof password === 'string' && password.trim() !== '') {
      const saltRounds = 12
      const hashed = await bcrypt.hash(password, saltRounds)
      updateData.password = hashed
    }

    // Handle QR code upload
    if (req.file) {
      const qrCodePath = `/images/qrcodes/${req.file.filename}`;
      updateData.qrCode = qrCodePath;

      // Delete old QR code file if exists
      if (existingUser.qrCode) {
        const oldFilePath = path.join(PUBLIC_DIR, existingUser.qrCode.replace(/^\//, ''));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phoneNumber: true,
        userRole: true,
        address_1: true,
        address_2: true,
        cityId: true,
        stateId: true,
        countryId: true,
        zipcode: true,
        qrCode: true,
        status: true,
        updatedAt: true,
        city: {
          select: {
            id: true,
            name: true
          }
        },
        state: {
          select: {
            id: true,
            name: true
          }
        },
        country: {
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
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user
    await prisma.user.update({
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
    const user = await prisma.user.findUnique({
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
    await prisma.user.update({
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
      fullName,
      email,
      phoneNumber,
      countryId,
      stateId,
      cityId
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
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
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(countryId !== undefined && { countryId: countryId ? parseInt(countryId) : null }),
      ...(stateId !== undefined && { stateId: stateId ? parseInt(stateId) : null }),
      ...(cityId !== undefined && { cityId: cityId ? parseInt(cityId) : null })
    };

    // Handle user_image upload
    if (req.file) {
      const userImagePath = `/images/avatar/${req.file.filename}`;
      updateData.user_image = userImagePath;

      // Delete old user image file if exists
      if (existingUser.user_image) {
        const oldFilePath = path.join(PUBLIC_DIR, existingUser.user_image.replace(/^\//, ''));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        user_image: true,
        countryId: true,
        stateId: true,
        cityId: true,
        updatedAt: true,
        city: {
          select: {
            id: true,
            name: true
          }
        },
        state: {
          select: {
            id: true,
            name: true
          }
        },
        country: {
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

export default router;