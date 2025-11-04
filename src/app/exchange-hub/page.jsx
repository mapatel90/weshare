'use client'

import React from 'react'
import HomeNavbar from '@/components/home/HomeNavbar'
import HomeFooter from '@/components/home/HomeFooter'
import ExchangeHub from '@/components/exchange-hub/ExchangeHub'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../../../public/css/home.css'
import '../../../public/css/responsive.css'

const ExchangeHubPage = () => {
  return (
    <>
      {/* Navbar */}
      <HomeNavbar />

      {/* Main Exchange Hub Content */}
      <ExchangeHub />

      {/* Footer */}
      <HomeFooter />
    </>
  )
}

export default ExchangeHubPage
