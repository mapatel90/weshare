'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Container, Typography, Button } from '@mui/material'
import Image from 'next/image'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useLanguage } from '@/contexts/LanguageContext'

const HeroSection = () => {
  const { lang } = useLanguage()
  const router = useRouter()
  
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    })
  }, [])

  return (
    <Box 
      component="section" 
      className="hero-section"
      sx={{
        background: 'linear-gradient(rgba(16, 44, 65, 0.7), rgba(16, 44, 65, 0.7)), url(../images/banner/banner-img.png) center / cover no-repeat',
        color: 'white',
        py: 10,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Container maxWidth="lg">
        <Box 
          className="hero-content" 
          textAlign="center"
          data-aos="fade-up"
        >
          <Typography 
            variant="h6" 
            className="smallText"
            sx={{ 
              color: '#F6A623', 
              fontWeight: 700, 
              mb: 2,
              fontSize: { xs: '1.1rem', md: '1.5rem' }
            }}
          >
            {lang('home.hero.tagline')}
          </Typography>
          
          <Typography 
            variant="h1" 
            className="hero-title"
            sx={{ 
              fontWeight: 700, 
              mb: 4,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              lineHeight: 1.2
            }}
          >
            {lang('home.hero.title')}<br />{lang('home.hero.titleLine2')}
          </Typography>

          <Box data-aos="fade-up" data-aos-duration="1500">
            <Typography 
              variant="h6" 
              className="hero-subtitle"
              sx={{ 
                mb: 2.5,
                fontSize: { xs: '1rem', md: '1.25rem' },
                lineHeight: 1.6,
                maxWidth: '900px',
                mx: 'auto'
              }}
            >
              {lang('home.hero.subtitle1')}
            </Typography>
            
            <Typography 
              variant="h6" 
              className="hero-subtitle"
              sx={{ 
                mb: 2.5,
                fontSize: { xs: '1rem', md: '1.25rem' },
                lineHeight: 1.6,
                maxWidth: '900px',
                mx: 'auto'
              }}
            >
              {lang('home.hero.subtitle2')}
            </Typography>
            
            <Typography 
              variant="h6" 
              className="hero-subtitle"
              sx={{ 
                mb: 4,
                fontSize: { xs: '1rem', md: '1.25rem' },
                lineHeight: 1.6,
                maxWidth: '900px',
                mx: 'auto'
              }}
            >
              {lang('home.hero.subtitle3')}
            </Typography>
          </Box>

          <Button 
            variant="contained"
            size="large"
            onClick={() => router.push('/frontend/contact_us')}
            startIcon={
              <Image 
                src="/images/icons/phone.svg" 
                alt="Phone" 
                width={20} 
                height={20}
              />
            }
            data-aos="fade-up"
            sx={{
              backgroundColor: '#F6A623',
              color: '#fff',
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: '0px 4px 6px rgba(246, 166, 35, 0.25)',
              '&:hover': {
                backgroundColor: '#ff8000',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(255, 153, 51, 0.4)',
              },
              transition: 'all 0.3s'
            }}
          >
            {lang('home.hero.connectWithUs')}
          </Button>
        </Box>
      </Container>
    </Box>
  )
}

export default HeroSection
