'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import usePermissions from '@/hooks/usePermissions';
import { getRoutePermission } from '@/config/routePermissions';

const RoutePermissionGuard = ({
  children,
  module: propModule,
  capability: propCapability,
  canView = false,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  fallback = null,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const {
    hasPermission,
    canView: checkCanView,
    canCreate: checkCanCreate,
    canEdit: checkCanEdit,
    canDelete: checkCanDelete,
    hasModuleAccess,
    permissions,
  } = usePermissions();

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    // If no user, ProtectedRoute will handle redirect to login
    if (!user) {
      setIsChecking(false);
      return;
    }

    const checkPermission = () => {
      // Get route permission from config if not provided as props
      const routeConfig = getRoutePermission(pathname);
      
      // Determine module and capability
      let module = propModule;
      let capability = propCapability;
      
      if (!module && routeConfig) {
        module = routeConfig.module;
        capability = routeConfig.capability;
      }
      
      // If no module found, allow access (route not configured)
      if (!module) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      let permitted = false;

      // Check based on props first
      if (canView) {
        permitted = checkCanView(module);
      } else if (canCreate) {
        permitted = checkCanCreate(module);
      } else if (canEdit) {
        permitted = checkCanEdit(module);
      } else if (canDelete) {
        permitted = checkCanDelete(module);
      } else if (capability) {
        permitted = hasPermission(module, capability);
      } else {
        // Default to module access check
        permitted = hasModuleAccess(module);
      }

      setHasAccess(permitted);
      setIsChecking(false);

      // Redirect to access denied page if no permission
      if (!permitted) {
        router.replace('/admin/access-denied');
      }
    };

    checkPermission();
  }, [
    pathname,
    propModule,
    propCapability,
    canView,
    canCreate,
    canEdit,
    canDelete,
    hasPermission,
    checkCanView,
    checkCanCreate,
    checkCanEdit,
    checkCanDelete,
    hasModuleAccess,
    permissions,
    router,
    user,
    authLoading,
  ]);

  // Show loading state while checking
  if (isChecking || authLoading) {
    return fallback || (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking permissions...</span>
        </div>
      </div>
    );
  }

  // If no access, don't render anything (redirect is happening)
  if (!hasAccess) {
    return fallback || null;
  }

  return <>{children}</>;
};

export default RoutePermissionGuard;

