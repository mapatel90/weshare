import prisma from './prisma.js';

/**
 * Get user full name by ID
 * @param {number} userId - The user ID
 * @returns {Promise<string>} - The user's full name or 'Admin' if not found
 */
export const getUserFullName = async (userId) => {
  if (!userId) return 'Admin';

  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: { full_name: true }
    });

    return user?.full_name || 'Admin';
  } catch (error) {
    console.error('getUserFullName error:', error);
    return 'Admin';
  }
};


export const getSiteSettings = async () => {
  try {
    const settings = await prisma.site_settings.findMany({
      where: { key : { in: ['site_name', 'site_logo', 'contact_email'] } },
      select: { key: true, value: true }
    });
    return settings;
  } catch (error) {
    console.error('getSiteSettings error:', error);
    throw error;
  }
}
