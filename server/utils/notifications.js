import prisma from './prisma.js';

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {number} options.userId - ID of the user to notify (required)
 * @param {string} options.title - Notification title (required)
 * @param {string} [options.message] - Detailed notification message
 * @param {string} [options.moduleType] - Type of module (e.g., "invoice", "payment", "contract", "project")
 * @param {number} [options.moduleId] - ID of the related resource
 * @param {string} [options.actionUrl] - URL to navigate when clicked
 * @returns {Promise<Object>} Result object with success status and notification data
 */
export const createNotification = async ({
  userId,
  title,
  message = null,
  moduleType = null,
  moduleId = null,
  actionUrl = null,
  created_by = null,
}) => {
  try {
    // Validation
    if (!userId) {
      return { success: false, message: 'userId is required' };
    }
    if (!title) {
      return { success: false, message: 'title is required' };
    }

    // Create notification
    const notification = await prisma.notifications.create({
      data: {
        user_id: parseInt(userId),
        title: title,
        message: message,
        module_type: moduleType,
        module_id: moduleId ? parseInt(moduleId) : null,
        action_url: actionUrl,
        is_read: 0,
        created_by: created_by,
      },
    });

    console.log(`Notification created for user ${userId}: ${title}`);
    return { success: true, data: notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, message: 'Failed to create notification', error: error.message };
  }
};

/**
 * Create notifications for multiple users
 * @param {Object} options - Notification options
 * @param {number[]} options.userIds - Array of user IDs to notify (required)
 * @param {string} options.title - Notification title (required)
 * @param {string} [options.message] - Detailed notification message
 * @param {string} [options.moduleType] - Type of module
 * @param {number} [options.moduleId] - ID of the related resource
 * @param {string} [options.actionUrl] - URL to navigate when clicked
 * @returns {Promise<Object>} Result object with success status and created count
 */
export const createBulkNotifications = async ({
  userIds,
  title,
  message = null,
  moduleType = null,
  moduleId = null,
  actionUrl = null,
}) => {
  try {
    // Validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return { success: false, message: 'userIds array is required' };
    }
    if (!title) {
      return { success: false, message: 'title is required' };
    }

    // Create notification data for each user
    const notificationsData = userIds.map(userId => ({
      user_id: parseInt(userId),
      title: title,
      message: message,
      module_type: moduleType,
      module_id: moduleId ? parseInt(moduleId) : null,
      action_url: actionUrl,
      is_read: 0,
    }));

    // Bulk create
    const result = await prisma.notifications.createMany({
      data: notificationsData,
    });

    console.log(`${result.count} notifications created for ${userIds.length} users`);
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return { success: false, message: 'Failed to create bulk notifications', error: error.message };
  }
};

/**
 * Get notifications for a specific user with pagination
 * @param {Object} options - Query options
 * @param {number} options.userId - User ID (required)
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {boolean} [options.unreadOnly=false] - Only fetch unread notifications
 * @param {string} [options.moduleType] - Filter by module type
 * @param {string} [options.search] - Search term for title and message
 * @param {string} [options.sortBy='created_at'] - Field to sort by (title, created_at, is_read)
 * @param {string} [options.sortOrder='desc'] - Sort order (asc or desc)
 * @returns {Promise<Object>} Result object with notifications and pagination info
 */
export const getNotificationsByUser = async ({
  userId,
  page = 1,
  limit = 20,
  unreadOnly = false,
  moduleType = null,
  search = null,
  sortBy = 'created_at',
  sortOrder = 'desc',
}) => {
  try {
    if (!userId) {
      return { success: false, message: 'userId is required' };
    }

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {
      user_id: parseInt(userId),
      ...(unreadOnly && { is_read: 0 }),
      ...(moduleType && { module_type: moduleType }),
    };

    // Add search condition if search term provided
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { message: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Validate and set sort order
    const validSortOrder = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const validSortBy = ['title', 'created_at', 'is_read', 'module_type'].includes(sortBy) ? sortBy : 'created_at';

    // Fetch notifications and count
    const orderByObject = {};
    orderByObject[validSortBy] = validSortOrder;

    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        orderBy: orderByObject,
      }),
      prisma.notifications.count({ where }),
    ]);

    return {
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, message: 'Failed to fetch notifications', error: error.message };
  }
};

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} [userId] - Optional user ID for validation
 * @returns {Promise<Object>} Result object
 */
export const markNotificationAsRead = async (notificationId, userId = null) => {
  try {
    if (!notificationId) {
      return { success: false, message: 'notificationId is required' };
    }

    // If userId provided, verify ownership first
    if (userId) {
      const notification = await prisma.notifications.findFirst({
        where: {
          id: parseInt(notificationId),
          user_id: parseInt(userId),
        },
      });

      if (!notification) {
        return { success: false, message: 'Notification not found or access denied' };
      }
    }

    const updated = await prisma.notifications.update({
      where: { id: parseInt(notificationId) },
      data: { is_read: 1 },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, message: 'Failed to mark notification as read', error: error.message };
  }
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId - User ID
 * @param {string} [moduleType] - Optional: only mark notifications of specific type as read
 * @returns {Promise<Object>} Result object with count of updated notifications
 */
export const markAllAsRead = async (userId, moduleType = null) => {
  try {
    if (!userId) {
      return { success: false, message: 'userId is required' };
    }

    const where = {
      user_id: parseInt(userId),
      is_read: 0,
      ...(moduleType && { module_type: moduleType }),
    };

    const result = await prisma.notifications.updateMany({
      where,
      data: { is_read: 1 },
    });

    console.log(`Marked ${result.count} notifications as read for user ${userId}`);
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, message: 'Failed to mark all notifications as read', error: error.message };
  }
};

/**
 * Delete a notification (hard delete)
 * @param {number} notificationId - Notification ID
 * @param {number} [userId] - Optional user ID for validation
 * @returns {Promise<Object>} Result object
 */
export const deleteNotification = async (notificationId, userId = null) => {
  try {
    if (!notificationId) {
      return { success: false, message: 'notificationId is required' };
    }

    // If userId provided, verify ownership
    if (userId) {
      const notification = await prisma.notifications.findFirst({
        where: {
          id: parseInt(notificationId),
          user_id: parseInt(userId),
        },
      });

      if (!notification) {
        return { success: false, message: 'Notification not found or access denied' };
      }
    }

    await prisma.notifications.delete({
      where: { id: parseInt(notificationId) },
    });

    return { success: true, message: 'Notification deleted successfully' };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, message: 'Failed to delete notification', error: error.message };
  }
};

/**
 * Get unread notification count for a user
 * @param {number} userId - User ID
 * @param {string} [moduleType] - Optional: count only specific module type
 * @returns {Promise<Object>} Result object with unread count
 */
export const getUnreadCount = async (userId, moduleType = null) => {
  try {
    if (!userId) {
      return { success: false, message: 'userId is required' };
    }

    const where = {
      user_id: parseInt(userId),
      is_read: 0,
      ...(moduleType && { module_type: moduleType }),
    };

    const count = await prisma.notifications.count({ where });

    return { success: true, data: { count } };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, message: 'Failed to get unread count', error: error.message };
  }
};

/**
 * Delete old read notifications (cleanup utility)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<Object>} Result object with count of deleted notifications
 */
export const deleteOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notifications.deleteMany({
      where: {
        is_read: 1,
        created_at: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Deleted ${result.count} old notifications (older than ${daysOld} days)`);
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    return { success: false, message: 'Failed to delete old notifications', error: error.message };
  }
};

// Default export
export default {
  createNotification,
  createBulkNotifications,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  deleteOldNotifications,
};
