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
                <div
                    className={`menu-item${activeMenu === 'projects' ? ' active' : ''}`}
                    onClick={() => setActiveMenu('projects')}
                >
                    <span>{lang("offtaker_login.sidebar.myprojects")}</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
                <div className={`submenu${activeMenu === 'projects' ? ' active show' : ''}`}>
                    <div className="submenu-item">
                        <Link href="/investor/projects" onClick={handleClose}>{lang("offtaker_login.sidebar.projectList")}</Link>
                    </div>
                </div>
                {/* <div
                    className={`menu-header menu-item${activeMenu === 'payouts' ? ' active' : ''}`}
                    onClick={() => {
                        handleClose();
                        window.location.href = '/investor/dashboard';
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <div>Payouts</div>
                </div> */}
            </div>
        </div>
    );
}


export default PannelSidebar;

// }