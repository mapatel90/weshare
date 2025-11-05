'use client'

import React from 'react'
import HomeNavbar from '@/components/home/HomeNavbar'
import HomeFooter from '@/components/home/HomeFooter'
import ProjectDetail from '@/components/exchange-hub/ProjectDetail'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../../../../public/css/responsive.css'

const ProjectDetailPage = ({ params }) => {
  return (
    <>
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
