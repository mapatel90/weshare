'use client';

import React from 'react';
import { closeSidebars } from '@/assets/portal/offtaker.js';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

function PannelSidebar({ activeMenu, setActiveMenu }) {
    const { lang } = useLanguage();
    const handleClose = () => {
        closeSidebars();
    };

    return (
        <div className="text-sidebar" id="textSidebar">
            <button className="close-sidebar-btn" onClick={handleClose}>✕</button>
            <div className="menu-section">
                <div
                    className={`menu-header menu-item${activeMenu === 'dashboard' ? ' active' : ''}`}
                    onClick={() => {
                        handleClose();
                        window.location.href = '/investor/dashboard';
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <div>{lang("offtaker_login.sidebar.dashboard")}</div>
                </div>
                <div className="menu-section">
                    <Link
                        href="/investor/projects"
                        className={`menu-item${activeMenu === 'projects' ? ' active' : ''}`}
                        onClick={() => setActiveMenu('projects')}
                    >{lang("offtaker_login.sidebar.myprojects")}</Link>
                </div>
                <div className="menu-section">
                    <Link
                        href="/investor/payouts"
                        className={`menu-item${activeMenu === 'payouts' ? ' active' : ''}`}
                        onClick={() => setActiveMenu('payouts')}
                    >{lang("offtaker_login.sidebar.payouts")}</Link>
                </div>
                <div className="menu-section">
                    <Link
                        href="/investor/notifications"
                        className={`menu-item${activeMenu === 'notifications' ? ' active' : ''}`}
                        onClick={() => setActiveMenu('notifications')}
                    >{lang("offtaker_login.sidebar.notifications")}</Link>
                </div>
                <div className="menu-section">
                    <div
                        className={`menu-item${activeMenu === 'reports' ? ' active' : ''}`}
                        onClick={() => setActiveMenu('reports')}
                    >
                        <span>{lang("offtaker_login.sidebar.reports")}</span>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                    <div className={`submenu${activeMenu === 'reports' ? ' show' : ''}`}>
                        <Link href="/investor/reports/roi-reports/" className="menu-item">ROI Reports</Link>
                        <Link href="/investor/reports/cash-flow-reports/" className="menu-item">Cash Flow Reports</Link>
                        <Link href="/investor/reports/investment-summary-reports/" className="menu-item">Investment Summary</Link>
                    </div>
                </div>
                <div className="menu-section">
                    <div className="menu-item">{lang("offtaker_login.sidebar.contracts")}</div>
                </div>
            </div>
        </div>
    );
}


export default PannelSidebar;

// }