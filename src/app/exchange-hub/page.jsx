'use client'

import React from 'react'
import HomeNavbar from '@/components/frontend/home/HomeNavbar'
import HomeFooter from '@/components/frontend/home/HomeFooter'
import ExchangeHub from '@/components/frontend/exchange-hub/ExchangeHub'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/styles/css/responsive.css'
import DynamicTitle from '@/components/common/DynamicTitle'

const ExchangeHubPage = () => {
  return (
    <>
      <DynamicTitle titleKey="home.exchangeHub.title" />

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
