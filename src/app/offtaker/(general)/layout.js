"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import useBootstrapUtils from "@/hooks/useBootstrapUtils";
import '@/assets/portal/offtaker.css';
import { initializeOfftakerPortal, toggleSidebar, toggleSubmenu, closeSidebars } from '@/assets/portal/offtaker.js';
import Header from "@/components/portal/layouts/Header";
import PannelSidebar from "@/components/portal/layouts/PannelSidebar";
import MainSidebar from "@/components/portal/layouts/MainSidebar";
import PageHeaderTitle from "@/components/portal/layouts/PageHeaderTitle";

const layout = ({ children }) => {
  const pathName = usePathname();
  useBootstrapUtils(pathName);

    const [activeMenu, setActiveMenu] = useState('dashboard');

    useEffect(() => {
        initializeOfftakerPortal();
        // Initialize toggle button icon based on screen size
        const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
        const toggleBtn = document.querySelector('.toggle-btn') || document.getElementById('toggleBtn');
        if (toggleBtn && !isMobile) {
            // Desktop: start with sidebar open (show ❮)
            toggleBtn.innerHTML = '❮';
        }
        toggleSubmenu(document.querySelector(`a[href='${pathName}']`));
    }, [pathName])

    return (
        <ProtectedRoute>
            <div className="sidebar-overlay" id="sidebarOverlay" onClick={closeSidebars}></div>
            <MainSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
            <PannelSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
            <div className="main-content" id="mainContent">
                <Header toggleSidebar={toggleSidebar} />
                <PageHeaderTitle />
                {children}
            </div>
        </ProtectedRoute>
    )
}

export default layout;
