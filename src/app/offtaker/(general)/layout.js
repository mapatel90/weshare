"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import useBootstrapUtils from "@/hooks/useBootstrapUtils";
import '@/assets/portal/offtaker.css';
import { initializeOfftakerPortal, toggleSidebar, toggleSubmenu } from '@/assets/portal/offtaker.js';
import Header from "@/components/portal/layouts/Header";
import PannelSidebar from "@/components/portal/layouts/PannelSidebar";
import MainSidebar from "@/components/portal/layouts/MainSidebar";
import Section from "@/components/portal/layouts/Section";

const layout = ({ children }) => {
  const pathName = usePathname();
  useBootstrapUtils(pathName);

    useEffect(() => {
        initializeOfftakerPortal();
        toggleSidebar();
        toggleSubmenu(document.querySelector(`a[href='${pathName}']`));
    }, [pathName])

    return (
        <ProtectedRoute>
            <MainSidebar />
            <PannelSidebar />
            <div className="main-content" id="mainContent">
                <Header toggleSidebar={toggleSidebar} />
                {children}
            </div>
        </ProtectedRoute>
    )
}

export default layout;
