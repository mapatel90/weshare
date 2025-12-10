'use client'

import React, { useState, useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  Container,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Avatar,
  ListItemIcon,
  Typography
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const HomeNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langAnchor, setLangAnchor] = useState(null)
  const [mobileLangOpen, setMobileLangOpen] = useState(false)
  const [userAnchor, setUserAnchor] = useState(null)
  const [activeSection, setActiveSection] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { lang, currentLanguage, changeLanguage, languages, currentLanguageInfo } = useLanguage()
  const { user, logout } = useAuth()

  const navItems = [
    { name: lang('home.navbar.home'), href: '/', id: 'home' },
    { name: lang('home.navbar.aboutUs'), href: '/#about-us', id: 'about-us' },
    { name: lang('home.navbar.exchangeHub'), href: '/frontend/exchange-hub', id: 'exchange-hub' },
    { name: lang('home.navbar.howItWorks'), href: '/#how-it-works', id: 'how-it-works' },
    { name: lang('home.navbar.news'), href: '/frontend/news', id: 'news' },
    { name: lang('home.navbar.blog'), href: '/frontend/blog', id: 'blog' },
    { name: lang('home.navbar.contactUs'), href: '/frontend/contact_us', id: 'contact_us' }
  ]

  // Check if current pathname matches or if hash section is active
  useEffect(() => {
    // Check if we're on a specific page route
    if (pathname === '/exchange-hub') {
      setActiveSection('exchange-hub')
    } else if (pathname === '/' && typeof window !== 'undefined') {
      // For home page, check hash
      const hash = window.location.hash.replace('#', '')
      setActiveSection(hash || 'home')
    }
  }, [pathname])

  // Listen for hash changes on the home page
  useEffect(() => {
    if (pathname === '/' && typeof window !== 'undefined') {
      const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '')
        setActiveSection(hash || 'home')
      }

      window.addEventListener('hashchange', handleHashChange)
      return () => window.removeEventListener('hashchange', handleHashChange)
    }
  }, [pathname])

  const isActive = (item) => {
    // If it's a hash link (e.g. '/#about-us'), use activeSection
    if (item.href.startsWith('/#')) {
      return activeSection === item.id
    }

    // Special case for home - only active when on root AND the active section is 'home'
    if (item.href === '/') {
      return pathname === '/' && activeSection === 'home'
    }

    // For other routes, check if pathname starts with the item's href (for nested routes)
    return pathname.startsWith(item.href)
  }

  const handleDrawerToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleLangClick = (event) => {
    setLangAnchor(event.currentTarget)
  }

  const handleLangClose = () => {
    setLangAnchor(null)
  }

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode)
    setLangAnchor(null)
    setMobileLangOpen(false)
  }

  const handleUserClick = (event) => {
    setUserAnchor(event.currentTarget)
  }

  const handleUserClose = () => {
    setUserAnchor(null)
  }

  const handleProfile = () => {
    // Navigate to dashboard based on user role
    if (user?.role === 3) {
      router.push('/offtaker/projects')
    } else if (user?.role === 4) {
      router.push('/investor/projects')
    } else {
      router.push('/admin/dashboards')
    }
    setUserAnchor(null)
  }
  
  const handleProjects = () => {
    // Navigate to dashboard based on user role
    if (user?.role === 3) {
      router.push('/offtaker/projects')
    } else if (user?.role === 4) {
      router.push('/investor/projects')
    } else {
      router.push('/admin/projects/list')
    }
    setUserAnchor(null)
  }

  const handleLogout = () => {
    logout()
    setUserAnchor(null)
  }

  const mobileUserMenu = (
    <Menu
      anchorEl={userAnchor}
      open={Boolean(userAnchor)}
      onClose={handleUserClose}
      PaperProps={{
        sx: {
          mt: 1,
          borderRadius: 3,
          boxShadow: '0px 6px 25px rgba(0,0,0,0.15)',
          border: '1px solid #e0e0e0',
          minWidth: 220
        },
      }}
    >
      <MenuItem onClick={handleProfile}>My Profile</MenuItem>

      <MenuItem
        onClick={() => {
          router.push('/my-projects')
          handleUserClose()
        }}
      >
        My Projects
      </MenuItem>

      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  )

  // Mobile menu content - shown below navbar
  const mobileMenu = (
    <Box
      sx={{
        backgroundColor: '#1e3a4a',
        pb: 1,
        margin: '5px 30px 10px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'slideDown 0.3s ease-out',
        '@keyframes slideDown': {
          from: {
            opacity: 0,
            transform: 'translateY(-20px)'
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }
      }}
    >

      {user && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <Avatar
            src={user?.user_image || '/images/avatar/Profile.png'}
            sx={{ width: 48, height: 48, cursor: 'pointer' }}
            onClick={handleUserClick}
          />
        </Box>
      )}
      {mobileUserMenu}

      <List sx={{ py: 0 }}>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton
              onClick={() => setMobileMenuOpen(false)}
              sx={{
                textAlign: 'center',
                backgroundColor: isActive(item) ? 'rgba(246, 166, 35, 0.1)' : 'transparent',
                color: isActive(item) ? '#F6A623' : '#fff',
                fontWeight: isActive(item) ? 700 : 500,
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                // py: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(246, 166, 35, 0.1)',
                  color: '#F6A623'
                }
              }}
              href={item.href}
            >
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Language selector for mobile */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setMobileLangOpen(!mobileLangOpen)}
            sx={{
              textAlign: 'center',
              justifyContent: 'center',
              color: '#fff',
              borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              // py: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(246, 166, 35, 0.1)'
              }
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 600, color: '#fff' }}>{currentLanguageInfo?.name || 'English'}</Typography>
                  <KeyboardArrowDownIcon
                    fontSize="small"
                    sx={{
                      color: '#fff',
                      transform: mobileLangOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </Box>
              }
            />
          </ListItemButton>
        </ListItem>

        {/* Language dropdown options - shown inside mobile menu */}
        {mobileLangOpen && (
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              mx: 2,
              my: 1,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              animation: 'fadeIn 0.3s ease-out',
              '@keyframes fadeIn': {
                from: {
                  opacity: 0,
                  transform: 'translateY(-10px)'
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              }
            }}
          >
            {Object.values(languages || {}).map((lng, index) => (
              <Box key={lng.code}>
                <ListItem
                  disablePadding
                >
                  <ListItemButton
                    onClick={() => handleLanguageChange(lng.code)}
                    sx={{
                      // py: 1.5,
                      justifyContent: 'center',
                      backgroundColor: currentLanguage === lng.code ? 'rgba(246, 166, 35, 0.1)' : 'transparent',
                      color: currentLanguage === lng.code ? '#F6A623' : '#1e3a4a',
                      fontWeight: currentLanguage === lng.code ? 600 : 500,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(246, 166, 35, 0.15)',
                        color: '#F6A623'
                      }
                    }}
                  >
                    <ListItemText
                      primary={lng.name}
                      sx={{ textAlign: 'center' }}
                    />
                  </ListItemButton>
                </ListItem>
                {index < Object.values(languages || {}).length - 1 && (
                  <Box sx={{ borderBottom: '1px solid rgba(30, 58, 74, 0.1)', mx: 2 }} />
                )}
              </Box>
            ))}
          </Box>
        )}

        {!user && (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => setMobileMenuOpen(false)}
              sx={{
                textAlign: 'center',
                color: '#fff',
                // py: 2,
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.2s ease',
                gap: 1,
                '&:hover': {
                  backgroundColor: 'rgba(246, 166, 35, 0.1)'
                }
              }}
              href="/login"
            >
              <PersonOutlineIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontWeight: 500 }}>{lang('home.navbar.login')}</Typography>
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  )

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          py: 1
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: '1345px' }}>
          <Toolbar disableGutters>
            {/* Logo */}
            <Box sx={{ flexGrow: 0, mr: 4 }}>
              <Link href="/">
                <Image
                  src="/images/logo/header-logo.svg"
                  alt="weShare logo"
                  width={120}
                  height={40}
                  style={{ cursor: 'pointer' }}
                />
              </Link>
            </Box>

            {/* Desktop Menu */}
            {!isMobile && (
              <>
                <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                  {navItems.map((item) => (
                    <Button
                      key={item.name}
                      href={item.href}
                      sx={{
                        color: isActive(item) ? '#F6A623' : '#000',
                        fontWeight: isActive(item) ? 700 : 500,
                        textTransform: 'capitalize',
                        '&:hover': {
                          color: '#F6A623',
                          fontWeight: 700
                        }
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                </Box>

                {/* Language Selector (desktop) */}
                <Button
                  onClick={handleLangClick}
                  endIcon={<KeyboardArrowDownIcon />}
                  sx={{
                    color: '#000',
                    mr: 2,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  {currentLanguageInfo?.name || 'English'}
                </Button>

                {/* Login Button or User Icon */}
                {user ? (
                  <>
                    <Avatar
                      src={user?.user_image || '/images/avatar/Profile.png' || ''}
                      onClick={handleUserClick}
                      sx={{
                        color: '#000',
                        '&:hover': {
                          backgroundColor: '#FFF9ED'
                        }
                      }}
                    >
                      <PersonOutlineIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Menu
                      anchorEl={userAnchor}
                      open={Boolean(userAnchor)}
                      onClose={handleUserClose}
                      PaperProps={{
                        sx: {
                          mt: 1.5,
                          borderRadius: 3,
                          boxShadow: '0px 6px 25px rgba(0,0,0,0.15)',
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fff',
                          minWidth: 250,
                          p: 1,
                        },
                      }}
                    >
                      <MenuItem
                        onClick={handleProfile}
                        sx={{
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 500,
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: '#f8f9fb',
                          },
                        }}
                      >
                        <PersonOutlineIcon sx={{ mr: 2, fontSize: 26, color: '#000' }} />
                        My Profile
                      </MenuItem>

                      <MenuItem
                        onClick={handleProjects}
                        sx={{
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 500,
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: '#f8f9fb',
                          },
                        }}
                      >
                        <AccountTreeOutlinedIcon sx={{ mr: 2, fontSize: 26, color: '#000' }} />
                        My Projects
                      </MenuItem>

                      <MenuItem
                        onClick={handleLogout}
                        sx={{
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 500,
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: '#f8f9fb',
                          },
                        }}
                      >
                        <LogoutOutlinedIcon sx={{ mr: 2, fontSize: 26, color: '#000' }} />
                        Logout
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Button
                    variant="text"
                    startIcon={<PersonOutlineIcon />}
                    onClick={() => router.push('/login')}
                    sx={{
                      color: '#000',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: '#F6A623'
                      }
                    }}
                  >
                    {lang('home.navbar.login')}
                  </Button>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{
                    color: '#000',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>☰</span>
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Menu - Collapsed below navbar */}
      {isMobile && mobileMenuOpen && (
        <Box sx={{ width: '100%' }}>
          {mobileMenu}
        </Box>
      )}

      {/* Language Menu (render once so it's available on mobile + desktop) */}
      <Menu
        anchorEl={langAnchor}
        open={Boolean(langAnchor)}
        onClose={handleLangClose}
      >
        {Object.values(languages || {}).map((lng) => (
          <MenuItem
            key={lng.code}
            onClick={() => handleLanguageChange(lng.code)}
            selected={currentLanguage === lng.code}
          >
            {/* If flags are available in language objects, you can render them here */}
            {lng.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default HomeNavbar