'use client'

import React from 'react'
import HeroSection from '@/components/home/sections/HeroSection'
import FeatureSection from '@/components/home/sections/FeatureSection'
import MissionSection from '@/components/home/sections/MissionSection'
import VisionSection from '@/components/home/sections/VisionSection'
import SolutionSection from '@/components/home/sections/SolutionSection'
import HowItWorksSection from '@/components/home/sections/HowItWorksSection'
import PortfolioSection from '@/components/home/sections/PortfolioSection'
import InvestmentMarketplace from '@/components/home/sections/InvestmentMarketplace'
import ProjectsSection from '@/components/home/sections/ProjectsSection'
import SolarLeaseSection from '@/components/home/sections/SolarLeaseSection'
import NewsSection from '@/components/home/sections/NewsSection'
import EnergySection from '@/components/home/sections/EnergySection'
import TestimonialSection from '@/components/home/sections/TestimonialSection'
import CTASection from '@/components/home/sections/CTASection'
import SubmitSection from '@/components/home/sections/SubmitSection'
import HomeNavbar from '@/components/home/HomeNavbar'
import HomeFooter from '@/components/home/HomeFooter'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../../../public/css/home.css'
import '../../../public/css/responsive.css'

const HomePage = () => {
  return (
    <>
      {/* Navbar */}
      <HomeNavbar />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Feature Section */}
      <FeatureSection />
      
      {/* Mission Section */}
      <MissionSection />
      
      {/* Vision Section */}
      <VisionSection />
      
      {/* Solution Section */}
      <SolutionSection />
      
      {/* How It Works Section */}
      <HowItWorksSection />
      
      {/* Portfolio Overview Section */}
      <PortfolioSection />
      
      {/* Investment Marketplace */}
      <InvestmentMarketplace />
      
      {/* Projects Section */}
      <ProjectsSection />
      
      {/* Solar Lease Section */}
      <SolarLeaseSection />
      
      {/* News Section */}
      <NewsSection />
      
      {/* Energy Section */}
      <EnergySection />
      
      {/* Testimonial Section */}
      <TestimonialSection />
      
      {/* CTA Section */}
      <CTASection />
      
      {/* Submit Section */}
      <SubmitSection />
      
      {/* Footer */}
      <HomeFooter />
    </>
  )
}

export default HomePage
