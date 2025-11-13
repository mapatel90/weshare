import React from 'react';

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

    return (
        <div className="text-sidebar" id="textSidebar">
            <div className="menu-section">
                <div className="menu-header">Dashboard</div>
                <div className="menu-item active" onClick={toggleSubmenu}>
                    <span>My Projects</span>
                    <span>▼</span>
                </div>
                <div className="submenu show">
                    <div className="submenu-item">View Details</div>
                    <div className="submenu-item">Performance</div>
                    <div className="submenu-item">Billing</div>
                    <div className="submenu-item">Payment</div>
                </div>
            </div>

            <div className="menu-section">
                <div className="menu-item" onClick={toggleSubmenu}>
                    <span>Documents</span>
                    <span>▼</span>
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
                    <span>▼</span>
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