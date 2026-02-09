'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PaymentIcon from '@mui/icons-material/Payment';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import { usePathname } from 'next/navigation';

// function MainSidebar() {
function MainSidebar() {
    const [activeMenu, setActiveMenu] = useState('');
    const pathname = usePathname();
    useEffect(() => {
        setActiveMenu(pathname.split('/').pop());
    }, [pathname]);
    return (
        <div className="icon-sidebar" id="iconSidebar">
            <div className='icon-size'>
                <Link href="/">
                    <img src="/images/logo/icon.png" className="logo-icon" alt="weshare logo" />
                </Link>
            </div>
            <div className="logo-separator" />

            <div className="icon-menu">
                <Link href="/investor/dashboard">
                    <div className={`icon-item${activeMenu === 'dashboard' ? ' active' : ''}`} data-menu="dashboard" title="Dashboard" onClick={() => setActiveMenu('dashboard')}><DashboardOutlinedIcon sx={{ color: '#1976d2' }} /></div>
                </Link>
                <Link href="/investor/projects">
                    <div className={`icon-item${activeMenu === 'projects' ? ' active' : ''}`} data-menu="projects" title="Projects" onClick={() => setActiveMenu('projects')}><HomeWorkOutlinedIcon sx={{ color: '#9c27b0' }} /></div>
                </Link>
                <Link href="/investor/payouts">
                    <div className={`icon-item${activeMenu === 'payouts' ? ' active' : ''}`} data-menu="payouts" title="Payouts" onClick={() => setActiveMenu('payouts')}><PaymentIcon sx={{ color: '#43a047' }} /></div>
                </Link>
                <Link href="/investor/notifications">
                    <div className={`icon-item${activeMenu === 'notifications' ? ' active' : ''}`} data-menu="notifications" title="Notifications" onClick={() => setActiveMenu('notifications')}><NotificationsActiveIcon sx={{ color: '#e53935' }} /></div>
                </Link>
                <Link href="/investor/reports/roi-reports">
                    <div className={`icon-item${activeMenu == 'roi-reports' || activeMenu == 'investment-summary-reports' ? ' active' : ''}`} data-menu="reports" title="Reports" onClick={() => setActiveMenu('reports')}><AutoGraphOutlinedIcon sx={{ color: '#00838f' }} /></div>
                </Link>
                <Link href="/investor/contracts">
                    <div className={`icon-item${activeMenu === 'contracts' ? ' active' : ''}`} data-menu="contract" title="Contracts" onClick={() => setActiveMenu('contracts')}><NoteAltOutlinedIcon sx={{ color: '#00838f' }} /></div>
                </Link>
            </div>
        </div>
    );
}
// }
export default MainSidebar;