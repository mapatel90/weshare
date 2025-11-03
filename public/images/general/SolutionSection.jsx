'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'

const SolutionSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="solution-section blockSpacing">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-6" data-aos="fade-right">
            <div className="mission-card">
              <h2 className="section-title mb-2">Our Solutions</h2>
              <h3 className="section-subtitle mb-4 fs-34">Accelerating the Transition to Clean, Shared Energy</h3>
              <p className="fs-18 fw-500 mb-3">
                At WeShare, we provide an integrated solar leasing platform that connects investors, households, and businesses through real, measurable solar projects.
              </p>
              <p className="fs-18 fw-500 mb-3">
                Our solution makes adopting clean energy simple, transparent, and rewarding — from investment to installation, operation, and long-term returns.
              </p>
              <Image src="/images/general/solution.png" alt="Solar Solution" className="mission-image img-thubnail" width={600} height={300} />
            </div>
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <div className="mission-card bg-grey cardPading">
              <h2 className="section-title fw-600 mb-3 fs-32">Empowering Growth Through Smart Solar Leasing</h2>
              <p className="fs-18 fw-500 pe-4">
                With advanced technology and transparent operations, WeShare turns every solar lease project into a seamless, data-driven investment experience.
              </p>
              <p className="fs-18 fw-500">
                Our platform combines real-time monitoring, financial analytics, and long-term management — ensuring efficiency, impact, and profitability for all stakeholders.
              </p>
              <ul className="checkmark-list bg-white">
                <li>Simplifying renewable project ownership</li>
                <li>Maximizing performance with real-time analytics</li>
                <li>Enabling investors to create measurable, lasting value</li>
              </ul>
              <button className="btn btn-primary-custom mt-3">
                Visit Exchange Hub 
                <Image className="ms-2" src="/images/icons/right-white.svg" alt="arrow" width={20} height={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SolutionSection
