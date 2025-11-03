'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'

const PortfolioSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  const stats = [
    {
      icon: '/images/icons/port-icon1.svg',
      value: '8479.2K',
      label: 'Total kWh Generated',
      growth: '+2.4%'
    },
    {
      icon: '/images/icons/port-icon2.svg',
      value: '$5.6M',
      label: 'Total Investor Income',
      growth: '+8.7'
    },
    {
      icon: '/images/icons/port-icon3.svg',
      value: '2.6M',
      label: 'Total Oftaker Savings',
      growth: '+3.0'
    },
    {
      icon: '/images/icons/port-icon4.svg',
      value: '19.2%',
      label: 'Average ROI',
      growth: '+1.8'
    },
    {
      icon: '/images/icons/port-icon5.svg',
      value: '900K tons',
      label: 'CO₂ Avoided',
      growth: '+2.4%'
    }
  ]

  return (
    <section className="portfolio blockSpacing" data-aos="fade-up">
      <div className="container">
        <div className="row mb-5">
          <div className="col-12 col-md-6 d-flex">
            <Image src="/images/icons/port-icon.svg" alt="portfolio" width={40} height={40} />
            <h3 className="subTitle ms-3 mb-0">Portfolio Overview</h3>
          </div>
          <div className="col-12 col-md-6 text-end">
            <div className="updateBox">
              <span></span> Updated 2s ago
            </div>
          </div>
        </div>
        <div className="elementBlockGroup">
          {stats.map((stat, index) => (
            <div key={index} className="elementBlock">
              <div className="energy-card shadow-sm">
                <div className="d-flex align-items-start justify-content-between w-100 gap-3 mb-4">
                  <div className="icon-box d-flex align-items-center justify-content-center rounded-3">
                    <span>
                      <Image src={stat.icon} alt="icon" width={24} height={24} />
                    </span>
                  </div>
                  <div className="badge-box position-relative">
                    <span className="growth-badge">{stat.growth}</span>
                    <span className="dot"></span>
                  </div>
                </div>
                <div>
                  <h3 className="mb-0">{stat.value}</h3>
                  <small className="tw-300">{stat.label}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PortfolioSection
