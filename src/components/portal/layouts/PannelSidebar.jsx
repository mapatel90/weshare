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
                        window.location.href = '/offtaker/dashboard';
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <div>{lang("offtaker_login.sidebar.dashboard")}</div>
                </div>
                <div
                    className={`menu-item${activeMenu === 'projects' ? ' active' : ''}`}
                    onClick={() => setActiveMenu('projects')}
                >
                    <span>{lang("offtaker_login.sidebar.myprojects")}</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
                <div className={`submenu${activeMenu === 'projects' ? ' active show' : ''}`}>
                    <div className="submenu-item">
                        <Link href="/offtaker/projects" onClick={handleClose}>{lang("offtaker_login.sidebar.projectList")}</Link>
                    </div>
                    {/* <div className="submenu-item">Performance</div> */}
                </div>
            </div>
            <div className="menu-section">
                <Link
                    href="/offtaker/billings"
                    className={`menu-item${activeMenu === 'billings' ? ' active' : ''}`}
                    onClick={() => setActiveMenu('billings')}
                >{lang("offtaker_login.sidebar.billings")}</Link>
            </div>
            <div className="menu-section">
                <Link
                    href="/offtaker/payments"
                    className={`menu-item${activeMenu === 'payments' ? ' active' : ''}`}
                    onClick={() => setActiveMenu('payments')}
                >{lang("offtaker_login.sidebar.payments")}</Link>
            </div>
            <div className="menu-section">
                <Link
                    href="/offtaker/notifications"
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
                    <Link href="/offtaker/reports/saving-reports/" className="menu-item">{lang("offtaker_login.sidebar.savingreports")}</Link>
                    <Link href="/offtaker/reports/conjunction-reports/" className="menu-item">{lang("offtaker_login.sidebar.conjunctionreports")}</Link>
                </div>
            </div>
            <div className="menu-section">
                <div className="menu-item">{lang("offtaker_login.sidebar.contracts")}</div>
            </div>
            {/* 
                <div className="menu-section">
                    <div className="menu-item">Support</div>
                </div> */}
        </div>
    );
}


export default PannelSidebar;

// }