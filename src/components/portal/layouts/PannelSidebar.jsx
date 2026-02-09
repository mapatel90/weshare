'use client';

import React, { useState, useEffect } from 'react';
import { closeSidebars } from '@/assets/portal/offtaker.js';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname } from 'next/navigation';

function PannelSidebar() {
    const { lang } = useLanguage();
    const [activeMenu, setActiveMenu] = useState('');
    const [reportsOpen, setReportsOpen] = useState(false);
    const pathname = usePathname();
    
    const handleClose = () => {
        closeSidebars();
    };

    useEffect(() => {
        // Remove trailing slash and get last segment
        const cleanPath = pathname.replace(/\/$/, '');
        const lastSegment = cleanPath.split('/').pop() || '';
        setActiveMenu(lastSegment);
        
        // Auto-open reports submenu if on a reports page
        if (lastSegment === 'inverter-env-reports' || lastSegment === 'project-env-reports' || lastSegment === 'saving-reports') {
            setReportsOpen(true);
        }
    }, [pathname]);

    return (
        <div className="text-sidebar" id="textSidebar">
            <button className="close-sidebar-btn" onClick={handleClose}>✕</button>
            <div className="menu-section">
                <Link
                    href="/offtaker/dashboard"
                    className={`menu-header menu-item${activeMenu === 'dashboard' ? ' active' : ''}`}
                    onClick={handleClose}
                >{lang("offtaker_login.sidebar.dashboard")}</Link>
                <div className="menu-section">
                    <Link
                        href="/offtaker/projects"
                        className={`menu-item${activeMenu === 'projects' ? ' active' : ''}`}
                        onClick={handleClose}
                    >{lang("offtaker_login.sidebar.myprojects")}</Link>
                </div>
            </div>
            <div className="menu-section">
                <Link
                    href="/offtaker/billings"
                    className={`menu-item${activeMenu === 'billings' ? ' active' : ''}`}
                    onClick={handleClose}
                >{lang("offtaker_login.sidebar.billings")}</Link>
            </div>
            <div className="menu-section">
                <Link
                    href="/offtaker/payments"
                    className={`menu-item${activeMenu === 'payments' ? ' active' : ''}`}
                    onClick={handleClose}
                >{lang("offtaker_login.sidebar.payments")}</Link>
            </div>
            <div className="menu-section">
                <Link
                    href="/offtaker/notifications"
                    className={`menu-item${activeMenu === 'notifications' ? ' active' : ''}`}
                    onClick={handleClose}
                >{lang("offtaker_login.sidebar.notifications")}</Link>
            </div>
            <div className="menu-section">
                <div
                    className={`menu-item${activeMenu === 'inverter-env-reports' || activeMenu === 'project-env-reports' || activeMenu === 'saving-reports' ? ' active' : ''}`}
                    onClick={() => setReportsOpen(!reportsOpen)}
                    style={{ cursor: 'pointer' }}
                >
                    <span>{lang("offtaker_login.sidebar.reports")}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
                </div>
                <div className={`submenu${reportsOpen ? ' show' : ''}`}>
                    <Link href="/offtaker/reports/inverter-env-reports" className={`menu-item${activeMenu === 'inverter-env-reports' ? ' active' : ''}`} onClick={handleClose}>{lang("offtaker_login.sidebar.inverter_report")}</Link>
                    <Link href="/offtaker/reports/project-env-reports" className={`menu-item${activeMenu === 'project-env-reports' ? ' active' : ''}`} onClick={handleClose}>{lang("offtaker_login.sidebar.project_env_report")}</Link>
                    <Link href="/offtaker/reports/saving-reports" className={`menu-item${activeMenu === 'saving-reports' ? ' active' : ''}`} onClick={handleClose}>{lang("offtaker_login.sidebar.savingreports")}</Link>
                </div>
            </div>
            <div className="menu-section">
                <Link
                    href="/offtaker/contracts"
                    className={`menu-item${activeMenu === 'contracts' ? ' active' : ''}`}
                    onClick={handleClose}
                >{lang("offtaker_login.sidebar.contracts")}</Link>
            </div>
        </div>
    );
}


export default PannelSidebar;

// }