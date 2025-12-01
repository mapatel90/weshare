import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status,id } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {
      is_deleted: 0,
    };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status !== undefined) {
      where.status = parseInt(status);
    }
    if (id !== undefined) {
      where.id = parseInt(id);
    }

    // Get roles with pagination
    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { id: 'asc' }
      }),
      prisma.role.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        roles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get role by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: role
    });

  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new role
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, status = 1 } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Create role
    const newRole = await prisma.role.create({
      data: {
        name,
        status: parseInt(status)
      }
    });

    res.status(200).json({
      success: true,
      message: 'Role created successfully',
      data: newRole
    });

  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update role
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if name is being changed and if it's already taken
    if (name && name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name }
      });

      if (nameExists) {
        return res.status(409).json({
          success: false,
          message: 'Role name already in use'
        });
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(status !== undefined && { status: parseInt(status) })
      }
    });

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: updatedRole
    });

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete role
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Delete role
    await prisma.role.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 }
    });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;