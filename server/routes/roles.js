import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { PERMISSION_KEYS, extractModulesWithActions } from '../../src/utils/permissionUtils.js';
import { menuList } from '../../src/utils/Data/menuList.js';
import { ROLES } from '../../src/constants/roles.js';
import { t } from '../utils/i18n.js';

const router = express.Router();

// Get all roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, id } = req.query;
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
      prisma.roles.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { id: 'asc' }
      }),
      prisma.roles.count({ where })
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
    const language = req.currentLanguage;

    const role = await prisma.roles.findFirst({
      where: { id: parseInt(id) }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: t(language, "response_messages.role_not_found")
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
    const language = req.currentLanguage;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.role_name_required")
      });
    }

    // Check if role already exists
    const existingRole = await prisma.roles.findFirst({
      where: { name, is_deleted: 0 }
    });

    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: t(language, "response_messages.role_with_this_name_already_exists")
      });
    }

    // get last role id
    const lastRole = await prisma.roles.findFirst({
      orderBy: { id: 'desc' }
    });
    const lastRoleId = lastRole ? lastRole.id + 1 : 1;

    // Create role
    const newRole = await prisma.roles.create({
      data: {
        id: lastRoleId,
        name,
        status: parseInt(status)
      }
    });

    const modulesWithActions = extractModulesWithActions(menuList);
    const permissionRows = [];

    for (const { module, actions } of modulesWithActions) {
      for (const key of actions) {
        permissionRows.push({
          role_id: lastRoleId,
          module,
          key,
          value: key === "view" ? 1 : 0,
        });
      }
    }

    // Insert permissions
    const permissions = await prisma.roles_permissions.createMany({
      data: permissionRows,
      skipDuplicates: true,
    });

    if (permissions.count === 0) {
      return res.status(500).json({
        success: false,
        message: t(language, "response_messages.failed_to_create_role_permissions")
      });
    }

    res.status(201).json({
      success: true,
      message: t(language, "response_messages.role_and_permissions_created_successfully"),
      data: newRole,
      permissionsInserted: permissions.count,
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
    const language = req.currentLanguage;

    // Check if role exists
    const existingRole = await prisma.roles.findFirst({
      where: { id: parseInt(id) }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: t(language, "response_messages.role_not_found")
      });
    }

    // Check if name is being changed and if it's already taken
    if (name && name !== existingRole.name) {
      const nameExists = await prisma.roles.findFirst({
        where: { name, is_deleted: 0 }
      });

      if (nameExists) {
        return res.status(409).json({
          success: false,
          message: t(language, "response_messages.role_name_already_in_use")
        });
      }
    }

    // Update role
    const updatedRole = await prisma.roles.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(status !== undefined && { status: parseInt(status) })
      }
    });

    const isSuperAdmin = parseInt(id) === ROLES.SUPER_ADMIN;
    const isOfftaker = parseInt(id) === ROLES.OFFTAKER;
    const isInvestor = parseInt(id) === ROLES.INVESTOR;

    if (!isOfftaker && !isInvestor) {
      const modulesWithActions = extractModulesWithActions(menuList);

      // Extract settings sub-module names dynamically to default them to 0 for non-super-admin
      const settingsMenu = menuList.find(m => m.permission === "settings" && Array.isArray(m.dropdownMenu));
      const settingsModules = settingsMenu
        ? extractModulesWithActions(settingsMenu.dropdownMenu).map(m => m.module)
        : [];

      for (const { module, actions } of modulesWithActions) {
        for (const key of actions) {
          const value = isSuperAdmin
            ? 1
            : settingsModules.includes(module)
              ? 0
              : key === "view"
                ? 1
                : 0;

          await prisma.roles_permissions.upsert({
            where: {
              role_id_module_key: {
                role_id: parseInt(id),
                module,
                key,
              },
            },
            update: {}, // don't change existing
            create: {
              role_id: parseInt(id),
              module,
              key,
              value,
            },
          });
        }
      }
    }

    res.json({
      success: true,
      message: t(language, "response_messages.role_updated_successfully"),
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
    const language = req.currentLanguage;

    // Check if role exists
    const existingRole = await prisma.roles.findFirst({
      where: { id: parseInt(id) }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: t(language, "response_messages.role_not_found")
      });
    }

    // Delete role
    await prisma.roles.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 }
    });

    // Delete role permissions
    await prisma.roles_permissions.deleteMany({
      where: { role_id: parseInt(id) }
    });

    res.json({
      success: true,
      message: t(language, "response_messages.role_deleted_successfully")
    });

  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get permissions for a role
router.get('/permissions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const language = req.currentLanguage;

    // Check if role exists
    const role = await prisma.roles.findFirst({
      where: { id: parseInt(id), is_deleted: 0 }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: t(language, "response_messages.role_not_found")
      });
    }

    // Get ALL unique modules and keys from roles_permissions table (for all roles)
    const allPermissions = await prisma.roles_permissions.findMany({
      distinct: ['module', 'key'],
      select: { module: true, key: true },
      orderBy: { id: 'asc' }
    });

    // Build modules list with all available capabilities
    const modulesMap = {};
    allPermissions.forEach(p => {
      if (!modulesMap[p.module]) {
        modulesMap[p.module] = {
          module: p.module,
          label: p.module.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          capabilities: []
        };
      }
      if (!modulesMap[p.module].capabilities.includes(p.key)) {
        modulesMap[p.module].capabilities.push(p.key);
      }
    });

    // Get this role's permissions
    const rolePermissions = await prisma.roles_permissions.findMany({
      where: { role_id: parseInt(id) }
    });

    // Build permissions map for this role
    const permissionsMap = {};
    rolePermissions.forEach(p => {
      if (!permissionsMap[p.module]) {
        permissionsMap[p.module] = {};
      }
      permissionsMap[p.module][p.key] = p.value === 1;
    });

    // Convert modulesMap to array
    const modules = Object.values(modulesMap);

    res.json({
      success: true,
      data: {
        role,
        permissions: permissionsMap,
        modules
      }
    });

  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update permissions for a role
router.put('/permissions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // { module: { key: true/false } }
    const language = req.currentLanguage;

    // Check if role exists
    const role = await prisma.roles.findFirst({
      where: { id: parseInt(id), is_deleted: 0 }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: t(language, "response_messages.role_not_found")
      });
    }

    // Prepare upsert operations
    const operations = [];

    for (const [module, capabilities] of Object.entries(permissions)) {
      for (const [key, value] of Object.entries(capabilities)) {
        operations.push(
          prisma.roles_permissions.upsert({
            where: {
              role_id_module_key: {
                role_id: parseInt(id),
                module: module,
                key: key
              }
            },
            update: {
              value: value ? 1 : 0
            },
            create: {
              role_id: parseInt(id),
              module: module,
              key: key,
              value: value ? 1 : 0
            }
          })
        );
      }
    }

    // Execute all operations
    await prisma.$transaction(operations);

    res.json({
      success: true,
      message: t(language, "response_messages.permissions_updated_successfully")
    });

  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;