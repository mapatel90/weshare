'use client';

import React from 'react';
import Link from 'next/link';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PaymentIcon from '@mui/icons-material/Payment';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';

// function MainSidebar() {
function MainSidebar({ activeMenu, setActiveMenu }) {
    console.log("setActiveMenu in MainSidebar:", activeMenu);
    return (
        <div className="icon-sidebar" id="iconSidebar">
            <div className='icon-size'>
                <Link href="/">
                    <img src="/images/logo/icon.png" className="logo-icon" alt="weshare logo" />
                </Link>
            </div>
            <div className="logo-separator" />

            <div className="icon-menu">
                <div className={`icon-item${activeMenu === 'dashboard' ? ' active' : ''}`} data-menu="dashboard" title="Dashboard" onClick={() => setActiveMenu('dashboard')}><DashboardOutlinedIcon sx={{ color: '#1976d2' }} /></div>
                <div className={`icon-item${activeMenu === 'projects' ? ' active' : ''}`} data-menu="projects" title="Projects" onClick={() => setActiveMenu('projects')}><HomeWorkOutlinedIcon sx={{ color: '#9c27b0' }} /></div>
                <div className={`icon-item${activeMenu === 'payouts' ? ' active' : ''}`} data-menu="payouts" title="Payouts" onClick={() => setActiveMenu('payouts')}><PaymentIcon sx={{ color: '#43a047' }} /></div>
                <div className={`icon-item${activeMenu === 'notifications' ? ' active' : ''}`} data-menu="notifications" title="Notifications" onClick={() => setActiveMenu('notifications')}><NotificationsActiveIcon sx={{ color: '#e53935' }} /></div>
                <div className={`icon-item${activeMenu === 'reports' ? ' active' : ''}`} data-menu="reports" title="Reports" onClick={() => setActiveMenu('reports')}><AutoGraphOutlinedIcon sx={{ color: '#00838f' }} /></div>
                <div className={`icon-item${activeMenu === 'contract' ? ' active' : ''}`} data-menu="contract" title="Contract" onClick={() => setActiveMenu('contract')}><NoteAltOutlinedIcon sx={{ color: '#00838f' }} /></div>
                {/* <div className={`icon-item${activeMenu === 'billings' ? ' active' : ''}`} data-menu="billings" title="Billings" onClick={() => setActiveMenu('billings')}><ReceiptIcon sx={{ color: '#fb8c00' }} /></div>
                {/* <div className="icon-item support">💬</div> */}
            </div>
        </div>
    );
}
// }
export default MainSidebar;