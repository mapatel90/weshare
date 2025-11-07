import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/projects/check-name
 * @desc    Check if project name already exists
 * @access  Public
 */
router.post('/check-name', async (req, res) => {
    try {
        const { project_name, project_id } = req.body;

        if (!project_name) {
            return res.json({ success: true, exists: false });
        }

        // Check if project with same name exists (excluding current project in edit mode)
        const whereClause = {
            project_name: {
                equals: project_name,
                mode: 'insensitive' // Case-insensitive comparison
            },
            is_deleted: 0
        };

        // If editing, exclude current project from check
        if (project_id) {
            whereClause.id = {
                not: parseInt(project_id)
            };
        }

        const existingProject = await prisma.project.findFirst({
            where: whereClause,
            select: {
                id: true,
                project_name: true
            }
        });

        res.json({ 
            success: true,
            exists: !!existingProject,
            project: existingProject
        });

    } catch (error) {
        console.error('Error checking project name:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check project name',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post('/AddProject', authenticateToken, async (req, res) => {
    try {
        const {
            name,
            project_slug,
            project_type_id,
            offtaker_id,
            address1,
            address2,
            country_id,
            state_id,
            city_id,
            zipcode,
            asking_price,
            lease_term,
            product_code,
            project_description,
            investor_profit = '0',
            weshare_profit = '0',
            project_image,
            project_size,
            project_close_date,
            project_location,
            status = 1
        } = req.body;

        if (!name || !project_type_id) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const project = await prisma.project.create({
            data: {
                project_name: name,
                project_slug: project_slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, ''),
                project_type_id: parseInt(project_type_id),
                ...(offtaker_id && { offtaker_id: parseInt(offtaker_id) }),
                address1: address1 || '',
                address2: address2 || '',
                ...(country_id && { countryId: parseInt(country_id) }),
                ...(state_id && { stateId: parseInt(state_id) }),
                ...(city_id && { cityId: parseInt(city_id) }),
                zipcode: zipcode || '',
                asking_price: asking_price || '',
                lease_term: lease_term !== undefined && lease_term !== null && `${lease_term}` !== '' ? parseInt(lease_term) : null,
                product_code: product_code || '',
                project_description: project_description || '',
                investor_profit,
                weshare_profit,
                project_image: project_image || '',
                project_size: project_size || '',
                project_close_date: project_close_date ? new Date(project_close_date) : null,
                project_location: project_location || '',
                status: parseInt(status)
            },
            include: {
                country: true,
                state: true,
                city: true,
                offtaker: {
                    select: { id: true, fullName: true, email: true }
                }
            }
        });

        res.status(201).json({ success: true, message: 'Project created successfully' });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ success: false, message: 'Error creating project' });
    }
});

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    const where = { is_deleted: 0 };

    // Optional filters
    if (search) {
      where.OR = [
        { project_name: { contains: search, mode: 'insensitive' } },
        { project_type: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status !== undefined) {
      where.status = parseInt(status);
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          offtaker: {
            select: { fullName: true, email: true }
          },
          city: true,
          state: true,
          country: true,
          projectType: true
        },
        skip: offset,
        take: limitInt,
        orderBy: { id: 'desc' }
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: pageInt,
          limit: limitInt,
          total,
          pages: Math.ceil(total / limitInt)
        }
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { status: parseInt(status) },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update project status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get a single project by ID (Protected - for admin)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        offtaker: { select: { id: true, fullName: true, email: true } },
        city: true,
        state: true,
        country: true,
        projectType: true,
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Get project by id error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update a project by ID
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      project_slug,
      project_type_id,
      offtaker_id,
      address1,
      address2,
      country_id,
      state_id,
      city_id,
      zipcode,
      asking_price,
      lease_term,
      product_code,
      project_description,
      investor_profit = '0',
      weshare_profit = '0',
      project_image,
      project_size,
      project_close_date,
      project_location,
      status,
    } = req.body;

    const updated = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { project_name: name }),
        ...(project_slug !== undefined && { project_slug }),
        ...(project_type_id !== undefined && { project_type_id: parseInt(project_type_id) }),
        ...(offtaker_id !== undefined && { offtaker_id: offtaker_id ? parseInt(offtaker_id) : null }),
        ...(address1 !== undefined && { address1 }),
        ...(address2 !== undefined && { address2 }),
        ...(country_id !== undefined && { countryId: country_id ? parseInt(country_id) : null }),
        ...(state_id !== undefined && { stateId: state_id ? parseInt(state_id) : null }),
        ...(city_id !== undefined && { cityId: city_id ? parseInt(city_id) : null }),
        ...(zipcode !== undefined && { zipcode }),
        ...(asking_price !== undefined && { asking_price: asking_price || '' }),
        ...(lease_term !== undefined && { lease_term: (lease_term !== null && `${lease_term}` !== '' ? parseInt(lease_term) : null) }),
        ...(product_code !== undefined && { product_code: product_code || '' }),
        ...(project_description !== undefined && { project_description: project_description || '' }),
        ...(investor_profit !== undefined && { investor_profit }),
        ...(weshare_profit !== undefined && { weshare_profit }),
        ...(project_image !== undefined && { project_image: project_image || '' }),
        ...(project_size !== undefined && { project_size: project_size || '' }),
        ...(project_close_date !== undefined && { project_close_date: project_close_date ? new Date(project_close_date) : null }),
        ...(project_location !== undefined && { project_location: project_location || '' }),
        ...(status !== undefined && { status: parseInt(status) }),
      },
      include: {
        offtaker: { select: { id: true, fullName: true, email: true } },
        city: true,
        state: true,
        country: true,
        projectType: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete a project by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Upload project image (accepts base64 data URL)
router.post('/upload-image', authenticateToken, async (req, res) => {
  try {
    const { dataUrl } = req.body || {};
    if (!dataUrl) {
      return res.status(400).json({ success: false, message: 'dataUrl is required' });
    }

    // Parse base64 data URL
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid image data');
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    const ext = mimeType.split('/')[1] || 'png';
    const filename = `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    
    // Save to public/images/projects
    const fs = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectsDir = join(__dirname, '../../public/images/projects');
    
    // Ensure directory exists
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }
    
    const filePath = join(projectsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    
    // Return public URL path
    const publicPath = `/images/projects/${filename}`;
    
    return res.json({ success: true, message: 'Image uploaded', data: { path: publicPath } });
  } catch (error) {
    console.error('Error uploading project image:', error);
    return res.status(500).json({ success: false, message: 'Error uploading image', error: error.message });
  }
});

export default router;