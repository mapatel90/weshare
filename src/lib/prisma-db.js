// This file replaces the old pool-based database connection
// All database operations should now use Prisma Client instead

import prisma from '../../server/utils/prisma.js';

// Legacy compatibility layer for existing code
// This provides the same interface but uses Prisma underneath
export class DatabaseAdapter {
  
  // Execute raw SQL query (use sparingly, prefer Prisma methods)
  static async query(text, params = []) {
    try {
      console.warn('Using raw SQL query. Consider using Prisma methods instead.');
      const result = await prisma.$queryRawUnsafe(text, ...params);
      return {
        rows: Array.isArray(result) ? result : [result],
        rowCount: Array.isArray(result) ? result.length : 1
      };
    } catch (error) {
      console.error('Raw query error:', error);
      throw error;
    }
  }

  // Get a transaction client (Prisma transaction)
  static async transaction(callback) {
    return await prisma.$transaction(async (tx) => {
      return await callback(tx);
    });
  }

  // User operations using Prisma
  static users = {
    // Find user by email
    findByEmail: async (email) => {
      return await prisma.users.findFirst({
        where: { email }
      });
    },

    // Create new user
    create: async (userData) => {
      return await prisma.users.create({
        data: userData
      });
    },

    // Find user by ID
    findById: async (id) => {
      return await prisma.users.findFirst({
        where: { id: parseInt(id) }
      });
    },

    // Update user
    update: async (id, userData) => {
      return await prisma.user.update({
        where: { id: parseInt(id) },
        data: userData
      });
    },

    // Delete user
    delete: async (id) => {
      return await prisma.user.delete({
        where: { id: parseInt(id) }
      });
    },

    // List users with pagination
    list: async (options = {}) => {
      const { page = 1, limit = 10, search, role, status } = options;
      const offset = (page - 1) * limit;

      const where = {};
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (role) where.userRole = role;
      if (status !== undefined) where.status = parseInt(status);

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      return { users, total };
    }
  };

  // Role operations using Prisma
  static roles = {
    // Find all roles
    findAll: async () => {
      return await prisma.role.findMany({
        orderBy: { name: 'asc' }
      });
    },

    // Find active roles
    findActive: async () => {
      return await prisma.role.findMany({
        where: { status: 1 },
        orderBy: { name: 'asc' }
      });
    },

    // Create new role
    create: async (roleData) => {
      return await prisma.role.create({
        data: roleData
      });
    },

    // Find role by ID
    findById: async (id) => {
      return await prisma.roles.findFirst({
        where: { id: parseInt(id) }
      });
    },

    // Find role by name
    findByName: async (name) => {
      return await prisma.roles.findFirst({
        where: { name }
      });
    },

    // Update role
    update: async (id, roleData) => {
      return await prisma.role.update({
        where: { id: parseInt(id) },
        data: roleData
      });
    },

    // Delete role
    delete: async (id) => {
      return await prisma.role.delete({
        where: { id: parseInt(id) }
      });
    }
  };
}

// For backward compatibility, export the old interface
export const query = DatabaseAdapter.query;
export const transaction = DatabaseAdapter.transaction;

// Export Prisma instance for direct use
export { prisma };

// Export the new interface
export default DatabaseAdapter;