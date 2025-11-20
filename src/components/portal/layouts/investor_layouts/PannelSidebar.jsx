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
                {/* <div className="menu-section">
                    <Link
                        href="/investor/projects"
                        className={`menu-item${activeMenu === 'payouts' ? ' active' : ''}`}
                        onClick={() => setActiveMenu('payouts')}
                    >{lang("offtaker_login.sidebar.mypayouts")}</Link>
                </div> */}
            </div>
        </div>
    );
}


export default PannelSidebar;

// }