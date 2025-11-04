'use client'

import React, { useState } from 'react'
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
import { useRouter } from 'next/navigation'

const HomeNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langAnchor, setLangAnchor] = useState(null)
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { lang, currentLanguage, changeLanguage, languages, currentLanguageInfo } = useLanguage()

  const navItems = [
    { name: lang('home.navbar.home'), href: '#home' },
    { name: lang('home.navbar.aboutUs'), href: '#rental' },
    { name: lang('home.navbar.exchangeHub'), href: '#economics' },
    { name: lang('home.navbar.howItWorks'), href: '#investors' },
    { name: lang('home.navbar.news'), href: '#news' }
  ]

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

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', pt: 2 }}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton sx={{ textAlign: 'center' }} href={item.href}>
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
        <Container maxWidth="lg">
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
                        color: '#000',
                        fontWeight: 500,
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

                {/* Login Button */}
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
