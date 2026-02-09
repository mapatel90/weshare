'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
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
                    <img
                        src="/images/logo/icon.png"
                        className="logo-icon"
                        alt="weshare logo"
                    />
                </Link>
            </div>
            <div className="logo-separator" />

            <div className="icon-menu">
                <Link href="/offtaker/dashboard">
                    <div className={`icon-item${activeMenu === 'dashboard' ? ' active' : ''}`} data-menu="dashboard" title="Dashboard" onClick={() => setActiveMenu('dashboard')}><DashboardOutlinedIcon sx={{ color: '#1976d2' }} /></div>
                </Link>
                <Link href="/offtaker/projects">
                    <div className={`icon-item${activeMenu === 'projects' ? ' active' : ''}`} data-menu="projects" title="Projects" onClick={() => setActiveMenu('projects')}><HomeWorkOutlinedIcon sx={{ color: '#9c27b0' }} /></div>
                </Link>
                <Link href="/offtaker/billings">
                    <div className={`icon-item${activeMenu === 'billings' ? ' active' : ''}`} data-menu="billings" title="Billings" onClick={() => setActiveMenu('billings')}><ReceiptIcon sx={{ color: '#fb8c00' }} /></div>
                </Link>
                <Link href="/offtaker/payments">
                    <div className={`icon-item${activeMenu === 'payments' ? ' active' : ''}`} data-menu="payments" title="Payments" onClick={() => setActiveMenu('payments')}><PaymentIcon sx={{ color: '#43a047' }} /></div>
                </Link>
                <Link href="/offtaker/notifications">
                    <div className={`icon-item${activeMenu === 'notifications' ? ' active' : ''}`} data-menu="notifications" title="Notifications" onClick={() => setActiveMenu('notifications')}><NotificationsActiveIcon sx={{ color: '#e53935' }} /></div>
                </Link>
                <Link href="/offtaker/reports/inverter-env-reports">
                    <div className={`icon-item${activeMenu === 'reports' ? ' active' : ''}`} data-menu="reports" title="Reports" onClick={() => setActiveMenu('reports')}><AutoGraphOutlinedIcon sx={{ color: '#00838f' }} /></div>
                </Link>
                <Link href="/offtaker/contracts">
                    <div className={`icon-item${activeMenu === 'contracts' ? ' active' : ''}`} data-menu="contract" title="Contract" onClick={() => setActiveMenu('contracts')}><NoteAltOutlinedIcon sx={{ color: '#00838f' }} /></div>
                </Link>
                {/* <div className="icon-item support">💬</div> */}
            </div>
        </div>
    );
}
// }
export default MainSidebar;