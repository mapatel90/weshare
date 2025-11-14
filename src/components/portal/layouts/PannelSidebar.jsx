import React from 'react';
import { closeSidebars } from '@/assets/portal/offtaker.js';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

function PannelSidebar() {
    const toggleSubmenu = (e) => {
        const item = e.currentTarget;
        // preserve existing class names but toggle active/show as original onclick did
        item.classList.toggle('active');
        const submenu = item.nextElementSibling;
        if (submenu && submenu.classList.contains('submenu')) {
            submenu.classList.toggle('show');
        }
    };

    const handleClose = () => {
        closeSidebars();
    };

    return (
        <div className="text-sidebar" id="textSidebar">
            <button className="close-sidebar-btn" onClick={handleClose}>✕</button>
            <div className="menu-section">
                <div className="menu-header">
                    <Link href="/offtaker/dashboard" onClick={handleClose}>Dashboard</Link>
                </div>
                <div className="menu-item active" onClick={toggleSubmenu}>
                    <span>My Projects</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
                <div className="submenu show">
                    <div className="submenu-item">
                        <Link href="/offtaker/projects" onClick={handleClose}>View Details</Link>
                    </div>
                    <div className="submenu-item">Performance</div>
                    {/* <div className="submenu-item">Billing</div> */}
                    {/* <div className="submenu-item">Payment</div> */}
                </div>
            </div>

            <div className="menu-section">
                <div className="menu-item" onClick={toggleSubmenu}>
                    <span>Documents</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
                <div className="submenu">
                    <div className="submenu-item">All Documents</div>
                    <div className="submenu-item">Contracts</div>
                    <div className="submenu-item">Reports</div>
                </div>
            </div>

            <div className="menu-section">
                <div className="menu-item" onClick={toggleSubmenu}>
                    <span>Reports</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
                <div className="submenu">
                    <div className="submenu-item">Monthly Reports</div>
                    <div className="submenu-item">Annual Reports</div>
                </div>
            </div>

            <div className="menu-section">
                <div className="menu-item">Support</div>
            </div>
        </div>
    );
}

export default PannelSidebar;