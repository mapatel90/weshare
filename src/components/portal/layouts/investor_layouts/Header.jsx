'use client';
import { Avatar, Menu, MenuItem } from '@mui/material';
import React from 'react';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationsModal from '@/components/shared/header/NotificationsModal';
import { buildUploadUrl, getFullImageUrl } from '@/utils/common';

function Header({ toggleSidebar }) {
    const { user, logout } = useAuth()
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleAvatarClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const { lang, changeLanguage, currentLanguage } = useLanguage();

    // Language menu state
    const [langAnchorEl, setLangAnchorEl] = React.useState(null);
    const langMenuOpen = Boolean(langAnchorEl);

    const handleLangIconClick = (event) => {
        setLangAnchorEl(event.currentTarget);
    };
    const handleLangMenuClose = () => {
        setLangAnchorEl(null);
    };
    const handleLanguageChange = (code) => {
        changeLanguage(code);
        setLangAnchorEl(null);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        // Add your logout logic here
        logout()
        setAnchorEl(null)
    };
    const handleProfileClick = () => {
        // Add your profile navigation logic here
        window.location.href = '/investor/myprofile';
        setAnchorEl(null)
    };

    const handleToggle = (e) => {
        if (typeof toggleSidebar === 'function') {
            toggleSidebar(e);
        } else {
            // fallback: toggle a body class so existing CSS can react
            document.body.classList.toggle('sidebar-collapsed');
        }
    };

    return (
        <div className="header">
            <div className="header-left">
                <div className="toggle-btn" id="toggleBtn" onClick={handleToggle}>☰</div>
                <div className="header-title">
                    {/* <h1>Energy Dashboard</h1>
                    <p>Monitor your solar energy consumption and savings</p> */}
                </div>
            </div>
            <div className="header-right">
                <div className="profile-icons">
                    <NotificationsModal />
                    {/* Language Switcher as circular flag image */}
                    <div className="profile-icon" onClick={handleLangIconClick} style={{ cursor: 'pointer', padding: 0 }}>
                        <img
                            src={currentLanguage === 'en' ? '/images/flags/4x3/us.svg' : '/images/flags/4x3/vn.svg'}
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
                        />
                    </div>
                    <Menu
                        anchorEl={langAnchorEl}
                        open={langMenuOpen}
                        onClose={handleLangMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem
                            selected={currentLanguage === 'en'}
                            onClick={() => handleLanguageChange('en')}
                        >
                            <img src="/images/flags/4x3/us.svg" alt="English" style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }} />
                            English
                        </MenuItem>
                        <MenuItem
                            selected={currentLanguage === 'vi'}
                            onClick={() => handleLanguageChange('vi')}
                        >
                            <img src="/images/flags/4x3/vn.svg" alt="Vietnamese" style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }} />
                            Vietnamese
                        </MenuItem>
                    </Menu>
                    <Avatar
                        src={buildUploadUrl(user?.avatar) || '/images/avatar/default-avatar.png'}
                        onClick={handleAvatarClick}
                        sx={{
                            width: 40,
                            height: 40,
                            color: '#000',
                            cursor: 'pointer',
                            border: '2px solid #f0f0f0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s',
                            '&:hover': {
                                backgroundColor: '#FFF9ED',
                                borderColor: '#F6A623',
                                transform: 'scale(1.05)'
                            }
                        }}
                        alt={user?.name || 'User Avatar'}
                    >
                        {!user?.avatar && <PersonOutlineIcon sx={{ fontSize: 28 }} />}
                    </Avatar>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            sx: {
                                minWidth: 220,
                                borderRadius: 3,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                                p: 0.5,
                            }
                        }}
                    >
                        <div style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            borderBottom: '1px solid #eee',
                            marginBottom: '8px'
                        }}>
                            <Avatar
                                src={buildUploadUrl(user?.avatar) || '/images/avatar/default-avatar.png'}
                                sx={{
                                    width: 48,
                                    height: 48,
                                    border: '2px solid #f0f0f0',
                                }}
                                alt={user?.name || 'User Avatar'}
                            >
                                {!user?.avatar && <PersonOutlineIcon sx={{ fontSize: 24 }} />}
                            </Avatar>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#333' }}>
                                    {user?.name || 'Investor User'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    {user?.email || ''}
                                </div>
                            </div>
                        </div>
                        <MenuItem onClick={() => { handleProfileClick(); }}
                            sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 500,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                mt: 0.5,
                                mb: 0.5,
                                transition: 'background 0.2s',
                                '&:hover': {
                                    backgroundColor: '#f8f9fb',
                                    color: '#F6A623',
                                    '& .MuiSvgIcon-root': {
                                        color: '#F6A623',
                                    }
                                },
                            }}
                        >
                            <PersonOutlineIcon sx={{ mr: 2, fontSize: 26, color: '#000', transition: 'color 0.2s', marginRight: 0 }} />
                            {lang('page_title.myprofile', 'My Profile')}
                        </MenuItem>
                        <MenuItem
                            onClick={handleLogout}
                            sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 500,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                mt: 0.5,
                                mb: 0.5,
                                transition: 'background 0.2s',
                                '&:hover': {
                                    backgroundColor: '#f8f9fb',
                                    color: '#F6A623',
                                    '& .MuiSvgIcon-root': {
                                        color: '#F6A623',
                                    }
                                },
                            }}
                        >
                            <LogoutOutlinedIcon sx={{ mr: 2, fontSize: 26, color: '#000', transition: 'color 0.2s', marginRight: 0 }} />
                            {lang('header.logout')}
                        </MenuItem>
                    </Menu>
                </div>
            </div>
        </div>
    );
}

export default Header;