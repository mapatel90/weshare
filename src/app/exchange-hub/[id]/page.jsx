'use client'

import React from 'react'
import HomeNavbar from '@/components/home/HomeNavbar'
import HomeFooter from '@/components/home/HomeFooter'
import ProjectDetail from '@/components/exchange-hub/ProjectDetail'
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

      {/* Project Detail Content */}
      <ProjectDetail projectId={params.id} />

      {/* Footer */}
      <HomeFooter />
    </>
  )
}

export default ProjectDetailPage
