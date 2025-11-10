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
  useTheme
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const HomeNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langAnchor, setLangAnchor] = useState(null)
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
    { name: lang('home.navbar.aboutUs'), href: '#rental', id: 'rental' },
    { name: lang('home.navbar.exchangeHub'), href: '/exchange-hub', id: 'exchange-hub' },
    { name: lang('home.navbar.howItWorks'), href: '#investors', id: 'investors' },
    { name: lang('home.navbar.news'), href: '/news', id: 'news' },
    { name: lang('home.navbar.blog'), href: '/blog', id: 'blog' },
    { name: lang('home.navbar.contactUs'), href: '/contact_us', id: 'contact_us' }
  ]

  // Check if current pathname matches or if hash section is active
  useEffect(() => {
    // Check if we're on a specific page route
    if (pathname === '/exchange-hub') {
      setActiveSection('exchange-hub')
    } else if (pathname === '/') {
      // For home page, check hash
      const hash = window.location.hash.replace('#', '')
      setActiveSection(hash || 'home')
    }
  }, [pathname])

  // Listen for hash changes on the home page
  useEffect(() => {
    if (pathname === '/') {
      const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '')
        setActiveSection(hash || 'home')
      }

      window.addEventListener('hashchange', handleHashChange)
      return () => window.removeEventListener('hashchange', handleHashChange)
    }
  }, [pathname])

  const isActive = (item) => {
    // If it's a route (not a hash), check pathname
    if (item.href.startsWith('/') && !item.href.startsWith('/#')) {
      // Special case for home page - exact match only
      if (item.href === '/') {
        return pathname === '/'
      }
      // For other routes, check if pathname starts with the item's href (for nested routes)
      return pathname.startsWith(item.href)
    }
    // If it's a hash link, check active section
    return activeSection === item.id
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
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
      router.push('/offtaker/dashboards/analytics')
    } else if (user?.role === 4) {
      router.push('/investor/dashboards/analytics')
    } else {
      router.push('/admin/dashboards/analytics')
    }
    setUserAnchor(null)
  }

  const handleLogout = () => {
    logout()
    setUserAnchor(null)
  }

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', pt: 2 }}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton 
              sx={{ 
                textAlign: 'center',
                backgroundColor: isActive(item) ? '#FFF9ED' : 'transparent',
                color: isActive(item) ? '#F6A623' : '#000',
                fontWeight: isActive(item) ? 700 : 500,
                '&:hover': {
                  backgroundColor: '#FFF9ED',
                  color: '#F6A623'
                }
              }} 
              href={item.href}
            >
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton sx={{ textAlign: 'center' }} href="/login">
            <ListItemText primary={lang('home.navbar.login')} />
          </ListItemButton>
        </ListItem>
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

                {/* Language Selector */}
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
                <Menu
                  anchorEl={langAnchor}
                  open={Boolean(langAnchor)}
                  onClose={handleLangClose}
                >
                  <MenuItem 
                    onClick={() => handleLanguageChange('en')}
                    selected={currentLanguage === 'en'}
                  > 
                    {/* <img src="/images/flags/4x3/us.svg" alt="" style={{ width: 20, marginRight: 8 }} /> */}
                    English
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleLanguageChange('vi')}
                    selected={currentLanguage === 'vi'}
                  >
                    {/* <img src="/images/flags/4x3/vn.svg" alt="" style={{ width: 20, marginRight: 8 }} /> */}
                    Tiếng Việt
                  </MenuItem>
                </Menu>

                {/* Login Button or User Icon */}
                {user ? (
                  <>
                    <IconButton
                      onClick={handleUserClick}
                      sx={{
                        color: '#000',
                        '&:hover': {
                          backgroundColor: '#FFF9ED'
                        }
                      }}
                    >
                      <PersonOutlineIcon sx={{ fontSize: 28 }} />
                    </IconButton>
                    <Menu
                      anchorEl={userAnchor}
                      open={Boolean(userAnchor)}
                      onClose={handleUserClose}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          minWidth: 200
                        }
                      }}
                    >
                      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #eee' }}>
                        <Box sx={{ fontWeight: 600, color: '#000' }}>{user.name}</Box>
                        <Box sx={{ fontSize: '0.85rem', color: '#666' }}>{user.email}</Box>
                      </Box>
                      <MenuItem onClick={handleProfile}>
                        <PersonOutlineIcon sx={{ mr: 1, fontSize: 20 }} />
                        Dashboard
                      </MenuItem>
                      <MenuItem onClick={handleLogout} sx={{ color: '#d32f2f' }}>
                        <Box component="span" sx={{ mr: 1, fontSize: 20 }}>🚪</Box>
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
                  sx={{ color: '#000' }}
                >
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>☰</span>
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  )
}

export default HomeNavbar
