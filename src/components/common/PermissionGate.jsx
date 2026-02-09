/**
 * PermissionGate Component
 * 
 * A wrapper component for conditionally rendering content based on user permissions.
 * 
 * Usage Examples:
 * 
 * // Single permission check
 * <PermissionGate module="projects" capability="create">
 *   <CreateButton />
 * </PermissionGate>
 * 
 * // Check if user can view (view_own or view_global)
 * <PermissionGate module="users" canView>
 *   <UsersList />
 * </PermissionGate>
 * 
 * // Check multiple capabilities (ANY)
 * <PermissionGate module="invoices" capabilities={['create', 'edit']} requireAll={false}>
 *   <EditInvoice />
 * </PermissionGate>
 * 
 * // Check multiple capabilities (ALL)
 * <PermissionGate module="settings" capabilities={['view_global', 'edit']} requireAll={true}>
 *   <SettingsPanel />
 * </PermissionGate>
 * 
 * // With fallback content
 * <PermissionGate module="finance" capability="delete" fallback={<NoAccessMessage />}>
 *   <DeleteButton />
 * </PermissionGate>
 * 
 * // Check module access (any permission)
 * <PermissionGate module="reports" hasAccess>
 *   <ReportsSection />
 * </PermissionGate>
 */

'use client';

import React from 'react';
import usePermissions from '@/hooks/usePermissions';

const PermissionGate = ({
  children,
  module,
  capability,
  capabilities = [],
  requireAll = false,
  canView = false,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  hasAccess = false,
  fallback = null,
}) => {
  const {
    hasPermission,
    canView: checkCanView,
    canCreate: checkCanCreate,
    canEdit: checkCanEdit,
    canDelete: checkCanDelete,
    hasModuleAccess,
  } = usePermissions();

  // Check if user has permission
  const checkPermission = () => {
    // If hasAccess is true, check if user has any access to the module
    if (hasAccess) {
      return hasModuleAccess(module);
    }

    // If canView is true, check if user can view (view_own or view_global)
    if (canView) {
      return checkCanView(module);
    }

    // If canCreate is true, check if user can create
    if (canCreate) {
      return checkCanCreate(module);
    }

    // If canEdit is true, check if user can edit
    if (canEdit) {
      return checkCanEdit(module);
    }

    // If canDelete is true, check if user can delete
    if (canDelete) {
      return checkCanDelete(module);
    }

    // If single capability is provided
    if (capability) {
      return hasPermission(module, capability);
    }

    // If multiple capabilities are provided
    if (capabilities.length > 0) {
      if (requireAll) {
        // User must have ALL capabilities
        return capabilities.every(cap => hasPermission(module, cap));
      } else {
        // User must have ANY capability
        return capabilities.some(cap => hasPermission(module, cap));
      }
    }

    // If no specific check is provided, default to checking module access
    return hasModuleAccess(module);
  };

  const hasAccess_ = checkPermission();

  if (!hasAccess_) {
    return fallback;
  }

  return <>{children}</>;
};

export default PermissionGate;

