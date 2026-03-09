'use client'

import React from 'react'
import Box from '@mui/material/Box'
import HomeNavbar from '@/components/frontend/home/HomeNavbar'
import HomeFooter from '@/components/frontend/home/HomeFooter'
import ProjectDetail from '@/components/frontend/exchange-hub/ProjectDetail'
import 'bootstrap/dist/css/bootstrap.min.css'
// import '../../../../public/css/responsive.css'
import '@/styles/css/responsive.css'
import DynamicTitle from '@/components/common/DynamicTitle'

const ProjectDetailPage = ({ params }) => {
  return (
    <>
      <DynamicTitle titleKey="home.exchangeHub.title" />
      {/* Navbar */}
      <HomeNavbar />

      {/* Offset for fixed navbar on mobile only */}
      <Box sx={{ height: { xs: '64px', md: 0 } }} />

      {/* Project Detail Content */}
      <ProjectDetail projectId={params.id} />

      {/* Footer */}
      <HomeFooter />
    </>
  )
}

export default ProjectDetailPage
