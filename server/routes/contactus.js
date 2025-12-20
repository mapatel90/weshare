import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all contact us messages (admin only - with authentication)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 10;
    const offset = (pageInt - 1) * limitInt;

    // Build where clause
    const where = {
      is_deleted: 0
    };

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== undefined) {
      where.status = parseInt(status);
    }

    // Get contact messages with pagination
    const [messages, total] = await Promise.all([
      prisma.contact_us.findMany({
        where,
        skip: offset,
        take: limitInt,
        orderBy: { created_at: 'desc' }
      }),
      prisma.contact_us.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: pageInt,
          limit: limitInt,
          total,
          pages: Math.ceil(total / limitInt)
        }
      }
    });

  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new contact us message (no authentication required - public endpoint)
router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      subject,
      message
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, subject, and message are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Create contact message
    const newMessage = await prisma.contact_us.create({
      data: {
        full_name: fullName,
        email,
        phone_number: phoneNumber || null,
        subject,
        message,
        project_id: 2,
        status: 1 // 1 = read/responded
      }
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.',
      data: newMessage
    });

  } catch (error) {
    console.error('Create contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});

// Get contact message by ID (admin only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await prisma.contact_us.findUnique({
      where: { 
        id: parseInt(id),
        is_deleted: 0
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Get contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update contact message status (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phoneNumber, subject, message } = req.body;

    // Check if message exists
    const existingMessage = await prisma.contact_us.findUnique({
      where: { 
        id: parseInt(id),
        is_deleted: 0
      }
    });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Update message status
    const updatedMessage = await prisma.contact_us.update({
      where: { id: parseInt(id) },
      data: {
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        subject,
        message
      }
    });

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: updatedMessage
    });

  } catch (error) {
    console.error('Update contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete contact message (admin only - soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if message exists
    const existingMessage = await prisma.contact_us.findUnique({
      where: { 
        id: parseInt(id),
        is_deleted: 0
      }
    });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Soft delete message
    await prisma.contact_us.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 }
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
