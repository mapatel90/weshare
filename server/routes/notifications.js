import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from '../utils/notifications.js';

const router = express.Router();

/**
 * Get notifications for logged-in user
 * GET /api/notifications?page=1&limit=20&unreadOnly=true&moduleType=invoice
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly, moduleType, search, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const userId = req.user.id; // From authenticateToken middleware
    console.log("userId", userId);

    const result = await getNotificationsByUser({
      userId,
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      moduleType,
      search,
      sortBy,
      sortOrder,
    });

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get unread notification count
 * GET /api/notifications/unread-count?moduleType=invoice
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleType } = req.query;

    const result = await getUnreadCount(userId, moduleType);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await markNotificationAsRead(parseInt(id), userId);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Mark all notifications as read
 * PATCH /api/notifications/mark-all-read
 * Body: { moduleType?: string }
 */
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleType } = req.body;

    const result = await markAllAsRead(userId, moduleType);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await deleteNotification(parseInt(id), userId);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
