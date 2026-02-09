/**
 * System Constants and Configuration
 *
 * These constants can be configured via environment variables
 * with fallback to default values or database queries.
 */

/**
 * System User IDs Configuration
 *
 * ADMIN_USER_IDS: Comma-separated list of admin user IDs who receive system notifications
 * Example: ADMIN_USER_IDS=1,2,3
 *
 * Can be overridden via environment variable or will query from database by role
 */
export const SYSTEM_USERS = {
  // Parse comma-separated admin IDs from env, fallback to [1]
  ADMIN_USER_IDS: process.env.ADMIN_USER_IDS
    ? process.env.ADMIN_USER_IDS.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    : [1],

  // Single admin ID for backward compatibility
  ADMIN_USER_ID: process.env.ADMIN_USER_ID ? parseInt(process.env.ADMIN_USER_ID) : 1,
};

/**
 * User Roles (should match your database roles table)
 * Import from your roles constants if available
 */
export const USER_ROLES = {
  SUPER_ADMIN: 1,
  STAFF_ADMIN: 2,
  OFFTAKER: 3,
  INVESTOR: 4,
};

/**
 * Notification Recipients Configuration
 * Define which roles should receive which types of notifications
 */
export const NOTIFICATION_RECIPIENTS = {
  PROJECT_CREATED: {
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF_ADMIN], // Roles to notify
    excludeCreator: true, // Don't notify the person who created it
  },
  PROJECT_APPROVED: {
    roles: [USER_ROLES.OFFTAKER], // Notify offtakers
    includeAdmins: true, // Also notify admins
  },
  INVESTMENT_RECEIVED: {
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF_ADMIN, USER_ROLES.OFFTAKER],
  },
  PAYOUT_CREATED: {
    roles: [USER_ROLES.INVESTOR], // Notify investors
    includeAdmins: true,
  },
  // Add more notification types as needed
};

/**
 * Helper Functions
 */

/**
 * Get single admin user ID (backward compatibility)
 * @returns {number} Primary admin user ID
 */
export const getAdminUserId = () => {
  return SYSTEM_USERS.ADMIN_USER_ID;
};

/**
 * Get all admin user IDs
 * @returns {number[]} Array of admin user IDs
 */
export const getAdminUserIds = () => {
  return SYSTEM_USERS.ADMIN_USER_IDS;
};

/**
 * Get users by role from database
 * @param {object} prisma - Prisma client instance
 * @param {number|number[]} roleIds - Single role ID or array of role IDs
 * @param {object} options - Additional query options
 * @returns {Promise<Array>} Array of user objects
 */
export const getUsersByRole = async (prisma, roleIds, options = {}) => {
  try {
    const roleArray = Array.isArray(roleIds) ? roleIds : [roleIds];

    const users = await prisma.users.findMany({
      where: {
        role: {
          in: roleArray,
        },
        // Only active users
        ...(options.activeOnly !== false && { status: 1 }),
        // Exclude specific user IDs if needed
        ...(options.excludeUserIds && {
          id: { notIn: options.excludeUserIds },
        }),
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        language: true,
        ...options.select,
      },
    });

    return users;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return [];
  }
};

/**
 * Get all admin users (Super Admin + Staff Admin)
 * @param {object} prisma - Prisma client instance
 * @param {object} options - Additional query options
 * @returns {Promise<Array>} Array of admin user objects
 */
export const getAdminUsers = async (prisma, options = {}) => {
  // First, try to get from environment variable
  const envAdminIds = getAdminUserIds();

  if (envAdminIds && envAdminIds.length > 0) {
    try {
      const users = await prisma.users.findMany({
        where: {
          id: { in: envAdminIds },
          ...(options.activeOnly !== false && { status: 1 }),
        },
        select: {
          id: true,
          full_name: true,
          email: true,
          role_id: true,
          language: true,
          ...options.select,
        },
      });
      return users;
    } catch (error) {
      console.error('Error fetching admin users by IDs:', error);
    }
  }

  // Fallback: Query by role
  return getUsersByRole(
    prisma,
    [USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF_ADMIN],
    options
  );
};

/**
 * Get notification recipients based on notification type
 * @param {object} prisma - Prisma client instance
 * @param {string} notificationType - Type of notification (e.g., 'PROJECT_CREATED')
 * @param {object} context - Additional context (e.g., creatorId, projectId)
 * @returns {Promise<Array>} Array of user IDs to notify
 */
export const getNotificationRecipients = async (prisma, notificationType, context = {}) => {
  const config = NOTIFICATION_RECIPIENTS[notificationType];

  if (!config) {
    console.warn(`No notification config found for type: ${notificationType}`);
    return [];
  }

  let recipients = [];

  // Get users by role
  if (config.roles && config.roles.length > 0) {
    const excludeUserIds = config.excludeCreator && context.creatorId
      ? [context.creatorId]
      : [];

    const users = await getUsersByRole(prisma, config.roles, {
      excludeUserIds,
      activeOnly: true,
    });

    recipients = users.map(u => u.id);
  }

  // Include admins if specified
  if (config.includeAdmins) {
    const adminUsers = await getAdminUsers(prisma, { activeOnly: true });
    const adminIds = adminUsers.map(u => u.id);

    // Merge and deduplicate
    recipients = [...new Set([...recipients, ...adminIds])];
  }

  // Exclude creator if specified
  if (config.excludeCreator && context.creatorId) {
    recipients = recipients.filter(id => id !== context.creatorId);
  }

  return recipients;
};
