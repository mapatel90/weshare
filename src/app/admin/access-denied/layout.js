'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import useBootstrapUtils from '@/hooks/useBootstrapUtils';

const AccessDeniedLayout = ({ children }) => {
    const pathName = usePathname();
    useBootstrapUtils(pathName);

    return (
        <ProtectedRoute>
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{children}</div>
        </ProtectedRoute>
    );
};

export default AccessDeniedLayout;

