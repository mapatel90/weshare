import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all countries
router.get('/countries', async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      where: { status: 1 },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true
      }
    });

    res.json({
      success: true,
      data: countries,
      message: 'Countries retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries',
      error: error.message
    });
  }
});

// Get states by country ID
router.get('/countries/:countryId/states', async (req, res) => {
  try {
    const { countryId } = req.params;
    
    const states = await prisma.state.findMany({
      where: { 
        countryId: parseInt(countryId),
        status: 1 
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        countryId: true
      }
    });

    res.json({
      success: true,
      data: states,
      message: 'States retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch states',
      error: error.message
    });
  }
});

// Get cities by state ID
router.get('/states/:stateId/cities', async (req, res) => {
  try {
    const { stateId } = req.params;
    
    const cities = await prisma.city.findMany({
      where: { 
        stateId: parseInt(stateId),
        status: 1 
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        stateId: true
      }
    });

    res.json({
      success: true,
      data: cities,
      message: 'Cities retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
});

// Get all location hierarchy (countries with states and cities)
router.get('/hierarchy', authenticateToken, async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      where: { status: 1 },
      orderBy: { name: 'asc' },
      include: {
        states: {
          where: { status: 1 },
          orderBy: { name: 'asc' },
          include: {
            cities: {
              where: { status: 1 },
              orderBy: { name: 'asc' },
              select: {
                id: true,
                name: true
              }
            }
          },
          select: {
            id: true,
            name: true,
            code: true,
            cities: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        code: true,
        states: true
      }
    });

    res.json({
      success: true,
      data: countries,
      message: 'Location hierarchy retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching location hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location hierarchy',
      error: error.message
    });
  }
});

// Create new country (Admin only)
router.post('/countries', authenticateToken, async (req, res) => {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }

    const country = await prisma.country.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase()
      }
    });

    res.status(201).json({
      success: true,
      data: country,
      message: 'Country created successfully'
    });
  } catch (error) {
    console.error('Error creating country:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Country name or code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create country',
      error: error.message
    });
  }
});

// Create new state (Admin only)
router.post('/states', authenticateToken, async (req, res) => {
  try {
    const { name, code, countryId } = req.body;
    
    if (!name || !countryId) {
      return res.status(400).json({
        success: false,
        message: 'Name and countryId are required'
      });
    }

    // Verify country exists
    const country = await prisma.country.findUnique({
      where: { id: parseInt(countryId) }
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    const state = await prisma.state.create({
      data: {
        name: name.trim(),
        code: code?.trim(),
        countryId: parseInt(countryId)
      }
    });

    res.status(201).json({
      success: true,
      data: state,
      message: 'State created successfully'
    });
  } catch (error) {
    console.error('Error creating state:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'State name already exists in this country'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create state',
      error: error.message
    });
  }
});

// Create new city (Admin only)
router.post('/cities', authenticateToken, async (req, res) => {
  try {
    const { name, stateId } = req.body;
    
    if (!name || !stateId) {
      return res.status(400).json({
        success: false,
        message: 'Name and stateId are required'
      });
    }

    // Verify state exists
    const state = await prisma.state.findUnique({
      where: { id: parseInt(stateId) }
    });

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const city = await prisma.city.create({
      data: {
        name: name.trim(),
        stateId: parseInt(stateId)
      }
    });

    res.status(201).json({
      success: true,
      data: city,
      message: 'City created successfully'
    });
  } catch (error) {
    console.error('Error creating city:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'City name already exists in this state'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create city',
      error: error.message
    });
  }
});

// Search locations
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = q.toLowerCase();
    let results = {};

    if (!type || type === 'countries') {
      results.countries = await prisma.country.findMany({
        where: {
          AND: [
            { status: 1 },
            {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { code: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          ]
        },
        select: {
          id: true,
          name: true,
          code: true
        },
        take: 10
      });
    }

    if (!type || type === 'states') {
      results.states = await prisma.state.findMany({
        where: {
          AND: [
            { status: 1 },
            { name: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          country: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        take: 10
      });
    }

    if (!type || type === 'cities') {
      results.cities = await prisma.city.findMany({
        where: {
          AND: [
            { status: 1 },
            { name: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          state: {
            select: {
              id: true,
              name: true,
              country: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          }
        },
        take: 10
      });
    }

    res.json({
      success: true,
      data: results,
      message: 'Search completed successfully'
    });
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search locations',
      error: error.message
    });
  }
});

export default router;