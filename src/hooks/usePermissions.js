/**
 * usePermissions Hook
 * 
 * A comprehensive hook for checking user permissions throughout the application.
 * Uses the permissions stored in AuthContext after user login.
 * 
 * Usage Examples:
 * 
 * const { hasPermission, canView, canCreate, canEdit, canDelete, hasModuleAccess } = usePermissions();
 * 
 * // Check specific permission
 * if (hasPermission('projects', 'create')) { ... }
 * 
 * // Check if user can view (either view_own or view_global)
 * if (canView('projects')) { ... }
 * 
 * // Check specific capabilities
 * if (canCreate('users')) { ... }
 * if (canEdit('invoices')) { ... }
 * if (canDelete('contracts')) { ... }
 * 
 * // Check if user has any access to a module
 * if (hasModuleAccess('settings')) { ... }
 * 
 * // Filter menu items based on permissions
 * const filteredMenu = filterMenuByPermissions(menuList);
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles';
import { CAPABILITIES } from '@/constants/permissions';

export const usePermissions = () => {
  const { user } = useAuth();

  // Get permissions from user object
  const permissions = useMemo(() => {
    return user?.permissions || {};
  }, [user?.permissions]);

  // Check if user is Super Admin (has all permissions)
  const isSuperAdmin = useMemo(() => {
    return user?.role === ROLES.SUPER_ADMIN;
  }, [user?.role]);

  /**
   * Check if user has a specific permission
   * @param {string} module - Module name (e.g., 'projects', 'users')
   * @param {string} capability - Capability name (e.g., 'view_own', 'create', 'edit', 'delete')
   * @returns {boolean}
   */
  const hasPermission = useCallback((module, capability) => {
    // Super Admin has all permissions
    if (isSuperAdmin) return true;
    // Check if module exists and capability is true
    return permissions[module]?.[capability] === true;
  }, [permissions, isSuperAdmin]);

  /**
   * Check if user can view a module (either view_own or view_global)
   * @param {string} module - Module name
   * @returns {boolean}
   */
  const canView = useCallback((module) => {
    return hasPermission(module, CAPABILITIES.VIEW);
  }, [hasPermission]);

  /**
   * Check if user can create in a module
   * @param {string} module - Module name
   * @returns {boolean}
   */
  const canCreate = useCallback((module) => {
    return hasPermission(module, CAPABILITIES.CREATE);
  }, [hasPermission]);

  /**
   * Check if user can edit in a module
   * @param {string} module - Module name
   * @returns {boolean}
   */
  const canEdit = useCallback((module) => {
    return hasPermission(module, CAPABILITIES.EDIT);
  }, [hasPermission]);

  /**
   * Check if user can delete in a module
   * @param {string} module - Module name
   * @returns {boolean}
   */
  const canDelete = useCallback((module) => {
    return hasPermission(module, CAPABILITIES.DELETE);
  }, [hasPermission]);

  /**
   * Check if user has any access to a module (any capability)
   * @param {string} module - Module name
   * @returns {boolean}
   */
  const hasModuleAccess = useCallback((module) => {
    // Super Admin has access to all modules
    if (isSuperAdmin) return true;
    
    const modulePermissions = permissions[module];
    if (!modulePermissions) return false;

    // Check if any capability is true
    return Object.values(modulePermissions).some(value => value === true);
  }, [permissions, isSuperAdmin]);

  /**
   * Get all permissions for a specific module
   * @param {string} module - Module name
   * @returns {object} Module permissions object
   */
  const getModulePermissions = useCallback((module) => {
    return permissions[module] || {};
  }, [permissions]);

  /**
   * Check multiple permissions at once
   * @param {Array<{module: string, capability: string}>} checks - Array of permission checks
   * @returns {boolean} True if ALL permissions are granted
   */
  const hasAllPermissions = useCallback((checks) => {
    return checks.every(({ module, capability }) => hasPermission(module, capability));
  }, [hasPermission]);

  /**
   * Check if user has any of the specified permissions
   * @param {Array<{module: string, capability: string}>} checks - Array of permission checks
   * @returns {boolean} True if ANY permission is granted
   */
  const hasAnyPermission = useCallback((checks) => {
    return checks.some(({ module, capability }) => hasPermission(module, capability));
  }, [hasPermission]);

  /**
   * Filter menu items based on user permissions
   * @param {Array} menuItems - Array of menu items from menuList
   * @returns {Array} Filtered menu items
   */
  const filterMenuByPermissions = useCallback((menuItems) => {
    const filterRecursive = (items) => {
      return items
      .map(item => {
          const moduleName = item.permission ? item.permission : item.name.toLowerCase().replace(/\s+/g, "_");

          const hasSelfAccess = canView(moduleName);

          let filteredDropdown = [];
          if (Array.isArray(item.dropdownMenu)) {
            filteredDropdown = filterRecursive(item.dropdownMenu);
          }

          if (!hasSelfAccess && filteredDropdown.length === 0) {
            return null;
          }

          return {
            ...item,
            dropdownMenu: filteredDropdown.length ? filteredDropdown : undefined,
          };
        })
        .filter(Boolean);
    };

    return filterRecursive(menuItems);
  }, [canView, hasModuleAccess]);


  return {
    // State
    permissions,
    isSuperAdmin,

    // Permission checks
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    hasModuleAccess,
    getModulePermissions,

    // Batch checks
    hasAllPermissions,
    hasAnyPermission,

    // Menu filtering
    filterMenuByPermissions,
  };
};

export default usePermissions;

