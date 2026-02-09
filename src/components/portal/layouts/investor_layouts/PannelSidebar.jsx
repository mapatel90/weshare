'use client';

import React, { useState, useEffect } from 'react';
import { closeSidebars } from '@/assets/portal/offtaker.js';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname } from 'next/navigation';

function PannelSidebar() {
    const { lang } = useLanguage();
    const handleClose = () => {
        closeSidebars();
    };
    const [activeMenu, setActiveMenu] = useState('');
    const [reportsOpen, setReportsOpen] = useState(false);
    const pathname = usePathname();
    
    useEffect(() => {
        // Remove trailing slash and get last segment
        const cleanPath = pathname.replace(/\/$/, '');
        const lastSegment = cleanPath.split('/').pop() || '';
        setActiveMenu(lastSegment);
        
        // Auto-open reports submenu if on a reports page
        if (lastSegment === 'roi-reports' || lastSegment === 'investment-summary-reports') {
            setReportsOpen(true);
        }
    }, [pathname]);
    
    return (
        <div className="text-sidebar" id="textSidebar">
            <button className="close-sidebar-btn" onClick={handleClose}>✕</button>
            <div className="menu-section">
                <Link
                    href="/investor/dashboard"
                    className={`menu-header menu-item${activeMenu === 'dashboard' ? ' active' : ''}`}
                    onClick={handleClose}
                    style={{ cursor: 'pointer' }}
                >
                    <div>{lang("offtaker_login.sidebar.dashboard")}</div>
                </Link>
                <div className="menu-section">
                    <Link
                        href="/investor/projects"
                        className={`menu-header menu-item${activeMenu === 'projects' ? ' active' : ''}`}
                        onClick={handleClose}
                    >{lang("offtaker_login.sidebar.myprojects")}</Link>
                </div>
                <div className="menu-section">
                    <Link
                        href="/investor/payouts"
                        className={`menu-item${activeMenu === 'payouts' ? ' active' : ''}`}
                        onClick={handleClose}
                    >{lang("offtaker_login.sidebar.payouts")}</Link>
                </div>
                <div className="menu-section">
                    <Link
                        href="/investor/notifications"
                        className={`menu-item${activeMenu === 'notifications' ? ' active' : ''}`}
                        onClick={handleClose}
                    >{lang("offtaker_login.sidebar.notifications")}</Link>
                </div>
                <div className="menu-section">
                    <div
                        className={`menu-item${activeMenu === 'roi-reports' || activeMenu === 'investment-summary-reports' ? ' active' : ''}`}
                        onClick={() => setReportsOpen(!reportsOpen)}
                        style={{ cursor: 'pointer' }}
                    >
                        <span>{lang("offtaker_login.sidebar.reports")}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <div className={`submenu${reportsOpen ? ' show' : ''}`}>
                        <Link href="/investor/reports/roi-reports" className={`menu-item${activeMenu === 'roi-reports' ? ' active' : ''}`} onClick={handleClose}>{lang("menu.roireports")}</Link>
                        <Link href="/investor/reports/investment-summary-reports" className={`menu-item${activeMenu === 'investment-summary-reports' ? ' active' : ''}`} onClick={handleClose}>{lang("menu.investmentsummaryreports")}</Link>
                    </div>
                </div>
                <div className="menu-section">
                    <Link
                        href="/investor/contracts"
                        className={`menu-item${activeMenu === 'contracts' ? ' active' : ''}`}
                        onClick={handleClose}
                    >{lang("offtaker_login.sidebar.contracts")}</Link>
                </div>
            </div>
        </div>
    );
}


export default PannelSidebar;

// }