import { Avatar, Menu, MenuItem } from '@mui/material';
import React from 'react';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationsModal from '@/components/shared/header/NotificationsModal';

function Header({ toggleSidebar }) {
    const { user, logout } = useAuth()
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleAvatarClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
        const { lang, setLanguage, currentLang } = useLanguage();

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
            setLanguage(code);
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
                    <div className="profile-icon">🔔</div>
                    {/* Language Switcher as circular flag image */}
                    <div className="profile-icon" onClick={handleLangIconClick} style={{ cursor: 'pointer', padding: 0 }}>
                        <img
                            src={currentLang === 'en' ? '/images/flags/4x3/us.svg' : '/images/flags/4x3/vn.svg'}
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
                            selected={currentLang === 'en'}
                            onClick={() => handleLanguageChange('en')}
                        >
                            <img src="/images/flags/4x3/us.svg" alt="English" style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }} />
                            English
                        </MenuItem>
                        <MenuItem
                            selected={currentLang === 'vi'}
                            onClick={() => handleLanguageChange('vi')}
                        >
                            <img src="/images/flags/4x3/vn.svg" alt="Vietnamese" style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }} />
                            Vietnamese
                        </MenuItem>
                    </Menu>
                    <Avatar
                        src={'/images/avatar/Profile.png'}
                        onClick={handleAvatarClick}
                        sx={{
                            color: '#000',
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: '#FFF9ED'
                            }
                        }}
                    >
                        <PersonOutlineIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            sx: {
                                minWidth: 180,
                                borderRadius: 3,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                                p: 0.5,
                            }
                        }}
                    >
                        <div style={{ padding: '8px 16px', fontWeight: 600, fontSize: '1.05rem', color: '#555' }}>
                            {user?.name || 'Offtaker User'}
                        </div>
                        <div style={{ borderBottom: '1px solid #eee', margin: '0 8px' }} />
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
                                    color: '#1976d2',
                                    '& .MuiSvgIcon-root': {
                                        color: '#1976d2',
                                    }
                                },
                            }}
                        >
                            <LogoutOutlinedIcon sx={{ mr: 2, fontSize: 26, color: '#000', transition: 'color 0.2s' }} />
                            {lang('header.logout')}
                        </MenuItem>
                    </Menu>
                </div>
            </div>
        </div>
    );
}

export default Header;