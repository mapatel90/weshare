'use client';

import React from 'react';
import { closeSidebars } from '@/assets/portal/offtaker.js';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

function PannelSidebar({ activeMenu, setActiveMenu }) {
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
                    <div>Dashboard</div>
                </div>
                <div
                    className={`menu-item${activeMenu === 'projects' ? ' active' : ''}`}
                    onClick={() => setActiveMenu('projects')}
                >
                    <span>My Projects</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
                <div className={`submenu${activeMenu === 'projects' ? ' active show' : ''}`}>
                    <div className="submenu-item">
                        <Link href="/offtaker/projects" onClick={handleClose}>View Details</Link>
                    </div>
                    <div className="submenu-item">Performance</div>
                </div>
            </div>
            <div className="menu-section">
                <div
                    className={`menu-item${activeMenu === 'billings' ? ' active' : ''}`}
                    onClick={() => setActiveMenu('billings')}
                >Billings</div>
            </div>
            <div className="menu-section">
                <div className={`menu-item${activeMenu === 'payments' ? ' active' : ''}`} onClick={() => setActiveMenu('payments')}>Payments</div>
            </div>
            <div className="menu-section">
                <div
                    className={`menu-item${activeMenu === 'notifications' ? ' active' : ''}`}
                    onClick={() => setActiveMenu('notifications')}
                >Notifications</div>
            </div>
            <div className="menu-section">
                <div
                    className={`menu-item${activeMenu === 'reports' ? ' active' : ''}`}
                    onClick={() => setActiveMenu('reports')}
                >
                    <span>Reports</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
                <div className={`submenu${activeMenu === 'reports' ? ' show' : ''}`}>
                    <div className="submenu-item">ROI Reports</div>
                    <div className="submenu-item">IRR Reports</div>
                    <div className="submenu-item">NPV Reports</div>
                </div>
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